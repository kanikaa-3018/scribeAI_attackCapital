import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { text, duration } = await req.json();

    if (!text || typeof duration !== 'number') {
      return NextResponse.json(
        { error: 'Text and duration are required' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const prompt = `Analyze this ${duration}s speech for issues. Return ONLY valid JSON:
{"type":"none|long_speech|rambling|repetition|filler_words","severity":"low|medium|high","suggestion":"brief tip","details":"explanation"}

Rules:
- long_speech: duration > 120s
- rambling: unfocused speech
- repetition: repeats same words/ideas
- filler_words: excessive um/uh/like
- none: good speech

Speech: "${text}"

JSON only, no other text:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
            candidateCount: 1
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return NextResponse.json({
        type: 'none',
        severity: 'low',
        suggestion: 'Keep going!',
        details: 'Analysis temporarily unavailable'
      });
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const feedback = JSON.parse(jsonMatch[0]);
        return NextResponse.json(feedback);
      } catch (parseError) {
        console.error('[Coach API] JSON parse error:', parseError);
      }
    }

    // Fallback response
    return NextResponse.json({
      type: 'none',
      severity: 'low',
      suggestion: 'Keep going!',
      details: resultText ? 'AI analysis: ' + resultText.slice(0, 50) : 'Speech analysis unavailable'
    });

  } catch (error) {
    console.error('Coach analysis error:', error);
    return NextResponse.json({
      type: 'none',
      severity: 'low',
      suggestion: 'Keep going!',
      details: 'Analysis temporarily unavailable'
    });
  }
}
