# Chat with AI Vaibhav 💬

> A personal AI chatbot that talks on Vaibhav's behalf — built by **vaibecoded**, powered by **Gemini 2.0 Flash**.

🌐 **Live at:** [chat.vaibbhubb.in](https://chat.vaibbhubb.in)

---

## What is this?

This is Vaibhav's personal AI clone — a chatbot that represents him, talks like him, and can hold real conversations on his behalf. Friends and visitors can chat with "AI Vaibhav" anytime, even when the real one is busy overthinking something.

---

## Features

- 🤖 **AI Persona** — Gemini 2.0 Flash trained on Vaibhav's personality, interests, and communication style
- 🔐 **Auth System** — Signup with OTP email verification, JWT sessions
- 🎤 **Voice Input** — Record audio, auto-transcribed to text via Gemini
- 🔊 **Text-to-Speech** — Browser-native voice playback on any AI message
- 🔔 **Smart Alerts** — Gemini classifies messages and emails the real Vaibhav if something important comes up
- 📱 **Mobile-first UI** — WhatsApp-style fixed header, scrollable chat, pinned input bar
- 🗄️ **TiDB Cloud** — Cloud MySQL database for users and chat logs
- 🚀 **Deployed on Vercel** — Zero-downtime, auto-deploy on every git push

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
