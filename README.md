# Chat with AI Vaibhav 💬

> A personal AI chatbot that talks on Vaibhav's behalf — built by **vaibecoded**, powered by **Gemini 2.0 Flash**.

🌐 **Live at:** [chat.vaibbhubb.in](https://chat.vaibbhubb.in)

---

## What is this?

This is Vaibhav's personal AI clone — a chatbot that represents him, talks like him, and can hold real conversations on his behalf. Friends and visitors can chat with "AI Vaibhav" anytime, even when the real one is busy overthinking something.

---

## ✨ Features

<details open>
<summary><b>🤖 The "Real" AI Persona</b></summary>
Powered by <b>Gemini 3.5 Flash</b>, the bot is trained on Vaibhav's exact personality, tone, and interests. It overthinks, it jokes, and it talks just like the real deal!
</details>

<details open>
<summary><b>🚨 Smart Real-Time Alerts</b></summary>
Say something important? The AI acts as a smart receptionist. It classifies your messages on the fly and <b>instantly emails the real Vaibhav</b> if you drop a job offer, share contact info, or need urgent attention!
</details>

<details>
<summary><b>🔐 Secure OTP Auth</b></summary>
A custom-built authentication system using JWTs and email-based OTP verification.
</details>

<details>
<summary><b>🎙️ Voice to Text & Text to Speech</b></summary>
Don't want to type? Use the microphone to record your voice, which gets transcribed instantly. The AI can also speak its replies back to you using browser-native TTS!
</details>

<details>
<summary><b>📈 Admin Dashboard & Analytics</b></summary>
A private admin panel to monitor users, view chat logs, and track activity, alongside built-in Vercel Web Analytics.
</details>

<details>
<summary><b>📱 Fluid Mobile Experience</b></summary>
A WhatsApp-style layout with a fixed header, scrollable message view, and a pinned input bar that feels exactly like a native app.
</details>

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI Brain | Google Gemini 2.0 Flash (`@google/genai`) |
| Auth | JWT + bcrypt + OTP via email |
| Database | TiDB Cloud (MySQL-compatible) |
| Email | Nodemailer + Hostinger SMTP |
| Hosting | Vercel |
| UI | Vanilla React + CSS-in-JS |

---

## Environment Variables

Create a `.env.local` file with:

```env
DB_HOST=your-tidb-host
DB_PORT=4000
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=chatapp
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-email-password
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-super-secret-key-min-32-chars
ALERT_EMAIL=your-personal-email@gmail.com
```

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Built by

**vaibecoded** — with 🤖 [Antigravity](https://antigravity.dev) as the coding co-pilot.
