import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import { getSession } from '../../../lib/session';
import { getSystemPrompt } from '../../../lib/vaibhav-context';
import { logChatQuery } from '../../../lib/chat-queries';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const CHAT_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
const CLASSIFIER_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.5-flash'];

// Email transporter is created per-alert (inside checkAndAlert) so that
// env vars are always resolved by the time the function runs.

// Simple in-process cooldown: don't spam Vaibhav if same user sends multiple alerts
// (resets on server restart — good enough for a personal bot)
const alertCooldowns = new Map();
const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes per user

export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Get session info
    const session = await getSession();
    const username = session?.username || 'anonymous';

    // Local dev fallback: keep the bot responsive even if the Gemini key
    // hasn't been filled in yet.
    if (!process.env.GEMINI_API_KEY) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
      return Response.json({
        reply: `I’m in local test mode right now, bhai — add your GEMINI_API_KEY and I’ll give real replies. You said: “${lastUserMessage}”`,
      });
    }

    // Load system prompt (single context, no tiers)
    const systemInstruction = getSystemPrompt();

    // Gemini expects the conversation to start with a user turn, so skip
    // the initial UI-only assistant greeting if it exists.
    const geminiMessages = messages.filter((msg, idx) => !(idx === 0 && msg.role !== 'user'));

    // Format chat history for Gemini
    const formattedContents = geminiMessages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // 1. Generate AI reply
    const aiResponse = await generateWithFallback({
      contents: formattedContents,
      config: { systemInstruction },
    }, CHAT_MODELS);

    const replyText = aiResponse.text?.trim();

    if (!replyText) {
      throw new Error('Gemini returned an empty reply');
    }

    // 2. Check if this message needs to alert the real Vaibhav
    //    Run this in the background (don't block the response)
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    try {
      await logChatQuery({ username, queryText: lastUserMessage });
    } catch (logError) {
      console.error('Chat log error:', logError.message);
    }
    // Await so errors surface in server logs instead of being silently dropped
    await checkAndAlert({ username, userMessage: lastUserMessage, aiReply: replyText });

    // Audio is handled client-side — just return text
    return Response.json({ reply: replyText });

  } catch (error) {
    console.error('Chat API Error:', error);

    // Quota exhausted — all Gemini models are rate-limited right now
    if (error.isQuotaExhausted) {
      return Response.json({
        reply: "I'm getting a lot of messages right now and hit my rate limit 😅 Give me a minute and try again!",
      });
    }

    // Keep local testing usable even when the upstream model call fails.
    if (process.env.NODE_ENV !== 'production') {
      return Response.json({
        reply: `Something went wrong on my end — check the server logs for details.`,
      });
    }

    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

// ── Alert system ──────────────────────────────────────────────────────────────
async function checkAndAlert({ username, userMessage, aiReply }) {
  try {
    // Rate limit: skip if this user was alerted recently
    const lastAlert = alertCooldowns.get(username);
    if (lastAlert && Date.now() - lastAlert < ALERT_COOLDOWN_MS) return;

    // Ask Gemini to classify if this message needs Vaibhav's real attention
    const classifyResponse = await generateWithFallback({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are a classifier. Does this chat message from a user to an AI chatbot require notifying the REAL person (Vaibhav) urgently?

User message: "${userMessage}"

Reply YES if the user:
- Wants to meet Vaibhav in real life (mentions a time, place, or plan)
- Shares their phone number, email, or any contact info
- Asks something that only the real Vaibhav can answer (not the bot)
- Seems genuinely upset, distressed, or in need of real help
- Proposes something important like a collab, job, or deal

Reply NO for normal casual conversation, general questions, or anything the bot can handle.

Answer with just: YES or NO (and one short reason after a dash)`,
        }],
      }],
    }, CLASSIFIER_MODELS);

    const classification = classifyResponse.text?.trim() || '';
    const isImportant = classification.toUpperCase().startsWith('YES');

    console.log(`[Alert] Classifier result for @${username}: ${classification}`);

    if (!isImportant) return;

    // Mark cooldown
    alertCooldowns.set(username, Date.now());

    // Send alert email to Vaibhav
    const alertEmail = process.env.ALERT_EMAIL;
    if (!alertEmail || alertEmail === 'your_personal_email@gmail.com') {
      console.warn('⚠️  ALERT: Set ALERT_EMAIL in .env.local to receive notifications!');
      console.warn(`Alert would have sent for @${username}: "${userMessage}"`);
      return;
    }

    // Create transporter here so env vars are always resolved at call time
    const transporter = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    await transporter.sendMail({
      from: `"Chat Alert 🔔" <${process.env.EMAIL_USER}>`,
      to: alertEmail,
      subject: `🔔 @${username} said something important on your chatbot`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0f0f0f; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px 24px;">
            <h2 style="margin: 0; color: #fff; font-size: 18px;">🔔 Chat Alert</h2>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.7); font-size: 13px;">${now} (IST)</p>
          </div>
          <div style="padding: 24px;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">User</p>
            <p style="margin: 0 0 20px; font-size: 15px; font-weight: 600; color: #818cf8;">@${username}</p>

            <p style="margin: 0 0 6px; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">What they said</p>
            <div style="background: rgba(255,255,255,0.05); border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 15px; color: #f1f5f9; line-height: 1.5;">&quot;${userMessage}&quot;</p>
            </div>

            <p style="margin: 0 0 6px; font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Bot's reply</p>
            <div style="background: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">${aiReply}</p>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.07);">
              <p style="margin: 0; font-size: 12px; color: #475569;">This alert was triggered automatically. You can reply directly to this email or reach out to @${username}.</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log(`✅ Alert sent to ${alertEmail} for @${username}`);

  } catch (err) {
    // Alert errors should never crash the chat — but DO log the full error
    console.error('Alert system error:', err);
  }
}

async function generateWithFallback(request, models) {
  let lastError;
  let allRateLimited = true;

  for (const model of models) {
    try {
      return await ai.models.generateContent({ model, ...request });
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.error?.status;
      if (status === 404 || status === 429) {
        // 404 = model gone, 429 = rate limited — try next model
        if (status !== 429) allRateLimited = false;
        continue;
      }
      allRateLimited = false;
      throw err;
    }
  }

  // If every model was rate-limited, throw a typed error so the caller can
  // return a friendly message instead of a generic 500.
  if (allRateLimited) {
    const quotaErr = new Error('All models rate-limited');
    quotaErr.isQuotaExhausted = true;
    throw quotaErr;
  }

  throw lastError;
}