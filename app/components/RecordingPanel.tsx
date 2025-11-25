"use client";

import React, { useEffect, useRef, useReducer, useState } from "react";
import { io, Socket } from "socket.io-client";
import ToastContainer, { emitToast } from './Toast';
import Modal from './Modal';
import { MicrophoneIcon, GlobeIcon, PlayIcon, PauseIcon, StopIcon, SaveIcon, WarningIcon, CheckIcon, SparkleIcon, DownloadIcon, VolumeIcon, InfoIcon, DocumentIcon } from './Icons';

enum SessionStatus {
  IDLE = 'IDLE',
  RECORDING = "RECORDING",
  PAUSED = "PAUSED",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR"
}

type State = { status: SessionStatus };
type Action = { type: 'START' } | { type: 'PAUSE' } | { type: 'RESUME' } | { type: 'PROCESS' } | { type: 'COMPLETE' } | { type: 'ERROR' } | { type: 'IDLE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START': return { status: SessionStatus.RECORDING };
    case 'PAUSE': return { status: SessionStatus.PAUSED };
    case 'RESUME': return { status: SessionStatus.RECORDING };
    case 'PROCESS': return { status: SessionStatus.PROCESSING };
    case 'COMPLETE': return { status: SessionStatus.COMPLETED };
    case 'ERROR': return { status: SessionStatus.ERROR };
    case 'IDLE': default: return { status: SessionStatus.IDLE };
  }
}

export default function RecordingPanel() {
  const [state, dispatch] = useReducer(reducer, { status: SessionStatus.IDLE });
  const status = state.status;
  const [finalTranscript, setFinalTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const blobZeroCountRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sequenceRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const recognitionRef = useRef<any | null>(null);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState<boolean>(false);
  const [inputType, setInputType] = useState<'mic' | 'tab'>('mic');
  const inputTypeRef = useRef<'mic' | 'tab'>(inputType);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);
  const [isActionItemsOpen, setIsActionItemsOpen] = useState<boolean>(false);
  const [format, setFormat] = useState<'plain'|'md'|'srt'>('plain');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [lastBlobSize, setLastBlobSize] = useState<number>(0);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<Array<{ timestamp: number; text: string }>>([]);
  const voiceCommandRecognitionRef = useRef<any | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>('none');
  const [translatedTranscript, setTranslatedTranscript] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const translationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-translate transcript when language changes or transcript updates
  useEffect(() => {
    if (targetLanguage === 'none' || !finalTranscript.trim()) {
      setTranslatedTranscript('');
      return;
    }

    // Debounce translation requests
    if (translationTimerRef.current) {
      clearTimeout(translationTimerRef.current);
    }

    translationTimerRef.current = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: finalTranscript,
            targetLanguage: targetLanguage
          })
        });
        const data = await response.json();
        if (response.ok && data.translatedText) {
          setTranslatedTranscript(data.translatedText);
        }
      } catch (error) {
        console.error('Translation error:', error);
      } finally {
        setIsTranslating(false);
      }
    }, 1000); // Wait 1 second after last transcript update
  }, [finalTranscript, targetLanguage]);

  // Return a combined transcript while avoiding simple duplication
  function getCombinedTranscript() {
    const base = (finalTranscript || '').trim();
    const inter = (interimTranscript || '').trim();
    if (!base) return inter || '';
    if (!inter) return base;
    if (base.endsWith(inter)) return base;
    // find overlap between end of base and start of inter
    const maxOverlap = Math.min(base.length, inter.length);
    let overlap = 0;
    for (let i = maxOverlap; i > 0; i--) {
      if (base.slice(-i) === inter.slice(0, i)) { overlap = i; break; }
    }
    return base + (overlap ? '' : '\n') + inter.slice(overlap);
  }

  // Append a server-provided final chunk while avoiding duplicates/overlap
  function appendUniqueFinal(newText: string) {
    const t = (newText || '').trim();
    if (!t) return;
    setFinalTranscript((prev) => {
      const prevTrim = (prev || '').trim();
      if (!prevTrim) return t;
      if (prevTrim.endsWith(t)) return prevTrim;
      const maxOverlap = Math.min(prevTrim.length, t.length);
      let overlap = 0;
      for (let i = maxOverlap; i > 0; i--) {
        if (prevTrim.slice(-i) === t.slice(0, i)) { overlap = i; break; }
      }
      return prevTrim + (overlap ? '' : '\n') + t.slice(overlap);
    });
  }
  

  function secondsToSrt(ts: number) {
    const hours = Math.floor(ts / 3600);
    const minutes = Math.floor((ts % 3600) / 60);
    const seconds = Math.floor(ts % 60);
    const millis = Math.floor((ts - Math.floor(ts)) * 1000);
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${String(millis).padStart(3,'0')}`;
  }

  function toSrt(text: string) {
    if (!text) return '';
    const words = text.split(/\s+/).filter(Boolean);
    const chunkSize = 12; // words per subtitle
    const duration = 4; // seconds per chunk
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      const part = words.slice(i, i + chunkSize).join(' ');
      const idx = Math.floor(i / chunkSize) + 1;
      const start = (idx - 1) * duration;
      const end = start + duration;
      const entry = `${idx}\n${secondsToSrt(start)} --> ${secondsToSrt(end)}\n${part}`;
      chunks.push(entry);
    }
    return chunks.join('\n\n');
  }

  function toMarkdown(text: string) {
    if (!text) return '';
    // Simple markdown: header + paragraph breaks from double newlines
    const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    const body = paras.map(p => p.replace(/\n/g, '  \n')).join('\n\n');
    return `# Transcript\n\n${body}`;
  }

  function formatTranscript(fmt: 'plain'|'md'|'srt', text: string) {
    if (!text) return '';
    if (fmt === 'md') return toMarkdown(text);
    if (fmt === 'srt') return toSrt(text);
    return text;
  }

  useEffect(() => {
    const socket = io(typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? 'http://localhost:4000' : `${window.location.protocol}//${window.location.hostname}:4000`) : 'http://localhost:4000');
    socketRef.current = socket;
    socket.on("connect", () => {
      console.log('Socket connected (client) id=', socket.id);
    });
    socket.on("transcriptUpdate", (payload: { text: string; isChunk?: boolean; sequence?: number }) => {
      const text = payload && payload.text ? String(payload.text) : '';
      const isChunk = payload && payload.isChunk === true;
      const sequence = payload && payload.sequence ? payload.sequence : 0;
      console.log('transcriptUpdate received (len):', text.length, 'isChunk:', isChunk, 'sequence:', sequence, 'preview:', text.slice(0,120));
      
      // For microphone recording: prefer client-side SpeechRecognition (skip server updates)
      // For tab recording: use server transcription chunks
      if (recognitionRef.current && !isChunk) {
        console.log('Skipping server transcriptUpdate because client SpeechRecognition is active');
        return;
      }
      
      // For chunk updates (isChunk=true), append incrementally for real-time display
      if (isChunk) {
        console.log(`📝 Appending chunk ${sequence} to transcript`);
        setFinalTranscript(prev => {
          const updated = prev ? prev + ' ' + text.trim() : text.trim();
          return updated;
        });
      } else {
        // Final complete transcript - replace everything
        setFinalTranscript(text);
        setInterimTranscript('');
      }
    });
    // Welcome message disabled - no need for placeholder
    socket.on('welcome', (payload: { message?: string }) => {
      // Silently acknowledge - no UI clutter
    });
    socket.on("statusChange", (payload: { status: string }) => {
      console.log('statusChange', payload);
      const s = String(payload && payload.status || '').toUpperCase();
      if (s === 'RECORDING') dispatch({ type: 'START' });
      else if (s === 'PAUSED') dispatch({ type: 'PAUSE' });
      else if (s === 'PROCESSING') dispatch({ type: 'PROCESS' });
      else if (s === 'COMPLETED') dispatch({ type: 'COMPLETE' });
      else if (s === 'ERROR') dispatch({ type: 'ERROR' });
      else dispatch({ type: 'IDLE' });
    });
    socket.on('sessionSaved', (payload: { session: any, transcript?: string, summary?: string, downloadUrl?: string, actionItems?: any[] }) => {
      console.log('sessionSaved event received:', payload && (payload.session ? payload.session.id : '(no session)'));
      const s = payload && payload.session;
      if (s) {
        // prefer server transcript if provided, and clear interim
        if (payload.transcript) setFinalTranscript(payload.transcript);
        else setFinalTranscript(s.transcript || '');
        setInterimTranscript('');
        // store summary for UI and show a gentle indicator/button
        const sum = payload.summary || s.summary || '';
        if (sum && String(sum).trim()) {
          setSummary(String(sum));
        }
        // store action items
        const items = payload.actionItems || s.actionItems || [];
        if (Array.isArray(items) && items.length > 0) {
          setActionItems(items);
          emitToast(`✅ Extracted ${items.length} action items`, 'success');
        }
        if (payload.downloadUrl || s.downloadUrl) {
          setDownloadUrl(String(payload.downloadUrl || s.downloadUrl));
        }
        // Transition to COMPLETED state when session is saved
        dispatch({ type: 'COMPLETE' });
        try { emitToast('Session saved', 'success'); } catch (e) {}
      } else {
        // no session body; clear summary
        setSummary('');
        setActionItems([]);
      }
    });

    socket.on('disconnect', (reason: any) => {
      console.log('Socket disconnected, reason=', reason);
    });

    socket.on('processing', () => {
      dispatch({ type: 'PROCESS' });
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setHasSpeechRecognition(true);
    } else {
      setHasSpeechRecognition(false);
    }

    // load lightweight user from localStorage
    try {
      const raw = localStorage.getItem('scribeai_user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      setUser(null);
    }

    // enumerate audio input devices
    (async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const list = await navigator.mediaDevices.enumerateDevices();
          const inputs = list.filter(d => d.kind === 'audioinput');
          setAudioDevices(inputs);
          // prefer a loopback-like device if present
          const preferred = inputs.find(d => /stereo mix|vb-audio|cable|loopback/i.test(d.label || ''));
          if (preferred) setSelectedDeviceId(preferred.deviceId);
        }
      } catch (e) {
        console.warn('Could not enumerate devices', e);
      }
    })();
  }, []);

  // Helper: explicit user-gesture test to request tab/share and expose stream for debugging
  async function testGetDisplayMedia() {
    if (!(navigator.mediaDevices as any).getDisplayMedia) {
      try { emitToast('getDisplayMedia not supported in this browser', 'error'); } catch (e) {}
      console.warn('getDisplayMedia not available');
      return;
    }
    try {
      try { emitToast('Requesting tab/share permission…', 'info'); } catch (e) {}
      const s = await (navigator.mediaDevices as any).getDisplayMedia({ audio: true, video: true });
      // prefer audio-only stream for downstream use
      const audioOnly = new MediaStream((s.getAudioTracks && s.getAudioTracks()) ? s.getAudioTracks() : []);
      try { (window as any).__lastStream = audioOnly; } catch (e) {}
      console.log('testGetDisplayMedia: got stream', s, 'audioTracks:', s.getAudioTracks(), 'audioOnlyTracks:', audioOnly.getAudioTracks());
      try { emitToast(`Tab/share granted — audioTracks=${s.getAudioTracks().length}`, 'success'); } catch (e) {}
      // stop tracks immediately — this was only for testing the permission/prompt
      try { (s.getTracks() || []).forEach((t: MediaStreamTrack) => t.stop()); } catch (e) {}
    } catch (err: any) {
      console.error('testGetDisplayMedia failed', err);
      try { emitToast(`Tab/share failed: ${err && err.message ? err.message : String(err)}`, 'error'); } catch (e) {}
    }
  }

  // keep ref in sync when user toggles input type in the UI
  useEffect(() => {
    inputTypeRef.current = inputType;
  }, [inputType]);

  // Try to (re)acquire a media stream with retry/backoff for interruptions
  async function acquireStream(inputType: "mic" | "tab" = "mic", attempts = 3) {
    try {
      // For tab sharing try getDisplayMedia first. Some browsers require video:true
      if (inputType === 'tab' && (navigator.mediaDevices as any).getDisplayMedia) {
        try {
          console.log('Attempting getDisplayMedia for tab/share (audio:true video:true)');
          try { emitToast('Requesting tab/share permission…', 'info'); } catch (e) {}
          // record attempt so dev can inspect from console
          try { (window as any).__lastGetDisplayMediaAttempt = Date.now(); } catch (e) {}
          // Some browsers only return audio when video:true is requested. Try video:true first.
          const s = await (navigator.mediaDevices as any).getDisplayMedia({ audio: true, video: true });
          // prefer an audio-only stream downstream
          const audioOnly = new MediaStream((s.getAudioTracks && s.getAudioTracks()) ? s.getAudioTracks() : []);
          if (audioOnly && audioOnly.getAudioTracks && audioOnly.getAudioTracks().length > 0) {
            try { (window as any).__lastStream = audioOnly; } catch (e) {}
            console.log('getDisplayMedia returned audio-only stream (from display) audioTracks:', audioOnly.getAudioTracks());
            return audioOnly;
          }
          // if we got a stream but no audio tracks, stop and fallback
          try { (s.getTracks() || []).forEach((t: MediaStreamTrack) => t.stop()); } catch (e) {}
          throw new Error('getDisplayMedia returned no audio');
        } catch (err) {
          console.warn('Tab-share getDisplayMedia failed or provided no audio:', err && (err as any).message ? (err as any).message : err);
          try { emitToast("No tab audio detected — make sure you check 'Share audio' in the picker. Falling back to microphone.", 'info'); } catch (e) {}
          // Fallback to microphone so the user can still record; user can re-try Test Tab Share
          return await navigator.mediaDevices.getUserMedia({ audio: true });
        }
      }
      // Default to microphone
      // If the user has selected a specific device, prefer it
      try {
        if (selectedDeviceId) {
          const constraints = { 
            audio: { 
              deviceId: { exact: selectedDeviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            } 
          };
          console.log('🎙️ Requesting microphone with constraints:', constraints);
          return await navigator.mediaDevices.getUserMedia(constraints);
        }
      } catch (e) {
        console.warn('Failed to get selected audio device, falling back to default microphone', e);
      }
      const defaultConstraints = { 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };
      console.log('🎙️ Requesting default microphone with constraints:', defaultConstraints);
      return await navigator.mediaDevices.getUserMedia(defaultConstraints);
    } catch (err) {
      if (attempts > 0) {
        await new Promise(r => setTimeout(r, 600));
        return acquireStream(inputType, attempts - 1);
      }
      throw err;
    }
  }

  // Voice command handler
  function handleVoiceCommand(commandText: string) {
    const text = commandText.toLowerCase();
    console.log('🎯 Processing voice command:', text);
    
    try {
      // Extract the command after "scribeai" or "scribe ai"
      const scribeaiIndex = text.indexOf('scribeai') !== -1 ? text.indexOf('scribeai') + 8 : text.indexOf('scribe ai') + 9;
      const command = text.slice(scribeaiIndex).trim();
      
      // Command: Mark as important / Create bookmark
      if (command.includes('mark this as important') || command.includes('bookmark') || command.includes('mark important')) {
        const timestamp = Date.now();
        const currentText = getCombinedTranscript();
        const recentText = currentText.split('\n').slice(-3).join(' ').slice(0, 100);
        setBookmarks(prev => [...prev, { timestamp, text: recentText }]);
        emitToast('⭐ Marked as important!', 'success');
        console.log('✅ Created bookmark:', recentText);
      }
      
      // Command: Create action item
      else if (command.includes('create action item') || command.includes('add task') || command.includes('add action')) {
        // Extract the action item description after the command
        const actionMatch = command.match(/(?:create action item|add task|add action)[:\s]+(.+)/i);
        const description = actionMatch ? actionMatch[1].trim() : 'Action item from voice command';
        
        const newActionItem = {
          type: 'TASK',
          description: description,
          assignee: null,
          deadline: null,
          timestamp: new Date().toISOString()
        };
        
        setActionItems(prev => [...prev, newActionItem]);
        emitToast(`✅ Action item added: ${description}`, 'success');
        console.log('✅ Created action item:', newActionItem);
      }
      
      // Command: Summarize last N minutes
      else if (command.includes('summarize')) {
        const minutesMatch = command.match(/(\d+)\s*(?:minute|min)/);
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 5;
        
        emitToast(`📝 Summarizing last ${minutes} minutes...`, 'info');
        
        // Get recent transcript (approximate by taking last portion)
        const fullText = getCombinedTranscript();
        const recentText = fullText.split('\n').slice(-20).join('\n'); // Last ~20 lines
        
        // Call Gemini API for quick summary
        fetch('/api/sessions/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: recentText, minutes })
        })
          .then(res => res.json())
          .then(data => {
            if (data.summary) {
              emitToast('📄 Quick summary generated!', 'success');
              setSummary(prevSum => `Quick Summary (last ${minutes} min):\n${data.summary}\n\n---\n\n${prevSum}`);
            }
          })
          .catch(err => {
            console.warn('Failed to generate quick summary:', err);
            emitToast('Failed to generate summary', 'error');
          });
      }
      
      // Command: Pause/Resume
      else if (command.includes('pause')) {
        if (status === SessionStatus.RECORDING) {
          pauseRecording();
          emitToast('⏸️ Paused by voice command', 'info');
        }
      }
      else if (command.includes('resume') || command.includes('continue')) {
        if (status === SessionStatus.PAUSED) {
          resumeRecording();
          emitToast('▶️ Resumed by voice command', 'success');
        }
      }
      
      // Command: Stop
      else if (command.includes('stop recording') || command.includes('end session')) {
        emitToast('⏹️ Stopping by voice command...', 'info');
        stopRecording();
      }
      
      // Unknown command
      else {
        console.log('❓ Unknown voice command:', command);
        emitToast(`Voice command not recognized: "${command}"`, 'info');
      }
    } catch (err) {
      console.error('Error processing voice command:', err);
    }
  }

  async function startRecording(inputType: "mic" | "tab" = "mic") {
    try {
      // remember requested input type for reconnect attempts
      inputTypeRef.current = inputType;
      
      // Check microphone permissions first
      if (inputType === 'mic') {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          console.log('🎤 Microphone permission status:', permissionStatus.state);
          if (permissionStatus.state === 'denied') {
            emitToast('Microphone access denied. Please allow microphone in browser settings.', 'error');
            return;
          }
        } catch (e) {
          console.warn('Could not check microphone permissions', e);
        }
      }
      
      const stream = await acquireStream(inputType, 2);
      currentStreamRef.current = stream;
      
      // Log audio track details for debugging
      const audioTracks = (stream && stream.getAudioTracks) ? stream.getAudioTracks() : [];
      console.log(`🎤 Audio tracks found: ${audioTracks.length}`, audioTracks.map(t => ({ 
        id: t.id, 
        label: t.label, 
        enabled: t.enabled, 
        muted: t.muted,
        readyState: t.readyState,
        settings: t.getSettings ? t.getSettings() : {}
      })));
      
      // CRITICAL: Ensure tracks are enabled
      audioTracks.forEach(track => {
        if (!track.enabled) {
          console.warn('⚠️ Audio track was disabled, enabling now');
          track.enabled = true;
        }
      });
      
      // TEST: Verify the stream actually has audio data using AudioContext
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const testCtx = new AudioCtx();
          const source = testCtx.createMediaStreamSource(stream);
          const analyser = testCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          // Sample audio level for 500ms
          await new Promise(resolve => setTimeout(resolve, 500));
          analyser.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          console.log(`🔊 Audio level check - average: ${average.toFixed(2)} (should be > 0 if mic is working)`);
          
          if (average === 0) {
            console.warn('⚠️ WARNING: Audio stream has no signal! Check if microphone is muted or not working.');
            try { emitToast('Warning: No audio detected from microphone. Check if it\'s muted.', 'error'); } catch (e) {}
          }
          
          // Don't close context yet, we'll use it for visualization
          audioCtxRef.current = testCtx;
        }
      } catch (e) {
        console.warn('Could not test audio levels', e);
      }
      
      // IMPORTANT: For microphone, use the original stream directly
      // Creating new MediaStream from tracks can break audio in some browsers
      let audioStream = stream;
      
      // Only create a new stream for tab recording (to remove video tracks)
      if (inputType === 'tab') {
        const videoTracks = stream.getVideoTracks ? stream.getVideoTracks() : [];
        if (videoTracks.length > 0) {
          console.log(`📹 Removing ${videoTracks.length} video tracks from tab recording`);
          // Stop video tracks to save bandwidth
          videoTracks.forEach(track => track.stop());
        }
        // For tab, create audio-only stream
        if (audioTracks.length > 0) {
          audioStream = new MediaStream(audioTracks);
        }
      }
      
      // Try explicit audio mime types for better browser compatibility
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm;codecs=opus' } as any);
        console.log(`✅ MediaRecorder created with opus - mimeType: ${recorder.mimeType}, state: ${recorder.state}`);
      } catch (e) {
        try {
          recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' } as any);
          console.log(`✅ MediaRecorder created with webm fallback - mimeType: ${recorder.mimeType}, state: ${recorder.state}`);
        } catch (e2) {
          recorder = new MediaRecorder(audioStream as MediaStream);
          console.log(`✅ MediaRecorder created with default codec - mimeType: ${recorder.mimeType}, state: ${recorder.state}`);
        }
      }
      mediaRecorderRef.current = recorder;
      const sessionId = `session-${Date.now()}`;
      sessionIdRef.current = sessionId;
      sequenceRef.current = 0;
      socketRef.current?.emit('startSession', sessionId);
      dispatch({ type: 'START' });

      // data handler for recorder (declared before reconnect logic so it can be reused)
      const recorderOnDataAvailable = async (e: BlobEvent) => {
        try {
          const size = e.data ? e.data.size || 0 : 0;
          console.log(`📦 Blob received - size: ${size} bytes, type: ${e.data?.type || 'unknown'}`);
          setLastBlobSize(size);
          if (size === 0) {
            blobZeroCountRef.current = (blobZeroCountRef.current || 0) + 1;
          } else {
            blobZeroCountRef.current = 0;
          }
          // If several consecutive zero-size blobs observed for tab, attempt AudioContext fallback
          if (inputType === 'tab' && blobZeroCountRef.current >= 2) {
            try { emitToast('Tab audio chunks empty — attempting alternate capture method', 'info'); } catch (e) {}
            try {
              await fallbackToAudioContextRecording(currentStreamRef.current);
              blobZeroCountRef.current = 0;
              return; // the fallback recorder will start and handle future chunks
            } catch (err) {
              console.warn('AudioContext fallback failed', err);
            }
          }
          const arrayBuffer = await e.data.arrayBuffer();
          console.log(`🎵 Sending chunk ${sequenceRef.current + 1} to server - ${arrayBuffer.byteLength} bytes`);
          const sessionId = sessionIdRef.current || `session-${Date.now()}`;
          sequenceRef.current += 1;
          socketRef.current?.emit("audioChunk", sessionId, arrayBuffer, sequenceRef.current);
        } catch (err) {
          console.error('ondataavailable handler error', err);
        }
      };

      // Listen for stream interruptions and attempt reconnect using the remembered inputType
      const onTrackEnded = async (ev: any) => {
        console.warn('Media track ended. Attempting reconnect...');
        try {
          const desired = inputTypeRef.current || inputType;
          const s = await acquireStream(desired, 3);
          try { mediaRecorderRef.current?.stop(); } catch (e) {}
          const audioTracks = (s && s.getAudioTracks) ? s.getAudioTracks() : [];
          const newStream = audioTracks && audioTracks.length > 0 ? new MediaStream(audioTracks) : s;
          const newRecorder = new MediaRecorder(newStream as MediaStream);
          mediaRecorderRef.current = newRecorder;
          sequenceRef.current = 0;
          socketRef.current?.emit('startSession', sessionIdRef.current || `session-${Date.now()}`);
          newRecorder.ondataavailable = recorderOnDataAvailable;
          const newTimeslice = inputTypeRef.current === 'tab' ? 3000 : 30000;
          newRecorder.start(newTimeslice);
          console.log('Reconnected media stream and resumed recording (inputType=', desired, ')');
        } catch (e) {
          console.error('Reconnect failed', e);
          dispatch({ type: 'ERROR' });
        }
      };
      try {
        (stream.getTracks() || []).forEach((t: MediaStreamTrack) => t.addEventListener('ended', onTrackEnded));
      } catch (e) {
        console.warn('Failed to attach track ended listeners', e);
      }

      // Start client-side speech recognition only for microphone input
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (inputType === 'mic' && SpeechRecognition) {
          const recog = new SpeechRecognition();
          recog.lang = 'en-US';
          recog.interimResults = true;
          recog.continuous = true;
          recog.onresult = (ev: any) => {
            let interim = '';
            let final = '';
            for (let i = ev.resultIndex; i < ev.results.length; ++i) {
              const r = ev.results[i];
              if (r.isFinal) {
                final += r[0].transcript;
                
                // Check for voice commands in final transcript
                const transcript = r[0].transcript.toLowerCase().trim();
                if (transcript.includes('scribeai') || transcript.includes('scribe ai')) {
                  console.log('🎤 Voice command detected:', transcript);
                  handleVoiceCommand(transcript);
                }
              } else {
                interim += r[0].transcript;
              }
            }
            if (final && final.trim()) {
              setFinalTranscript((prev) => (prev ? prev + "\n" : "") + final.trim());
              setInterimTranscript('');
            } else {
              setInterimTranscript(interim.trim());
            }
          };
          recog.onerror = (e: any) => {
            console.warn('SpeechRecognition error', e);
            if (e.error === 'no-speech') {
              console.log('No speech detected, continuing...');
            }
          };
          recog.onend = () => {
            // Auto-restart if still recording (for continuous recognition)
            if (status === SessionStatus.RECORDING) {
              try {
                console.log('SpeechRecognition ended, restarting...');
                recog.start();
              } catch (e) {
                console.warn('Could not restart speech recognition', e);
              }
            }
          };
          recognitionRef.current = recog;
          recog.start();
          console.log('✅ Speech recognition started for microphone');
        }
      } catch (e) {
        console.warn('SpeechRecognition start failed', e);
        emitToast('Speech recognition unavailable in this browser', 'error');
      }

      const timeslice = inputType === 'tab' ? 3000 : 30000;
      recorder.ondataavailable = recorderOnDataAvailable;
      recorder.start(timeslice);

      // Setup analyser node to provide a visual/audio-level diagnostic for tab-share
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          let ctx = audioCtxRef.current;
          if (!ctx) {
            ctx = new AudioCtx();
            audioCtxRef.current = ctx;
          }
          const src = ctx.createMediaStreamSource(audioStream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          let raf = 0;
          const tick = () => {
            try {
              analyser.getByteTimeDomainData(data);
              // compute RMS
              let sum = 0;
              for (let i = 0; i < data.length; i++) {
                const v = (data[i] - 128) / 128;
                sum += v * v;
              }
              const rms = Math.sqrt(sum / data.length);
              setAudioLevel(Math.min(1, rms));
            } catch (e) {}
            raf = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch (e) {
        console.warn('Analyser setup failed', e);
      }
      dispatch({ type: 'START' });
    } catch (err) {
      console.error('startRecording error', err);
      dispatch({ type: 'ERROR' });
    }
  }

  async function fallbackToAudioContextRecording(stream: MediaStream | null) {
    if (!stream) throw new Error('no stream for fallback');
    try {
      // create or reuse audio context
      let ctx = audioCtxRef.current;
      if (!ctx) {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = ctx;
      }
      const src = ctx.createMediaStreamSource(stream);
      const dest = ctx.createMediaStreamDestination();
      src.connect(dest);

      // stop existing recorder if any
      try { mediaRecorderRef.current?.stop(); } catch (e) {}

      const fallbackRecorder = new MediaRecorder(dest.stream as MediaStream);
      mediaRecorderRef.current = fallbackRecorder;
      fallbackRecorder.ondataavailable = async (e: BlobEvent) => {
        try {
          const size = e.data ? e.data.size || 0 : 0;
          if (size === 0) return;
          const buffer = await e.data.arrayBuffer();
          const sessionId = sessionIdRef.current || `session-${Date.now()}`;
          sequenceRef.current += 1;
          socketRef.current?.emit('audioChunk', sessionId, buffer, sequenceRef.current);
        } catch (err) { console.error('fallback ondataavailable', err); }
      };
      fallbackRecorder.onerror = (ev) => console.warn('fallback recorder error', ev);
      fallbackRecorder.start(3000);
      try { emitToast('Using audio-context fallback for tab capture', 'info'); } catch (e) {}
    } catch (e) {
      console.error('fallbackToAudioContextRecording failed', e);
      throw e;
    }
  }

  function pauseRecording() {
    try { mediaRecorderRef.current?.pause(); } catch (e) {}
    dispatch({ type: 'PAUSE' });
  }

  function resumeRecording() {
    try { mediaRecorderRef.current?.resume(); } catch (e) {}
    dispatch({ type: 'RESUME' });
  }

  function stopRecording() {
    try { mediaRecorderRef.current?.stop(); } catch (e) {}
    dispatch({ type: 'PROCESS' }); // Show PROCESSING state while server transcribes
    // notify server to stop session — server will transcribe and save, then emit `sessionSaved`
    const sid = sessionIdRef.current || `session-${Date.now()}`;
    // Include the current client-side transcript (if any) so server can use it
    const combined = getCombinedTranscript();
    // attach owner email if available (lightweight client-side login stored in localStorage)
    let ownerEmail = '';
    try {
      const raw = localStorage.getItem('scribeai_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        ownerEmail = parsed && parsed.email ? parsed.email : '';
      }
    } catch (e) {
      ownerEmail = '';
    }
    socketRef.current?.emit('stopSession', sid, combined || '', ownerEmail);

    // POST a preliminary session so it's visible sooner in the sessions API.
    (async () => {
      try {
        setIsSaving(true); setSaveError(null);
        const payload = {
          clientSessionId: sid,
          transcript: combined || '',
          title: '',
          summary: null,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
          ownerEmail: ownerEmail || undefined,
          status: 'PROCESSING'
        } as any;
        const apiBase = '';
        const res = await fetch(`${apiBase}/api/sessions`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setSaveError(data && data.error ? String(data.error) : `Save failed (${res.status})`);
        } else {
          // If server returns a session with a summary/title, apply it locally
          const sess = data && data.session ? data.session : null;
          if (sess && sess.summary) setSummary(String(sess.summary));
          if (sess && sess.title) setSessionTitle(String(sess.title));
          if (sess && sess.transcript) setFinalTranscript(String(sess.transcript));
          try { emitToast('Session queued for processing', 'info'); } catch (e) {}
        }
      } catch (e: any) {
        setSaveError(e && e.message ? e.message : String(e));
      } finally {
        setIsSaving(false);
      }
    })();

    // stop client-side speech recognition if running
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
        console.log('Stopped speech recognition');
      }
    } catch (e) {
      console.warn('Error stopping SpeechRecognition', e);
    }

    // Tear down analyser / audio context
    try {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
        audioCtxRef.current = null;
      }
    } catch (e) { console.warn('Error closing audio context', e); }
    setAudioLevel(0);
    setLastBlobSize(0);
  }

  return (
    <div className="animate-fadeIn" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 24, 
      maxWidth: 1400,
      margin: '0 auto',
      padding: '0 20px'
    }}>
      {/* Audio Source Selection */}
      <div className="neubrutal-card" style={{ 
        padding: 28, 
        background: 'linear-gradient(135deg, #ffffff 0%, #f9fff9 100%)',
        border: '5px solid var(--nb-border)',
        boxShadow: '6px 6px 0 rgba(11,61,43,0.9)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ color: 'var(--nb-accent)' }}><MicrophoneIcon size={24} /></div>
          <label style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--nb-ink)' }}>Audio Source</label>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Source Type Selector */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['mic', 'tab'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setInputType(type)}
                className="neubrutal-btn"
                style={{
                  padding: '12px 20px',
                  background: inputType === type ? 'linear-gradient(135deg, var(--nb-accent) 0%, #37a169 100%)' : 'white',
                  color: inputType === type ? 'white' : 'var(--nb-ink)',
                  border: `5px solid ${inputType === type ? 'var(--nb-border)' : 'rgba(11,61,43,0.2)'}`,
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{type === 'mic' ? <MicrophoneIcon size={16} /> : <GlobeIcon size={16} />}</span>
                <span>{type === 'mic' ? 'Microphone' : 'Tab / Screen'}</span>
              </button>
            ))}
          </div>

          {/* Device Selector for Mic */}
          {inputType === 'mic' && audioDevices.length > 0 && (
            <select 
              value={selectedDeviceId || ''} 
              onChange={(e) => setSelectedDeviceId(e.target.value || null)}
              className="neubrutal-btn"
              style={{
                padding: '12px 16px',
                minWidth: 220,
                maxWidth: 400,
                background: 'white',
                border: '5px solid rgba(11,61,43,0.2)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="">Default Microphone</option>
              {audioDevices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Device ${d.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          )}

          {/* Language Translation Selector */}
          <select 
            value={targetLanguage} 
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="neubrutal-btn"
            disabled={status === 'RECORDING' || status === 'PROCESSING'}
            style={{
              padding: '12px 16px',
              minWidth: 220,
              maxWidth: 400,
              background: 'white',
              border: '5px solid rgba(11,61,43,0.2)',
              fontWeight: 700,
              cursor: (status === 'RECORDING' || status === 'PROCESSING') ? 'not-allowed' : 'pointer',
              opacity: (status === 'RECORDING' || status === 'PROCESSING') ? 0.5 : 1
            }}
            title="Translate transcript to another language"
          >
            <option value="none">🌍 No Translation</option>
            <option value="es">🇪🇸 Spanish (Español)</option>
            <option value="fr">🇫🇷 French (Français)</option>
            <option value="de">🇩🇪 German (Deutsch)</option>
            <option value="it">🇮🇹 Italian (Italiano)</option>
            <option value="pt">🇵🇹 Portuguese (Português)</option>
            <option value="ru">🇷🇺 Russian (Русский)</option>
            <option value="zh">🇨🇳 Chinese (中文)</option>
            <option value="ja">🇯🇵 Japanese (日本語)</option>
            <option value="ko">🇰🇷 Korean (한국어)</option>
            <option value="ar">🇸🇦 Arabic (العربية)</option>
            <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
            <option value="nl">🇳🇱 Dutch (Nederlands)</option>
            <option value="pl">🇵🇱 Polish (Polski)</option>
            <option value="tr">🇹🇷 Turkish (Türkçe)</option>
            <option value="vi">🇻🇳 Vietnamese (Tiếng Việt)</option>
          </select>

          {/* Tab Share Test Button */}
          {inputType === 'tab' && (
            <button 
              className="neubrutal-btn btn-ghost" 
              onClick={() => testGetDisplayMedia()}
              style={{ padding: '12px 20px', fontWeight: 800 }}
            >
              Test Tab Share
            </button>
          )}
        </div>

        {/* Tab Warning */}
        {inputType === 'tab' && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f9ff 100%)', 
            border: '4px solid #2196f3',
            borderRadius: 12,
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start'
          }}>
            <div style={{ color: '#0d47a1' }}><InfoIcon size={24} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, color: '#0d47a1', marginBottom: 8, fontSize: '1.05rem' }}>Tab Recording Mode</div>
              <div style={{ fontSize: 14, color: '#1565c0', lineHeight: 1.6, marginBottom: 10 }}>
                <strong><CheckIcon size={16} /> Audio is being recorded</strong> from your selected tab. Audio chunks are being saved and will be available for download after stopping.
              </div>
              
              <div style={{ 
                marginTop: 12, 
                padding: 12, 
                background: 'rgba(33, 150, 243, 0.08)', 
                borderRadius: 8,
                border: '2px solid rgba(33, 150, 243, 0.2)'
              }}>
                <div style={{ fontWeight: 900, color: '#0d47a1', marginBottom: 8, fontSize: 14 }}>
                  💡 Want to transcribe ALL system audio?
                </div>
                <div style={{ fontSize: 13, color: '#1565c0', lineHeight: 1.6 }}>
                  <strong>Windows:</strong>
                  <ol style={{ margin: '8px 0', paddingLeft: 20 }}>
                    <li>Enable "Stereo Mix" in Sound Settings → Recording tab</li>
                    <li>Or install <strong>VB-Audio Virtual Cable</strong> (free)</li>
                    <li>Select it as the microphone in the dropdown above</li>
                  </ol>
                  <strong>Mac:</strong>
                  <ol style={{ margin: '8px 0', paddingLeft: 20 }}>
                    <li>Install <strong>BlackHole</strong> (free audio loopback)</li>
                    <li>Create Multi-Output Device in Audio MIDI Setup</li>
                    <li>Select BlackHole as microphone in dropdown above</li>
                  </ol>
                  This will capture all device audio with <strong>live transcription!</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Audio Level Indicator */}
        {inputType === 'tab' && status === 'RECORDING' && (
          <div style={{ 
            marginTop: 16, 
            padding: 16, 
            background: 'rgba(79,176,122,0.05)', 
            borderRadius: 12,
            border: '3px solid rgba(79,176,122,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}><VolumeIcon size={16} /> Audio Level</span>
              <span style={{ fontSize: 12, color: 'rgba(11,47,33,0.7)' }}>Last chunk: {lastBlobSize} bytes</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: 12, 
              background: 'rgba(11,61,43,0.1)', 
              borderRadius: 8, 
              overflow: 'hidden',
              border: '2px solid rgba(11,61,43,0.2)'
            }}>
              <div 
                className="animate-pulse"
                style={{ 
                  width: `${Math.round(audioLevel * 100)}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #4fb07a 0%, #37a169 100%)',
                  transition: 'width 0.1s ease'
                }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="neubrutal-card" style={{ 
        padding: 28, 
        background: 'white',
        border: '5px solid var(--nb-border)',
        boxShadow: '6px 6px 0 rgba(11,61,43,0.9)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {/* Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div 
              className={status === 'RECORDING' ? 'status-live' : ''}
              style={{
                padding: '10px 20px',
                background: status === 'RECORDING' ? 'linear-gradient(135deg, #4fb07a 0%, #37a169 100%)' : 
                           status === 'PROCESSING' ? 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)' :
                           status === 'COMPLETED' ? 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' :
                           'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)',
                color: status !== 'IDLE' ? 'white' : 'var(--nb-ink)',
                borderRadius: 12,
                border: '4px solid var(--nb-border)',
                fontWeight: 900,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '4px 4px 0 rgba(11,61,43,0.8)'
              }}
            >
              <span style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                background: status === 'RECORDING' ? 'white' : 
                           status === 'PROCESSING' ? 'white' :
                           status === 'COMPLETED' ? 'white' : 'var(--nb-ink)',
                animation: status === 'RECORDING' ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {status === 'RECORDING' ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><PlayIcon size={14} /> RECORDING</span>) : 
                 status === 'PAUSED' ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><PauseIcon size={14} /> PAUSED</span>) : 
                 status === 'PROCESSING' ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><SparkleIcon size={14} /> PROCESSING</span>) : 
                 status === 'COMPLETED' ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><CheckIcon size={14} /> COMPLETED</span>) : 
                 (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>IDLE</span>)}
              </span>
            </div>
            
            {isSaving && (
              <div style={{ 
                  padding: '8px 16px', 
                  background: 'rgba(79,176,122,0.1)', 
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'var(--nb-accent)'
                }}>
                  <SaveIcon size={16} /> Saving...
                </div>
            )}
            {saveError && (
              <div style={{ 
                padding: '8px 16px', 
                background: 'rgba(220,38,38,0.1)', 
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                color: '#c92a2a',
                display: 'inline-flex',
                gap: 8,
                alignItems: 'center'
              }}>
                <WarningIcon size={16} color="#c92a2a" /> {saveError}
              </div>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button 
            onClick={() => startRecording(inputType)} 
            className="neubrutal-btn"
            disabled={status === 'RECORDING'}
            style={{
              padding: '16px 28px',
              background: status === 'RECORDING' ? '#cbd5e0' : 'linear-gradient(135deg, #4fb07a 0%, #37a169 100%)',
              color: 'white',
              border: '5px solid var(--nb-border)',
              fontWeight: 900,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: status === 'RECORDING' ? 'not-allowed' : 'pointer',
              opacity: status === 'RECORDING' ? 0.5 : 1
            }}
          >
            <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z"/>
              <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 0 0 2 0v-3.08A7 7 0 0 0 19 11z"/>
            </svg>
            <span>Start Recording</span>
          </button>

          <button 
            onClick={pauseRecording}
            disabled={status !== 'RECORDING'}
            className="neubrutal-btn"
            style={{
              padding: '16px 28px',
              background: status === 'RECORDING' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#cbd5e0',
              color: 'white',
              border: '5px solid var(--nb-border)',
              fontWeight: 900,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: status === 'RECORDING' ? 'pointer' : 'not-allowed',
              opacity: status === 'RECORDING' ? 1 : 0.5
            }}
          >
            <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z"/>
            </svg>
            <span>Pause</span>
          </button>

          <button 
            onClick={resumeRecording}
            disabled={status !== 'PAUSED'}
            className="neubrutal-btn"
            style={{
              padding: '16px 28px',
              background: status === 'PAUSED' ? 'linear-gradient(135deg, #4fb07a 0%, #37a169 100%)' : '#cbd5e0',
              color: 'white',
              border: '5px solid var(--nb-border)',
              fontWeight: 900,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: status === 'PAUSED' ? 'pointer' : 'not-allowed',
              opacity: status === 'PAUSED' ? 1 : 0.5
            }}
          >
            <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Resume</span>
          </button>

          <button 
            onClick={stopRecording}
            disabled={status !== 'RECORDING' && status !== 'PAUSED'}
            className="neubrutal-btn"
            style={{
              padding: '16px 28px',
              background: (status === 'RECORDING' || status === 'PAUSED') ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : '#cbd5e0',
              color: 'white',
              border: '5px solid var(--nb-border)',
              fontWeight: 900,
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: (status === 'RECORDING' || status === 'PAUSED') ? 'pointer' : 'not-allowed',
              opacity: (status === 'RECORDING' || status === 'PAUSED') ? 1 : 0.5
            }}
          >
            <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" ry="2"/>
            </svg>
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* Transcript Panel */}
      <div className="neubrutal-card" style={{
        padding: 0,
        background: 'white',
        border: '5px solid var(--nb-border)',
        boxShadow: '6px 6px 0 rgba(11,61,43,0.9)',
        overflow: 'hidden'
      }}>
        {/* Transcript Header */}
        <div style={{ 
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(79,176,122,0.1) 0%, rgba(79,176,122,0.05) 100%)',
          borderBottom: '4px solid rgba(79,176,122,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ color: 'var(--nb-accent)' }}><DocumentIcon size={28} /></div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--nb-ink)' }}>
                {sessionTitle || 'Live Transcript'}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(11,47,33,0.6)', marginTop: 2 }}>
                {getCombinedTranscript() ? `${getCombinedTranscript().length} characters` : 'Waiting for audio...'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Format Selector */}
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value as any)}
              className="neubrutal-btn"
              style={{
                padding: '10px 16px',
                background: 'white',
                border: '4px solid rgba(11,61,43,0.3)',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <option value="plain">Plain Text</option>
              <option value="md">Markdown</option>
              <option value="srt">SRT Subtitles</option>
            </select>

            {/* Action Buttons */}
            <button 
              className="neubrutal-btn btn-ghost icon-button" 
              title="Copy transcript" 
                onClick={() => {
                const payload = getCombinedTranscript() || '';
                navigator.clipboard?.writeText(payload);
                try { emitToast('Copied to clipboard!', 'success'); } catch (e) {}
              }}
              style={{ padding: 12 }}
            >
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1z"/>
                <rect x="6" y="5" width="12" height="14" rx="2" ry="2"/>
              </svg>
            </button>

            <button 
              className="neubrutal-btn btn-ghost icon-button" 
              title="Preview formatted" 
              onClick={() => {
                const payload = getCombinedTranscript() || '';
                const formatted = formatTranscript(format, payload);
                setPreviewContent(formatted);
                setIsPreviewOpen(true);
              }}
              style={{ padding: 12 }}
            >
              <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
            </button>

            <button 
              className="neubrutal-btn" 
              title="Export transcript" 
                onClick={() => {
                const content = formatTranscript(format, getCombinedTranscript() || '');
                const ext = format === 'md' ? 'md' : format === 'srt' ? 'srt' : 'txt';
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const now = new Date().toISOString().replace(/[:.]/g,'-');
                a.href = url;
                a.download = `scribeai-transcript-${now}.${ext}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                try { emitToast('Transcript exported!', 'success'); } catch (e) {}
              }}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, var(--nb-accent) 0%, #37a169 100%)',
                color: 'white',
                fontWeight: 900
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><DownloadIcon size={16} /> Export</span>
            </button>
          </div>
        </div>

        {/* Transcript Body */}
        <div style={{ 
          padding: 28,
          minHeight: 300,
          maxHeight: 500,
          overflowY: 'auto',
          background: 'rgba(79,176,122,0.02)'
        }}>
          {getCombinedTranscript() ? (
            <>
              {/* Original Transcript */}
              <div style={{ 
                fontSize: '1.05rem',
                lineHeight: 1.5,
                color: 'var(--nb-ink)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Rubik, sans-serif',
                marginBottom: targetLanguage !== 'none' ? 12 : 0
              }}>
                {getCombinedTranscript()}
              </div>
              
              {/* Translated Transcript */}
              {targetLanguage !== 'none' && (
                <div style={{
                  borderTop: '2px solid rgba(79,176,122,0.2)',
                  paddingTop: 12,
                  marginTop: 8
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: 'var(--nb-accent)'
                  }}>
                    <GlobeIcon size={16} />
                    <span>Translation</span>
                    {isTranslating && (
                      <div className="loading-spinner" style={{ 
                        width: 12, 
                        height: 12, 
                        border: '2px solid rgba(79,176,122,0.2)', 
                        borderTop: '2px solid var(--nb-accent)', 
                        borderRadius: '50%',
                        marginLeft: 4
                      }} />
                    )}
                  </div>
                  <div style={{ 
                    fontSize: '1.05rem',
                    lineHeight: 1.5,
                    color: 'rgba(11,47,33,0.8)',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Rubik, sans-serif',
                    fontStyle: translatedTranscript ? 'normal' : 'italic'
                  }}>
                    {translatedTranscript || 'Translating...'}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ 
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(11,47,33,0.4)'
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}><MicrophoneIcon size={64} /></div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>No transcript yet</div>
              <div style={{ fontSize: 15 }}>
                {inputType === 'mic' ? 'Click Start and begin speaking to see live captions' : 'Click Start to begin recording tab audio'}
              </div>
            </div>
          )}
        </div>

        {/* Summary & Download Actions - Below Transcript */}
        {(summary || downloadUrl || actionItems.length > 0) && (
          <div style={{ 
            padding: '24px 28px',
            background: 'rgba(79,176,122,0.03)',
            borderTop: '4px solid rgba(79,176,122,0.15)',
            display: 'flex', 
            gap: 12, 
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {summary && (
                <button 
                onClick={() => setIsSummaryOpen(true)} 
                className="neubrutal-btn"
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <SparkleIcon size={20} />
                <span>View AI Summary</span>
              </button>
            )}
            {actionItems.length > 0 && (
                <button 
                onClick={() => setIsActionItemsOpen(true)} 
                className="neubrutal-btn"
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #4fb07a 0%, #37a169 100%)',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <svg style={{ width: 20, height: 20 }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span>Action Items ({actionItems.length})</span>
              </button>
            )}
            {downloadUrl && (
              <a 
                className="neubrutal-btn" 
                href={downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textDecoration: 'none'
                }}
              >
                <DownloadIcon size={20} />
                <span>Download Transcript</span>
              </a>
            )}
            {status === 'COMPLETED' && (
              <button
                className="neubrutal-btn"
                onClick={() => {
                  setFinalTranscript('');
                  setInterimTranscript('');
                  setSummary('');
                  setSessionTitle('');
                  setDownloadUrl(null);
                  setActionItems([]);
                  setBookmarks([]);
                  setIsSummaryOpen(false);
                  setIsActionItemsOpen(false);
                  sessionIdRef.current = null;
                  sequenceRef.current = 0;
                  dispatch({ type: 'IDLE' });
                  emitToast('Ready for new recording', 'info');
                }}
                style={{
                  padding: '16px 32px',
                  background: '#fff',
                  color: 'var(--nb-ink)',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <span>New Recording</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bookmarks Panel */}
      {bookmarks.length > 0 && (
        <div className="neubrutal-card" style={{
          padding: 0,
          background: 'white',
          border: '5px solid var(--nb-border)',
          boxShadow: '6px 6px 0 rgba(11,61,43,0.9)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '20px 28px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,191,36,0.08) 100%)',
            borderBottom: '4px solid rgba(245,158,11,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '1.5rem' }}>⭐</div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--nb-ink)' }}>
                  Important Moments ({bookmarks.length})
                </div>
                <div style={{ fontSize: 13, color: 'rgba(11,47,33,0.6)', marginTop: 2 }}>
                  Created via voice command
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: 28 }}>
            {bookmarks.map((bookmark, idx) => (
              <div 
                key={idx} 
                style={{ 
                  marginBottom: 12, 
                  padding: 16,
                  background: 'rgba(251,191,36,0.08)',
                  border: '3px solid rgba(251,191,36,0.25)',
                  borderRadius: 10
                }}
              >
                <div style={{ fontSize: 12, color: 'rgba(11,47,33,0.5)', marginBottom: 6, fontWeight: 700 }}>
                  {new Date(bookmark.timestamp).toLocaleTimeString()}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--nb-ink)' }}>
                  {bookmark.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice Commands Help */}
      {status === 'RECORDING' && (
        <div className="neubrutal-card" style={{
          padding: 24,
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
          border: '4px solid #3b82f6',
          boxShadow: '5px 5px 0 rgba(59,130,246,0.5)'
        }}>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e40af', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>🎤</span>
            <span>Voice Commands Active</span>
          </div>
          <div style={{ fontSize: 14, color: '#1e3a8a', lineHeight: 1.7 }}>
            <div style={{ marginBottom: 8 }}>Say <strong>"ScribeAI"</strong> followed by:</div>
            <ul style={{ margin: 0, paddingLeft: 24 }}>
              <li><strong>"mark this as important"</strong> - Create bookmark</li>
              <li><strong>"create action item: [description]"</strong> - Add task</li>
              <li><strong>"summarize last 5 minutes"</strong> - Quick summary</li>
              <li><strong>"pause"</strong> / <strong>"resume"</strong> - Control recording</li>
              <li><strong>"stop recording"</strong> - End session</li>
            </ul>
          </div>
        </div>
      )}

      {/* Toasts */}
      <ToastContainer />

      {/* Summary Modal */}
      <Modal 
        isOpen={isSummaryOpen} 
        onClose={() => setIsSummaryOpen(false)}
        title={sessionTitle || 'Session Summary'}
      >
        <div style={{ lineHeight: 1.4, fontSize: '0.95rem', userSelect: 'text' }} dangerouslySetInnerHTML={{ 
          __html: summary
            .replace(/Title: (.+)/g, '<div style="font-size: 1.15rem; font-weight: 900; color: var(--nb-accent); margin-bottom: 8px; padding-bottom: 6px; border-bottom: 2px solid rgba(79,176,122,0.2);">$1</div>')
            .replace(/Bullets:/g, '<div style="font-weight: 800; font-size: 0.95rem; margin-top: 10px; margin-bottom: 6px; color: var(--nb-ink);">Key Points:</div>')
            .replace(/Action Items:/g, '<div style="font-weight: 800; font-size: 0.95rem; margin-top: 12px; margin-bottom: 6px; color: #f59e0b;">Action Items:</div>')
            .replace(/^- (.+)$/gm, '<li style="margin-left: 16px; margin-bottom: 4px; line-height: 1.4;">$1</li>')
            .replace(/(<li[^>]*>.*<\/li>)/gs, '<ul style="list-style-type: disc; padding-left: 20px; margin: 6px 0;">$1</ul>')
            .replace(/<\/ul>\s*<ul[^>]*>/g, '')
            .replace(/TASK: (.+?)(?=TASK:|DECISION:|QUESTION:|$)/gs, '<div style="padding: 8px 10px; background: rgba(79,176,122,0.08); border-left: 3px solid #4fb07a; margin: 6px 0; border-radius: 4px; line-height: 1.4;"><strong style="color: #4fb07a; font-size: 0.85rem;">TASK:</strong> <span style="color: var(--nb-ink);">$1</span></div>')
            .replace(/DECISION: (.+?)(?=TASK:|DECISION:|QUESTION:|$)/gs, '<div style="padding: 8px 10px; background: rgba(59,130,246,0.08); border-left: 3px solid #3b82f6; margin: 6px 0; border-radius: 4px; line-height: 1.4;"><strong style="color: #3b82f6; font-size: 0.85rem;">DECISION:</strong> <span style="color: var(--nb-ink);">$1</span></div>')
            .replace(/QUESTION: (.+?)(?=TASK:|DECISION:|QUESTION:|$)/gs, '<div style="padding: 8px 10px; background: rgba(251,191,36,0.08); border-left: 3px solid #fbbf24; margin: 6px 0; border-radius: 4px; line-height: 1.4;"><strong style="color: #fbbf24; font-size: 0.85rem;">QUESTION:</strong> <span style="color: var(--nb-ink);">$1</span></div>')
            .replace(/@(\w+)/g, '<strong style="color: var(--nb-accent); background: rgba(79,176,122,0.1); padding: 2px 5px; border-radius: 3px;">@$1</strong>')
            .replace(/\[Due: ([^\]]+)\]/g, '<strong style="color: #dc2626; background: rgba(220,38,38,0.1); padding: 2px 6px; border-radius: 3px;">Due: $1</strong>')
            .replace(/\n/g, '<br/>')
        }} />
      </Modal>

      {/* Action Items Modal */}
      <Modal
        isOpen={isActionItemsOpen}
        onClose={() => setIsActionItemsOpen(false)}
        title={`Action Items (${actionItems.length})`}
        maxWidth={900}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {actionItems.map((item, idx) => (
            <div 
              key={idx} 
              style={{ 
                marginBottom: 12, 
                padding: 14,
                background: item.type === 'TASK' ? 'rgba(79,176,122,0.05)' : 
                           item.type === 'DECISION' ? 'rgba(59,130,246,0.05)' : 
                           'rgba(251,191,36,0.05)',
                border: `4px solid ${item.type === 'TASK' ? 'rgba(79,176,122,0.2)' : item.type === 'DECISION' ? 'rgba(59,130,246,0.2)' : 'rgba(251,191,36,0.2)'}`,
                borderRadius: 10
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ 
                  marginTop: 1,
                  padding: '4px 10px',
                  background: item.type === 'TASK' ? '#4fb07a' : item.type === 'DECISION' ? '#3b82f6' : '#fbbf24',
                  color: 'white',
                  borderRadius: 4,
                  fontWeight: 800,
                  fontSize: 10,
                  border: '2px solid var(--nb-border)'
                    }}>
                      {item.type}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--nb-ink)', marginBottom: 4 }}>
                        {item.description}
                      </div>
                      {(item.assignee || item.deadline) && (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'rgba(11,47,33,0.7)' }}>
                          {item.assignee && (
                            <span style={{ fontWeight: 700 }}>
                              @{item.assignee}
                            </span>
                          )}
                          {item.deadline && (
                            <span style={{ fontWeight: 700, color: '#dc2626' }}>
                              Due: {item.deadline}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Preview (${format})`}
      >
        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{previewContent}</pre>
      </Modal>
    </div>
  );
}
