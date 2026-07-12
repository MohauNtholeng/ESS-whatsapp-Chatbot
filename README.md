# ESS WhatsApp Chatbot

A WhatsApp chatbot for Employee Self-Service (ESS) built with **Node.js**, **Express**, and the **Twilio API**. It lets employees:

1. **View leave balance** – see remaining Annual, Sick, and Family leave days.
2. **Apply for leave** – guided multi-step flow (leave type → start date → end date → reason → confirmation).
3. **Request a pay slip** – enter a month/year and receive formatted pay slip details.

---

## Project structure

```
.
├── server.js                    # Express server + Twilio webhook
├── src/
│   ├── bot.js                   # Conversation state machine
│   ├── sessions.js              # In-memory session management
│   ├── data/
│   │   └── employees.js         # Sample employee data store
│   └── handlers/
│       ├── leaveHandler.js      # Leave balance & application logic
│       └── payslipHandler.js    # Pay slip retrieval logic
└── tests/
    └── bot.test.js              # Jest unit tests
```

---

## Getting started

### Prerequisites

- Node.js ≥ 18
- A [Twilio account](https://www.twilio.com/) with a WhatsApp-enabled number (the sandbox works for development).

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy `.env.example` to `.env` and fill in your Twilio credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | Your Twilio WhatsApp number (e.g. `whatsapp:+14155238886`) |
| `PORT` | HTTP port (default `3000`) |

### Run the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

### Run tests

```bash
npm test
```

---

## Twilio webhook setup

1. Start the server and expose it publicly (e.g. with [ngrok](https://ngrok.com/)):
   ```bash
   ngrok http 3000
   ```
2. In the [Twilio Console](https://console.twilio.com/), go to **Messaging → Try it out → Send a WhatsApp message** (sandbox) or your WhatsApp sender settings.
3. Set the **"When a message comes in"** webhook URL to:
   ```
   https://<your-ngrok-subdomain>.ngrok.io/webhook
   ```
   Method: **HTTP POST**

---

## Conversation flow

```
User: "Hi"
Bot:  Welcome to the ESS WhatsApp Bot!
      1️⃣ View Leave Balance
      2️⃣ Apply for Leave
      3️⃣ Request Pay Slip

User: "1"  →  Shows leave balance (Annual / Sick / Family days remaining)

User: "2"  →  Prompts for leave type, start date, end date, reason
           →  Confirms submission with a reference number

User: "3"  →  Prompts for MM/YYYY  →  Returns formatted pay slip

User: "0"  →  Returns to the main menu from any state
```
