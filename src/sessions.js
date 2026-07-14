/**
 * In-memory session store.
 * Each session tracks the current conversation state and any temporary data
 * being collected during a multi-step interaction (e.g., a leave application).
 *
 * Sessions expire after SESSION_TTL_MS milliseconds of inactivity.
 */

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const sessions = new Map();

/**
 * Returns the session for the given user, creating one if it does not exist.
 * @param {string} userId - e.g. the WhatsApp number "whatsapp:+27821234567"
 * @returns {{ state: string, data: object, updatedAt: number }}
 */
function getSession(userId) {
  const now = Date.now();
  let session = sessions.get(userId);

  if (!session || now - session.updatedAt > SESSION_TTL_MS) {
    session = { state: 'IDLE', data: {}, updatedAt: now };
    sessions.set(userId, session);
  }

  return session;
}

/**
 * Updates the session state and/or data for a user.
 * @param {string} userId
 * @param {string} state - new conversation state
 * @param {object} [data] - optional data to merge into the session
 */
function updateSession(userId, state, data = {}) {
  const session = getSession(userId);
  session.state = state;
  session.data = { ...session.data, ...data };
  session.updatedAt = Date.now();
}

/**
 * Resets the session for a user back to IDLE.
 * @param {string} userId
 */
function resetSession(userId) {
  sessions.set(userId, { state: 'IDLE', data: {}, updatedAt: Date.now() });
}

/**
 * Returns the interactive button screen identifier that was last set for the
 * user (e.g. 'MAIN_MENU', 'LEAVE_TYPE'), or null if the last reply was a
 * plain data/text message.  The server uses this to decide whether to send a
 * Twilio Content Template (interactive buttons) or a plain TwiML text reply.
 * @param {string} userId
 * @returns {string|null}
 */
function getScreen(userId) {
  return getSession(userId).data._screen || null;
}

module.exports = { getSession, updateSession, resetSession, getScreen };
