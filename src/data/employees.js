/**
 * Sample employee data store.
 * Keys are the WhatsApp phone numbers (as received from Twilio, e.g. "whatsapp:+27821234567").
 * In a production system this would be backed by a real HR database.
 */

const employees = {
  'whatsapp:+27821234567': {
    id: 'EMP001',
    name: 'John Doe',
    department: 'Engineering',
    leaveBalance: {
      annual: 15,
      sick: 10,
      family: 5,
    },
    leaveApplications: [],
    payslips: {
      '05/2024': {
        month: 'May 2024',
        gross: 45000,
        deductions: 7000,
        net: 38000,
      },
      '06/2024': {
        month: 'June 2024',
        gross: 45000,
        deductions: 6750,
        net: 38250,
      },
      '07/2024': {
        month: 'July 2024',
        gross: 47000,
        deductions: 7200,
        net: 39800,
      },
    },
  },
  'whatsapp:+27829876543': {
    id: 'EMP002',
    name: 'Jane Smith',
    department: 'Human Resources',
    leaveBalance: {
      annual: 20,
      sick: 8,
      family: 3,
    },
    leaveApplications: [],
    payslips: {
      '06/2024': {
        month: 'June 2024',
        gross: 52000,
        deductions: 8500,
        net: 43500,
      },
      '07/2024': {
        month: 'July 2024',
        gross: 52000,
        deductions: 8500,
        net: 43500,
      },
    },
  },
};

/**
 * Returns the employee record for a given WhatsApp number, or null if not found.
 * @param {string} whatsappNumber - e.g. "whatsapp:+27821234567"
 * @returns {object|null}
 */
function getEmployee(whatsappNumber) {
  return employees[whatsappNumber] || null;
}

/**
 * Persists a new leave application and deducts from the employee's leave balance.
 * Returns the saved application object, or throws if the employee is unknown.
 * @param {string} whatsappNumber
 * @param {{ type: string, startDate: string, endDate: string, reason: string, days: number }} applicationData
 * @returns {object}
 */
function saveLeaveApplication(whatsappNumber, applicationData) {
  const employee = getEmployee(whatsappNumber);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const refNumber = `LA-${Date.now()}`;
  const application = {
    ref: refNumber,
    ...applicationData,
    status: 'Pending',
    submittedAt: new Date().toISOString(),
  };

  employee.leaveApplications.push(application);

  const balanceKey = applicationData.type.toLowerCase().replace(' leave', '');
  if (employee.leaveBalance[balanceKey] !== undefined) {
    employee.leaveBalance[balanceKey] -= applicationData.days;
  }

  return application;
}

module.exports = { getEmployee, saveLeaveApplication };
