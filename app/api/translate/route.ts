import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const languageNames: Record<string, string> = {
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  nl: 'Dutch',
  pl: 'Polish',
  tr: 'Turkish',
  vi: 'Vietnamese'
};

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage || targetLanguage === 'none') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const languageName = languageNames[targetLanguage] || targetLanguage;

    // Use Gemini's free API for translation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text to ${languageName}. Only provide the translation, no explanations:\n\n${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }

    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
