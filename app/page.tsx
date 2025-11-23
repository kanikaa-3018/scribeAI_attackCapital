"use client";

import React from "react";
import Link from "next/link";
import { MicrophoneIcon, SparkleIcon, RocketIcon, BoltIcon, RobotIcon, LockIcon, PaletteIcon, SearchIcon, ChartIcon, SaveIcon, DocumentWriteIcon, DownloadIcon, GlobeIcon,DocumentIcon } from './components/Icons';

export default function HomePage() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e9f7ef 0%, #f0fff5 50%, #fff 100%)' }}>
      {/* Hero Section */}
      <section className="hero-section animate-fadeIn" style={{ padding: '100px 20px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Animated Background Elements */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 120, height: 120, background: 'rgba(79,176,122,0.08)', borderRadius: '50%', animation: 'float 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '60%', right: '8%', width: 180, height: 180, background: 'rgba(26,77,46,0.06)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite 1s' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '15%', width: 100, height: 100, background: 'rgba(79,176,122,0.1)', borderRadius: '50%', animation: 'float 7s ease-in-out infinite 2s' }} />
        
        <div className="max-w-6xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
          <div className="neubrutal-card" style={{ 
            padding: '70px 50px', 
            position: 'relative', 
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fff5 50%, #e9f7ef 100%)',
            transform: 'perspective(1000px) rotateX(2deg)',
            transition: 'transform 0.3s ease'
          }}>
            {/* Decorative corner accents */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: 0, 
              height: 0, 
              borderLeft: '60px solid var(--nb-accent)', 
              borderBottom: '60px solid transparent',
              opacity: 0.3
            }} />
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              width: 0, 
              height: 0, 
              borderRight: '60px solid var(--nb-accent)', 
              borderTop: '60px solid transparent',
              opacity: 0.3
            }} />
            
            {/* Floating Icons */}
            <div style={{ position: 'absolute', top: 30, right: 50, animation: 'bounce 3s ease-in-out infinite', opacity: 0.6, color: 'var(--nb-accent)' }}><MicrophoneIcon size={48} /></div>
            <div style={{ position: 'absolute', bottom: 40, left: 60, animation: 'bounce 3s ease-in-out infinite 1s', opacity: 0.6, color: 'var(--nb-accent)' }}><SparkleIcon size={42} /></div>
            
            {/* Main Content */}
            <div style={{ position: 'relative' }}>
              <div style={{ 
                display: 'inline-block',
                padding: '8px 24px',
                background: 'linear-gradient(90deg, rgba(79,176,122,0.15) 0%, rgba(79,176,122,0.08) 100%)',
                borderRadius: 50,
                border: '3px solid rgba(79,176,122,0.3)',
                marginBottom: 24,
                fontWeight: 800,
                fontSize: 14,
                color: 'var(--nb-accent)',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center'
              }}>
                <RocketIcon size={18} /> NEXT-GEN TRANSCRIPTION
              </div>
              
              <h1 className="bangers-regular" style={{ 
                fontSize: 'clamp(3rem, 8vw, 5rem)', 
                fontWeight: 900, 
                lineHeight: 1, 
                marginBottom: 24, 
                color: 'var(--nb-ink)', 
                textTransform: 'uppercase', 
                letterSpacing: '3px',
                textShadow: '4px 4px 0px rgba(79,176,122,0.2)',
                background: 'linear-gradient(135deg, #1a4d2e 0%, #4fb07a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ScribeAI
              </h1>
              
              <div style={{ 
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', 
                fontWeight: 800, 
                background: 'linear-gradient(90deg, var(--nb-accent) 0%, #1a4d2e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 20,
                letterSpacing: '0.5px'
              }}>
                Your AI-Powered Meeting Assistant
              </div>
              
              <p style={{ 
                fontSize: 'clamp(1rem, 2vw, 1.2rem)', 
                color: 'rgba(11,47,33,0.8)', 
                maxWidth: 750, 
                margin: '0 auto 40px', 
                lineHeight: 1.7,
                fontWeight: 500
              }}>
                Transform conversations into <strong style={{ color: 'var(--nb-accent)' }}>intelligent transcripts</strong> with live speech recognition and <strong style={{ color: 'var(--nb-accent)' }}>AI-powered summaries</strong>. No downloads, no hassle—just pure productivity.
              </p>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
                <Link 
                  href="/dashboard" 
                  className="neubrutal-btn btn-primary" 
                  style={{ 
                    fontSize: 'clamp(1rem, 2vw, 1.2rem)', 
                    padding: '18px 40px', 
                    background: 'var(--nb-accent)', 
                    color: 'white', 
                    border: '6px solid var(--nb-border)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}><RocketIcon size={18} /> Start Recording Now</span>
                </Link>
                <Link 
                  href="/login" 
                  className="neubrutal-btn" 
                  style={{ 
                    fontSize: 'clamp(1rem, 2vw, 1.2rem)', 
                    padding: '18px 40px',
                    background: 'white',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span><DocumentWriteIcon size={16} /> Login / Sign Up</span>
                </Link>
                <Link 
                  href="/sessions" 
                  className="neubrutal-btn btn-ghost" 
                  style={{ 
                    fontSize: 'clamp(1rem, 2vw, 1.2rem)', 
                    padding: '18px 40px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span><DocumentIcon size={16} /> View Sessions</span>
                </Link>
              </div>

              {/* Feature Pills */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
                {[
                  { Icon: BoltIcon, text: 'Real-Time Transcription' },
                  { Icon: RobotIcon, text: 'AI Summaries' },
                  { Icon: SaveIcon, text: '100% Free' },
                  { Icon: LockIcon, text: 'Privacy First' }
                ].map((pill, i) => (
                  <div 
                    key={i}
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: 50,
                      border: '3px solid rgba(79,176,122,0.2)',
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'rgba(11,47,33,0.8)',
                      transition: 'all 0.3s ease',
                      cursor: 'default'
                    }}
                  >
                    <pill.Icon size={20} color="var(--nb-accent)" />
                    <span>{pill.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 14, 
                background: 'linear-gradient(135deg, rgba(79,176,122,0.15) 0%, rgba(79,176,122,0.08) 100%)', 
                padding: '14px 28px', 
                borderRadius: 50, 
                border: '4px solid rgba(79,176,122,0.35)',
                boxShadow: '0 4px 12px rgba(79,176,122,0.15)'
              }}>
                <SparkleIcon size={36} color="var(--nb-accent)" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 900, color: 'var(--nb-accent)', fontSize: 16 }}>Free Forever</div>
                  <div style={{ fontWeight: 600, color: 'rgba(11,47,33,0.6)', fontSize: 13 }}>No Credit Card • No Signup Required</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            33% { transform: translateY(-20px) translateX(10px); }
            66% { transform: translateY(10px) translateX(-10px); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          
          .neubrutal-btn:hover {
            transform: translateY(-2px);
            box-shadow: 10px 10px 0 rgba(11,61,43,1);
          }
        `}</style>
      </section>

      {/* About Section */}
      <section style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="bangers-regular" style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', marginBottom: 16, color: 'var(--nb-ink)', letterSpacing: '1px' }}>
            Why ScribeAI?
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.1rem', color: 'rgba(11,47,33,0.7)', maxWidth: 600, margin: '0 auto 50px' }}>
            The simplest way to capture and process your conversations, meetings, and ideas.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div className="neubrutal-card feature-card" style={{ padding: 32, background: 'linear-gradient(135deg, #fff 0%, #f0fff5 100%)' }}>
              <div style={{ marginBottom: 16, color: 'var(--nb-accent)' }}><MicrophoneIcon size={56} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12, color: 'var(--nb-ink)' }}>Live Transcription</h3>
              <p style={{ color: 'rgba(11,47,33,0.7)', lineHeight: 1.6 }}>
                Real-time captions powered by your browser's speech recognition. Fast, private, and completely free.
              </p>
            </div>

            <div className="neubrutal-card feature-card" style={{ padding: 32, background: 'linear-gradient(135deg, #fff 0%, #e9f7ef 100%)' }}>
              <div style={{ marginBottom: 16, color: 'var(--nb-accent)' }}><RobotIcon size={56} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12, color: 'var(--nb-ink)' }}>AI Summaries</h3>
              <p style={{ color: 'rgba(11,47,33,0.7)', lineHeight: 1.6 }}>
                Automatic summaries using Google's Gemini AI. Get structured titles, bullets, and keywords instantly.
              </p>
            </div>

            <div className="neubrutal-card feature-card" style={{ padding: 32, background: 'linear-gradient(135deg, #fff 0%, #dff3e8 100%)' }}>
              <div style={{ marginBottom: 16, color: 'var(--nb-accent)' }}><SaveIcon size={56} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12, color: 'var(--nb-ink)' }}>Export & Save</h3>
              <p style={{ color: 'rgba(11,47,33,0.7)', lineHeight: 1.6 }}>
                Download transcripts, save to database, or export in multiple formats. Your data, your control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '80px 20px' }}>
        <div className="max-w-6xl mx-auto">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', marginBottom: 16, color: 'var(--nb-ink)', fontFamily: 'Poppins, sans-serif' }}>
            How It Works
          </h2>
          <p style={{ textAlign: 'center', fontSize: '1.1rem', color: 'rgba(11,47,33,0.7)', maxWidth: 600, margin: '0 auto 50px' }}>
            Get started in three simple steps
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {[
              { step: '01', Icon: MicrophoneIcon, title: 'Start Recording', desc: 'Click "Start" and choose your audio source - microphone for live transcription or tab audio for recordings.' },
              { step: '02', Icon: DocumentWriteIcon, title: 'Watch Live Transcript', desc: 'See your words appear in real-time as you speak. Pause, resume, or stop anytime.' },
              { step: '03', Icon: SparkleIcon, title: 'Get AI Summary', desc: 'When you stop, Gemini AI generates a structured summary with keywords and action items.' },
              { step: '04', Icon: DownloadIcon, title: 'Export & Share', desc: 'Download transcripts as text, SRT, or Markdown. Access recordings anytime from your sessions.' },
            ].map((item, i) => (
              <div key={i} className="neubrutal-card" style={{ padding: 32, textAlign: 'center', position: 'relative', background: `linear-gradient(135deg, #fff 0%, ${i % 2 === 0 ? '#f0fff5' : '#e9f7ef'} 100%)` }}>
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '3rem', fontWeight: 900, color: 'rgba(79,176,122,0.15)', fontFamily: 'Poppins, sans-serif' }}>
                  {item.step}
                </div>
                <div style={{ marginBottom: 16, color: 'var(--nb-accent)' }}><item.Icon size={72} /></div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12, color: 'var(--nb-ink)' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'rgba(11,47,33,0.7)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '60px 20px', background: 'rgba(255,255,255,0.6)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, textAlign: 'center', marginBottom: 50, color: 'var(--nb-ink)', fontFamily: 'Poppins, sans-serif' }}>
            Powerful Features
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            {[
              { Icon: LockIcon, title: 'Privacy First', desc: 'Browser-based transcription keeps your data local' },
              { Icon: RocketIcon, title: 'Lightning Fast', desc: 'No server delays for live transcription' },
              { Icon: PaletteIcon, title: 'Multiple Formats', desc: 'Export as Plain Text, Markdown, or SRT' },
              { Icon: SearchIcon, title: 'Smart Search', desc: 'Find sessions by keywords and content' },
              { Icon: ChartIcon, title: 'Session Analytics', desc: 'Track transcript lengths and keywords' },
              { Icon: GlobeIcon, title: 'Tab Recording', desc: 'Capture browser tab audio and videos' },
            ].map((feat, i) => (
              <div key={i} className="neubrutal-card" style={{ padding: 24, textAlign: 'center', background: 'white' }}>
                <div style={{ marginBottom: 8, color: 'var(--nb-accent)', display: 'inline-block' }}><feat.Icon size={48} /></div>
                <h4 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 8, color: 'var(--nb-ink)' }}>{feat.title}</h4>
                <p style={{ fontSize: '0.9rem', color: 'rgba(11,47,33,0.7)' }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '80px 20px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="neubrutal-card" style={{ padding: '60px 40px', textAlign: 'center', background: 'linear-gradient(135deg, var(--nb-accent) 0%, #4fb07a 100%)', color: 'white', border: '8px solid var(--nb-border)' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: 20, fontFamily: 'Poppins, sans-serif' }}>
              Ready to Transform Your Workflow?
            </h2>
            <p style={{ fontSize: '1.2rem', marginBottom: 40, opacity: 0.9 }}>
              Start recording and transcribing in seconds. No credit card required.
            </p>
            <Link href="/dashboard" className="neubrutal-btn" style={{ fontSize: '1.2rem', padding: '18px 40px', background: 'white', color: 'var(--nb-ink)', border: '6px solid var(--nb-border)' }}>
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 20px', textAlign: 'center', borderTop: '4px solid rgba(11,61,43,0.1)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="bangers-regular" style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 12, color: 'var(--nb-ink)', letterSpacing: '1px' }}>ScribeAI</div>
          <p style={{ color: 'rgba(11,47,33,0.6)', marginBottom: 20 }}>
            Built with Next.js, Socket.IO, and Google Gemini AI
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{ color: 'var(--nb-accent)', fontWeight: 700 }}>Dashboard</Link>
            <Link href="/sessions" style={{ color: 'var(--nb-accent)', fontWeight: 700 }}>Sessions</Link>
            <Link href="/tools/transcripts" style={{ color: 'var(--nb-accent)', fontWeight: 700 }}>Transcripts</Link>
            <Link href="/tools/summaries" style={{ color: 'var(--nb-accent)', fontWeight: 700 }}>Summaries</Link>
            <Link href="/login" style={{ color: 'var(--nb-accent)', fontWeight: 700 }}>Login</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
