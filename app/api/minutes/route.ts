import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { transcript, summary } = await req.json();

    if (!transcript && !summary) {
      return NextResponse.json(
        { error: 'Transcript or summary is required' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const prompt = `You are a professional meeting minutes generator. Analyze the following meeting transcript and generate comprehensive meeting minutes.

Transcript:
${transcript || summary}

Generate meeting minutes in the following JSON format:
{
  "title": "Brief meeting title based on content",
  "date": "Current date in format: Month DD, YYYY",
  "attendees": ["List of attendees if mentioned, or 'Not specified'"],
  "agenda": ["Key topics discussed"],
  "keyPoints": ["Main discussion points and insights"],
  "decisions": ["Decisions made during the meeting"],
  "actionItems": [
    {
      "task": "Description of action item",
      "assignee": "Person responsible (if mentioned)",
      "dueDate": "Due date if mentioned, otherwise 'TBD'"
    }
  ],
  "nextSteps": ["Follow-up actions or next meeting plans"]
}

Important:
- Be concise and professional
- Extract specific action items with clear descriptions
- Identify any decisions or commitments made
- If information is not available, use appropriate defaults
- Keep each point brief (1-2 sentences max)
- Focus on actionable and important information

Return ONLY valid JSON, no additional text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to generate minutes' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let minutes;
    try {
      // Remove markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      minutes = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse minutes JSON:', text);
      return NextResponse.json(
        { error: 'Failed to generate structured minutes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ minutes });
  } catch (error) {
    console.error('Error generating meeting minutes:', error);
    return NextResponse.json(
      { error: 'Failed to generate meeting minutes' },
      { status: 500 }
    );
  }
}
