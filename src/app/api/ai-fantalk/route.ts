import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth, JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

// Service Account OAuth scope and model URL (using your working gemma model)
const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/generative-language';
const MODEL_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent';
const STYLE_INSTRUCTION = `You are a friendly K-POP friend who always replies naturally in the same language as the user's input.
    **Strictly detect the user's language and respond ONLY in that language. Do not mix languages.**
    **Do NOT provide translations or explanations in other languages.**
    **다른 언어로 번역하거나 설명하지 마세요.**
    - 한국어 → 한국어로만 응답  
    - 日本語 → 日本語のみで応答  
    - 中文 → 只用中文回应  
    - English → Respond ONLY in English  
    - Français → Répondre UNIQUEMENT en français  
    - Deutsch → AUSSCHLIESSLICH auf Deutsch antworten  
    - Español → Responder ÚNICAMENTE en español  
    - Italiano → Rispondere SOLO in italiano  
    - ภาษาไทย → ตอบกลับเป็นภาษาไทยเท่านั้น  
    - Tiếng Việt → Trả lời CHỈ bằng tiếng Việt  
    - Filipino → Tumugon LAMANG sa wikang Filipino  
    - Монгол хэл → ЗӨВХӨН монголоор хариулна  
    - Bahasa Indonesia → Balas HANYA dalam Bahasa Indonesia  
    - Русский → Отвечайте ТОЛЬКО на русском  
    - Português → Responda APENAS em Português  
    Keep your answers short (1–2 sentences), casual, and friendly — like chatting with a close friend.
    Avoid mentioning that you are an AI or robot. Use emojis only when they feel natural and necessary.`;

async function getAccessToken() {
  // Priority 1: Environment variable (for Vercel/production)
  const inlineJson = process.env.GOOGLE_CHAT_SERVICE_ACCOUNT_JSON || process.env.SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    const { client_email, private_key } = JSON.parse(inlineJson as string);
    const client = new JWT({ email: client_email, key: private_key, scopes: [GOOGLE_SCOPE] });
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('Failed to acquire access token');
    return token as string;
  }

  // Priority 2: Local file (for development only)
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const jsonPath = path.join(homeDir, 'Downloads', 'service-account.json');
  
  if (fs.existsSync(jsonPath)) {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const { client_email, private_key } = JSON.parse(jsonContent);
    const client = new JWT({ email: client_email, key: private_key, scopes: [GOOGLE_SCOPE] });
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('Failed to acquire access token');
    return token as string;
  }

  throw new Error('Service account credentials not found. Set GOOGLE_CHAT_SERVICE_ACCOUNT_JSON env var or place service-account.json in ~/Downloads/ folder.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const message = (body?.message ?? body?.prompt ?? '').toString();
    if (!message.trim()) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    console.log('[ai-fantalk POST] Message:', message);
    const accessToken = await getAccessToken();
    console.log('[ai-fantalk POST] Access token acquired');
    
    const res = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: STYLE_INSTRUCTION },
              { text: message },
            ],
          },
        ],
      }),
      // 20s timeout via AbortController if needed (optional)
    });

    console.log('[ai-fantalk POST] Gemini response status:', res.status);
    
    if (!res.ok) {
      const text = await res.text();
      console.error('[ai-fantalk POST] Gemini error:', text);
      return NextResponse.json({ error: text, upstreamStatus: res.status }, { status: res.status });
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    console.log('[ai-fantalk POST] Success, response length:', text.length);
    return NextResponse.json({ text });
  } catch (e: any) {
    console.error('[ai-fantalk POST] Exception:', e?.message);
    console.error('[ai-fantalk POST] Stack:', e?.stack);
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const message = (searchParams.get('message') ?? searchParams.get('prompt') ?? '').toString();
    if (!message.trim()) {
      return NextResponse.json({ ok: true, usage: 'POST {"prompt":"..."} or GET ?prompt=...' });
    }

    const accessToken = await getAccessToken();
    const res = await fetch(MODEL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: STYLE_INSTRUCTION },
              { text: message },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text, upstreamStatus: res.status }, { status: res.status });
    }

    const data = await res.json();
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}


