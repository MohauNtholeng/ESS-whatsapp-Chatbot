'use strict';

require('dotenv').config();

const express = require('express');
const twilio = require('twilio');
const { processMessage } = require('./src/bot');

const app = express();
app.use(express.urlencoded({ extended: false }));

/**
 * POST /webhook
 * Twilio sends incoming WhatsApp messages here.
 * The handler processes the message and responds with TwiML.
 */
app.post('/webhook', (req, res) => {
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
