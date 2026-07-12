/**
 * Main bot logic.
 * Receives a user ID (WhatsApp number) and message text, advances the
 * conversation state machine, and returns the reply text.
 *
 * States
 * ──────
 * IDLE               → show main menu
 * MAIN_MENU          → waiting for menu selection (1 / 2 / 3)
 * LEAVE_APPLY_TYPE   → waiting for leave type (1 / 2 / 3)
 * LEAVE_APPLY_START  → waiting for start date (DD/MM/YYYY)
 * LEAVE_APPLY_END    → waiting for end date   (DD/MM/YYYY)
 * LEAVE_APPLY_REASON → waiting for reason text
 * PAYSLIP_PERIOD     → waiting for pay slip period (MM/YYYY)
 */

const { getSession, updateSession, resetSession } = require('./sessions');
const {
  getLeaveBalance,
  getLeaveTypePrompt,
  validateLeaveType,
  validateDate,
  submitLeaveApplication,
} = require('./handlers/leaveHandler');
const { getPayslipPrompt, getPayslip } = require('./handlers/payslipHandler');

const MAIN_MENU =
  '👋 *Welcome to the ESS WhatsApp Bot!*\n\n' +
  'Please select an option:\n\n' +
  '1️⃣  View Leave Balance\n' +
  '2️⃣  Apply for Leave\n' +
  '3️⃣  Request Pay Slip\n\n' +
  'Reply with the number of your choice.';

/**
 * Processes an incoming message and returns the bot reply.
 * @param {string} userId  - e.g. "whatsapp:+27821234567"
 * @param {string} message - the raw text sent by the user
 * @returns {string}       - the reply to send back
 */
function processMessage(userId, message) {
  const input = (message || '').trim();
  const session = getSession(userId);
  const { state } = session;

  // "0" always returns to the main menu from any state
  if (input === '0' && state !== 'IDLE' && state !== 'MAIN_MENU') {
    updateSession(userId, 'MAIN_MENU', {});
    return MAIN_MENU;
  }

  switch (state) {
    case 'IDLE':
    case 'MAIN_MENU':
      return handleMainMenu(userId, input);

    case 'LEAVE_APPLY_TYPE':
      return handleLeaveType(userId, input);

    case 'LEAVE_APPLY_START':
      return handleLeaveStart(userId, input);

    case 'LEAVE_APPLY_END':
      return handleLeaveEnd(userId, input);

    case 'LEAVE_APPLY_REASON':
      return handleLeaveReason(userId, input);

    case 'PAYSLIP_PERIOD':
      return handlePayslipPeriod(userId, input);

    default:
      resetSession(userId);
      return MAIN_MENU;
  }
}

// ─── State handlers ──────────────────────────────────────────────────────────

function handleMainMenu(userId, input) {
  switch (input) {
    case '1':
      updateSession(userId, 'MAIN_MENU');
      return getLeaveBalance(userId);

    case '2':
      updateSession(userId, 'LEAVE_APPLY_TYPE');
      return getLeaveTypePrompt();

    case '3':
      updateSession(userId, 'PAYSLIP_PERIOD');
      return getPayslipPrompt();

    default:
      updateSession(userId, 'MAIN_MENU');
      return MAIN_MENU;
  }
}

function handleLeaveType(userId, input) {
  const result = validateLeaveType(input);
  if (!result.valid) {
    return result.message;
  }
  updateSession(userId, 'LEAVE_APPLY_START', { leaveType: result.type });
  return `*${result.type} Leave*\n\nPlease enter the *start date* of your leave.\nFormat: *DD/MM/YYYY* (e.g. 15/08/2024)\n\nReply *0* to cancel.`;
}

function handleLeaveStart(userId, input) {
  const result = validateDate(input);
  if (!result.valid) {
    return result.message + '\n\nPlease enter the start date (DD/MM/YYYY):';
  }
  updateSession(userId, 'LEAVE_APPLY_END', {
    startDate: input.trim(),
    startDateObj: result.date,
  });
  return `Start date set to *${input.trim()}*.\n\nPlease enter the *end date* of your leave.\nFormat: *DD/MM/YYYY*\n\nReply *0* to cancel.`;
}

function handleLeaveEnd(userId, input) {
  const { data } = getSession(userId);
  const result = validateDate(input, data.startDateObj);
  if (!result.valid) {
    return result.message + '\n\nPlease enter the end date (DD/MM/YYYY):';
  }
  updateSession(userId, 'LEAVE_APPLY_REASON', {
    endDate: input.trim(),
    endDateObj: result.date,
  });
  return `End date set to *${input.trim()}*.\n\nPlease enter the *reason* for your leave:`;
}

function handleLeaveReason(userId, input) {
  if (!input) {
    return 'Please enter a reason for your leave:';
  }
  const { data } = getSession(userId);
  updateSession(userId, 'MAIN_MENU');

  return submitLeaveApplication(userId, {
    type: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    startDateObj: data.startDateObj,
    endDateObj: data.endDateObj,
    reason: input,
  });
}

function handlePayslipPeriod(userId, input) {
  updateSession(userId, 'MAIN_MENU');
  return getPayslip(userId, input);
}

module.exports = { processMessage };
