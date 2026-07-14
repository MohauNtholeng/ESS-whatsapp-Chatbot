'use strict';

require('dotenv').config();

const express = require('express');
const twilio = require('twilio');
const { processMessage } = require('./src/bot');
const { getScreen } = require('./src/sessions');
const { getButtonScreen } = require('./src/buttonConfig');

const app = express();
app.use(express.urlencoded({ extended: false }));

/**
 * POST /webhook
 * Twilio sends incoming WhatsApp messages here.
 *
 * When a Twilio Content Template SID is configured for the bot screen that
 * was just reached, the handler sends an interactive message (with buttons)
 * via the Twilio Messages API and responds to the webhook with an empty
 * TwiML response.  Otherwise it falls back to a plain-text TwiML reply so
 * the bot works out-of-the-box without any template configuration.
 */
app.post('/webhook', async (req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Validate the request came from Twilio (skip in test/development mode)
  if (process.env.NODE_ENV === 'production' && accountSid && authToken) {
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = twilio.validateRequest(authToken, twilioSignature, url, req.body);
    if (!isValid) {
      return res.status(403).send('Forbidden');
    }
  }

  const from = req.body.From || '';
  const body = req.body.Body || '';

  const replyText = processMessage(from, body);

  // Check whether the current bot screen has a Content Template configured.
  const screen = getScreen(from);
  const buttonScreen = getButtonScreen(screen);
  const contentSid = buttonScreen && process.env[buttonScreen.contentSidEnv];

  if (contentSid && accountSid && authToken) {
    try {
      // Send the interactive template message via the Twilio Messages API,
      // then reply to the webhook with an empty TwiML response.
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        contentSid,
      });
      const twiml = new twilio.twiml.MessagingResponse();
      res.set('Content-Type', 'text/xml');
      return res.send(twiml.toString());
    } catch (err) {
      // Log the error and fall through to the plain-text TwiML fallback so
      // the user always gets a reply.
      console.error('Failed to send interactive message, falling back to text:', err.message);
    }
  }

  // Fallback: plain-text TwiML reply
  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(replyText);

  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

/**
 * GET /health
 * Simple health-check endpoint.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ESS WhatsApp Bot listening on port ${PORT}`);
  });
}

module.exports = app;
