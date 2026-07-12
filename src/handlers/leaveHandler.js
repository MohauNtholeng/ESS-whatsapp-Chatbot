/**
 * Handles all leave-related conversation steps:
 *  - Showing leave balance
 *  - Multi-step leave application (type → start date → end date → reason → confirm)
 */

const { getEmployee, saveLeaveApplication } = require('../data/employees');

const LEAVE_TYPES = {
  '1': 'Annual',
  '2': 'Sick',
  '3': 'Family',
};

/**
 * Returns a formatted leave balance message for the employee.
 * @param {string} userId
 * @returns {string}
 */
function getLeaveBalance(userId) {
  const employee = getEmployee(userId);
  if (!employee) {
    return (
      'Sorry, we could not find your employee record. ' +
      'Please contact HR for assistance.\n\nReply *0* to return to the main menu.'
    );
  }

  const { leaveBalance } = employee;
  return (
    `*Leave Balance – ${employee.name}*\n\n` +
    `📅 Annual Leave : *${leaveBalance.annual} day(s)*\n` +
    `🤒 Sick Leave   : *${leaveBalance.sick} day(s)*\n` +
    `👨‍👩‍👧 Family Leave : *${leaveBalance.family} day(s)*\n\n` +
    `Reply *0* to return to the main menu.`
  );
}

/**
 * Returns the leave type selection prompt.
 * @returns {string}
 */
function getLeaveTypePrompt() {
  return (
    '*Apply for Leave*\n\n' +
    'Please select the type of leave:\n\n' +
    '1️⃣  Annual Leave\n' +
    '2️⃣  Sick Leave\n' +
    '3️⃣  Family Leave\n\n' +
    'Reply *0* to return to the main menu.'
  );
}

/**
 * Validates the selected leave type.
 * @param {string} input
 * @returns {{ valid: boolean, type?: string, message?: string }}
 */
function validateLeaveType(input) {
  const trimmed = input.trim();
  if (!LEAVE_TYPES[trimmed]) {
    return {
      valid: false,
      message:
        'Invalid selection. Please reply with *1*, *2*, or *3* to choose a leave type.\n\n' +
        '1️⃣  Annual Leave\n' +
        '2️⃣  Sick Leave\n' +
        '3️⃣  Family Leave',
    };
  }
  return { valid: true, type: LEAVE_TYPES[trimmed] };
}

/**
 * Parses a date string in DD/MM/YYYY format.
 * Returns a Date object, or null if the input is invalid.
 * @param {string} input
 * @returns {Date|null}
 */
function parseDate(input) {
  const parts = input.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!parts) return null;
  const [, day, month, year] = parts;
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Calculates the number of working days (Mon–Fri) between two dates inclusive.
 * @param {Date} start
 * @param {Date} end
 * @returns {number}
 */
function countWorkingDays(start, end) {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Validates a date input and optionally checks it is not before a minimum date.
 * @param {string} input
 * @param {Date|null} [minDate]
 * @returns {{ valid: boolean, date?: Date, message?: string }}
 */
function validateDate(input, minDate = null) {
  const date = parseDate(input);
  if (!date) {
    return {
      valid: false,
      message: 'Invalid date format. Please use *DD/MM/YYYY* (e.g. 15/08/2024).',
    };
  }
  if (minDate && date < minDate) {
    return {
      valid: false,
      message:
        'The end date cannot be before the start date. ' +
        'Please enter a valid end date (DD/MM/YYYY).',
    };
  }
  return { valid: true, date };
}

/**
 * Builds the confirmation summary for a leave application and saves it.
 * @param {string} userId
 * @param {{ type: string, startDate: string, endDate: string, startDateObj: Date, endDateObj: Date, reason: string }} data
 * @returns {string}
 */
function submitLeaveApplication(userId, data) {
  const employee = getEmployee(userId);
  if (!employee) {
    return (
      'Sorry, we could not process your application. ' +
      'Please contact HR for assistance.'
    );
  }

  const days = countWorkingDays(data.startDateObj, data.endDateObj);
  const leaveKey = data.type.toLowerCase();
  const available = employee.leaveBalance[leaveKey] || 0;

  if (days > available) {
    return (
      `⚠️ *Insufficient Leave Balance*\n\n` +
      `You have *${available} day(s)* of ${data.type} Leave remaining, ` +
      `but this application requires *${days} working day(s)*.\n\n` +
      `Please adjust your dates and try again, or select a different leave type.\n\n` +
      `Reply *2* to start a new leave application or *0* for the main menu.`
    );
  }

  const application = saveLeaveApplication(userId, {
    type: `${data.type} Leave`,
    startDate: data.startDate,
    endDate: data.endDate,
    reason: data.reason,
    days,
  });

  return (
    `✅ *Leave Application Submitted*\n\n` +
    `Reference  : ${application.ref}\n` +
    `Type       : ${data.type} Leave\n` +
    `From       : ${data.startDate}\n` +
    `To         : ${data.endDate}\n` +
    `Duration   : ${days} working day(s)\n` +
    `Reason     : ${data.reason}\n` +
    `Status     : ${application.status}\n\n` +
    `Your application has been sent to HR for approval.\n\n` +
    `Reply *0* to return to the main menu.`
  );
}

module.exports = {
  getLeaveBalance,
  getLeaveTypePrompt,
  validateLeaveType,
  validateDate,
  submitLeaveApplication,
  countWorkingDays,
};
