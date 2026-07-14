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
| `TWILIO_CONTENT_SID_MAIN_MENU` | *(optional)* Content Template SID for the main-menu screen with interactive buttons |
| `TWILIO_CONTENT_SID_LEAVE_TYPE` | *(optional)* Content Template SID for the leave-type selection screen with interactive buttons |

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

## Interactive WhatsApp buttons (optional)

The bot works out-of-the-box with plain-text number replies (1, 2, 3, 0).
To replace those with real WhatsApp quick-reply buttons, create two
**Content Templates** in the Twilio Console and add their SIDs to your `.env`.

### Create the templates

1. In the [Twilio Console](https://console.twilio.com/) go to **Messaging → Content Template Builder → Create new template**.
2. Choose type **Quick Reply**.
3. Create the following two templates:

**Main Menu template** (`TWILIO_CONTENT_SID_MAIN_MENU`)

| Field | Value |
|---|---|
| Body | `👋 *Welcome to the ESS WhatsApp Bot!*\n\nPlease select an option:` |
| Button 1 id / title | `1` / `View Leave Balance` |
| Button 2 id / title | `2` / `Apply for Leave` |
| Button 3 id / title | `3` / `Request Pay Slip` |

**Leave Type template** (`TWILIO_CONTENT_SID_LEAVE_TYPE`)

| Field | Value |
|---|---|
| Body | `*Apply for Leave*\n\nPlease select the type of leave:` |
| Button 1 id / title | `1` / `Annual Leave` |
| Button 2 id / title | `2` / `Sick Leave` |
| Button 3 id / title | `3` / `Family Leave` |
| Button 4 id / title | `0` / `Cancel` |

> **Why numeric IDs?**  When a user taps a button, Twilio delivers the
> button's `id` as the message `Body`.  Using `"1"`, `"2"`, `"3"`, and `"0"`
> means the existing state machine handles button taps exactly the same as
> typed replies — no extra code required.

4. Copy the `HXXXXXXXXXXXXX` SID shown for each template and add it to your `.env`:
   ```
   TWILIO_CONTENT_SID_MAIN_MENU=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_CONTENT_SID_LEAVE_TYPE=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### How it works

- When a SID is configured for the screen the bot just reached, the server
  sends the interactive template via the Twilio Messages API and returns an
  empty TwiML response to the webhook.
- If no SID is configured (or the API call fails), the server falls back to a
  plain-text TwiML reply automatically.
- All other screens (leave-balance display, date prompts, pay-slip data, etc.)
  always use plain-text replies.

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
