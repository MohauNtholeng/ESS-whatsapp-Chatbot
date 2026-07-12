/**
 * Handles pay slip requests.
 * Prompts the user for a month/year and returns the matching pay slip details.
 */

const { getEmployee } = require('../data/employees');

/**
 * Returns the prompt asking the user for the pay slip period.
 * @returns {string}
 */
function getPayslipPrompt() {
  return (
    '*Request Pay Slip*\n\n' +
    'Please enter the month and year of the pay slip you require.\n' +
    'Format: *MM/YYYY* (e.g. 07/2024)\n\n' +
    'Reply *0* to return to the main menu.'
  );
}

/**
 * Retrieves and formats a pay slip for the given employee and period.
 * @param {string} userId - WhatsApp number
 * @param {string} period - "MM/YYYY" string entered by the user
 * @returns {string}
 */
function getPayslip(userId, period) {
  const trimmed = period.trim();

  if (!/^\d{2}\/\d{4}$/.test(trimmed)) {
    return (
      'Invalid format. Please enter the month and year as *MM/YYYY* ' +
      '(e.g. 07/2024).'
    );
  }

  const employee = getEmployee(userId);
  if (!employee) {
    return (
      'Sorry, we could not find your employee record. ' +
      'Please contact HR for assistance.\n\nReply *0* to return to the main menu.'
    );
  }

  const payslip = employee.payslips[trimmed];
  if (!payslip) {
    return (
      `No pay slip found for *${trimmed}*.\n\n` +
      'Please check the period and try again, or contact HR for assistance.\n\n' +
      'Reply *3* to request another pay slip or *0* for the main menu.'
    );
  }

  const fmt = (amount) =>
    `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

  return (
    `*Pay Slip – ${payslip.month}*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Employee   : ${employee.name}\n` +
    `Employee ID: ${employee.id}\n` +
    `Department : ${employee.department}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Gross Salary : ${fmt(payslip.gross)}\n` +
    `Deductions   : ${fmt(payslip.deductions)}\n` +
    `Net Salary   : ${fmt(payslip.net)}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Reply *0* to return to the main menu.`
  );
}

module.exports = { getPayslipPrompt, getPayslip };
