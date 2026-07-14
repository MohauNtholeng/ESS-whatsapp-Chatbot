'use strict';

/**
 * Maps bot screen identifiers to the environment variable that holds the
 * Twilio Content Template SID for that screen.
 *
 * Templates must be created in the Twilio Console (Messaging → Content
 * Template Builder) as `twilio/quick-reply` type.  Each button's `id` must
 * match the numeric input already handled by the state machine:
 *
 *   MAIN_MENU  buttons → id "1" (View Leave Balance)
 *                         id "2" (Apply for Leave)
 *                         id "3" (Request Pay Slip)
 *
 *   LEAVE_TYPE buttons → id "1" (Annual Leave)
 *                         id "2" (Sick Leave)
 *                         id "3" (Family Leave)
 *                         id "0" (Cancel / back to menu)
 *
 * When Twilio receives a button tap it sends the button's `id` as the
 * message Body, so the existing text-based state machine handles button
 * taps without any extra normalisation.
 *
 * If a ContentSid env var is not set (or is empty), the server falls back
 * to a plain-text TwiML reply automatically.
 */
const BUTTON_SCREENS = {
  MAIN_MENU: {
    contentSidEnv: 'TWILIO_CONTENT_SID_MAIN_MENU',
  },
  LEAVE_TYPE: {
    contentSidEnv: 'TWILIO_CONTENT_SID_LEAVE_TYPE',
  },
};

/**
 * Returns the button-screen config for the given screen identifier, or null
 * if the screen has no interactive template.
 * @param {string|null} screen
 * @returns {{ contentSidEnv: string }|null}
 */
function getButtonScreen(screen) {
  return BUTTON_SCREENS[screen] || null;
}

module.exports = { getButtonScreen };
