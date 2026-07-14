'use strict';

const { processMessage } = require('../src/bot');
const { resetSession, getScreen } = require('../src/sessions');

// Use a test employee that exists in the sample data
const USER = 'whatsapp:+27821234567';

beforeEach(() => {
  resetSession(USER);
});

// ─── Main menu ────────────────────────────────────────────────────────────────

describe('Main menu', () => {
  test('any unrecognised first message shows the main menu', () => {
    const reply = processMessage(USER, 'hello');
    expect(reply).toContain('Welcome to the ESS WhatsApp Bot');
    expect(reply).toContain('1️⃣');
    expect(reply).toContain('2️⃣');
    expect(reply).toContain('3️⃣');
  });

  test('invalid menu selection re-shows the main menu', () => {
    processMessage(USER, 'hello'); // move to MAIN_MENU
    const reply = processMessage(USER, '9');
    expect(reply).toContain('Welcome to the ESS WhatsApp Bot');
  });

  test('"0" from a sub-state returns to the main menu', () => {
    processMessage(USER, '2'); // go to leave type prompt
    const reply = processMessage(USER, '0');
    expect(reply).toContain('Welcome to the ESS WhatsApp Bot');
  });
});

// ─── Feature 1: View leave balance ───────────────────────────────────────────

describe('View leave balance', () => {
  test('selecting 1 shows the leave balance', () => {
    processMessage(USER, 'hi'); // show menu
    const reply = processMessage(USER, '1');
    expect(reply).toContain('Leave Balance');
    expect(reply).toContain('Annual Leave');
    expect(reply).toContain('Sick Leave');
    expect(reply).toContain('Family Leave');
  });

  test('leave balance shows numeric values', () => {
    processMessage(USER, 'hi');
    const reply = processMessage(USER, '1');
    // Sample data has 15 annual, 10 sick, 5 family
    expect(reply).toMatch(/15/);
    expect(reply).toMatch(/10/);
    expect(reply).toMatch(/5/);
  });

  test('unknown employee gets a helpful error message', () => {
    const unknownUser = 'whatsapp:+27800000000';
    resetSession(unknownUser);
    processMessage(unknownUser, 'hi');
    const reply = processMessage(unknownUser, '1');
    expect(reply).toContain('could not find your employee record');
  });
});

// ─── Feature 2: Apply for leave ──────────────────────────────────────────────

describe('Apply for leave', () => {
  function startLeaveApplication() {
    processMessage(USER, 'hi');       // show menu
    processMessage(USER, '2');        // → LEAVE_APPLY_TYPE
  }

  test('selecting 2 prompts for leave type', () => {
    processMessage(USER, 'hi');
    const reply = processMessage(USER, '2');
    expect(reply).toContain('Apply for Leave');
    expect(reply).toContain('Annual Leave');
    expect(reply).toContain('Sick Leave');
    expect(reply).toContain('Family Leave');
  });

  test('invalid leave type shows an error and re-prompts', () => {
    startLeaveApplication();
    const reply = processMessage(USER, '9');
    expect(reply).toContain('Invalid selection');
  });

  test('valid leave type prompts for start date', () => {
    startLeaveApplication();
    const reply = processMessage(USER, '1'); // Annual
    expect(reply).toContain('start date');
    expect(reply).toContain('DD/MM/YYYY');
  });

  test('invalid start date shows an error', () => {
    startLeaveApplication();
    processMessage(USER, '1');          // select Annual
    const reply = processMessage(USER, 'not-a-date');
    expect(reply).toContain('Invalid date format');
  });

  test('valid start date prompts for end date', () => {
    startLeaveApplication();
    processMessage(USER, '1');
    const reply = processMessage(USER, '01/08/2024');
    expect(reply).toContain('end date');
  });

  test('end date before start date shows an error', () => {
    startLeaveApplication();
    processMessage(USER, '1');
    processMessage(USER, '10/08/2024'); // start
    const reply = processMessage(USER, '05/08/2024'); // end before start
    expect(reply).toContain('cannot be before');
  });

  test('valid end date prompts for reason', () => {
    startLeaveApplication();
    processMessage(USER, '1');
    processMessage(USER, '01/08/2024');
    const reply = processMessage(USER, '05/08/2024');
    expect(reply).toContain('reason');
  });

  test('complete leave application returns a confirmation with reference', () => {
    startLeaveApplication();
    processMessage(USER, '1');           // Annual
    processMessage(USER, '05/08/2024'); // start
    processMessage(USER, '09/08/2024'); // end (Mon–Fri = 5 working days)
    const reply = processMessage(USER, 'Family vacation');
    expect(reply).toContain('Leave Application Submitted');
    expect(reply).toContain('LA-');
    expect(reply).toContain('Annual Leave');
    expect(reply).toContain('Family vacation');
  });

  test('application is rejected when leave balance is insufficient', () => {
    // Exhaust annual leave balance: apply for 20 days (leave balance is 15)
    processMessage(USER, 'hi');
    processMessage(USER, '2');
    processMessage(USER, '1');           // Annual
    processMessage(USER, '01/01/2025');
    processMessage(USER, '31/01/2025'); // 23 working days → exceeds balance
    const reply = processMessage(USER, 'Long holiday');
    expect(reply).toContain('Insufficient Leave Balance');
  });
});

// ─── Feature 3: Request pay slip ─────────────────────────────────────────────

describe('Request pay slip', () => {
  test('selecting 3 prompts for month/year', () => {
    processMessage(USER, 'hi');
    const reply = processMessage(USER, '3');
    expect(reply).toContain('Pay Slip');
    expect(reply).toContain('MM/YYYY');
  });

  test('valid period returns the pay slip', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '3');
    const reply = processMessage(USER, '07/2024');
    expect(reply).toContain('July 2024');
    expect(reply).toContain('R47,000.00'); // gross salary from sample data
    expect(reply).toContain('R39,800.00'); // net salary from sample data
  });

  test('invalid format shows an error', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '3');
    const reply = processMessage(USER, 'july 2024');
    expect(reply).toContain('Invalid format');
  });

  test('period with no pay slip shows a helpful message', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '3');
    const reply = processMessage(USER, '01/2000');
    expect(reply).toContain('No pay slip found');
  });
});

// ─── Helper: countWorkingDays ─────────────────────────────────────────────────

describe('countWorkingDays', () => {
  const { countWorkingDays } = require('../src/handlers/leaveHandler');

  test('single Monday = 1 working day', () => {
    const d = new Date('2024-08-05'); // Monday
    expect(countWorkingDays(d, d)).toBe(1);
  });

  test('Monday to Friday = 5 working days', () => {
    expect(countWorkingDays(new Date('2024-08-05'), new Date('2024-08-09'))).toBe(5);
  });

  test('weekend days are not counted', () => {
    // Saturday 10 Aug to Monday 12 Aug = 1 working day (Monday only)
    expect(countWorkingDays(new Date('2024-08-10'), new Date('2024-08-12'))).toBe(1);
  });
});

// ─── Interactive button screen tracking ──────────────────────────────────────
// getScreen() returns the identifier the server uses to decide which Twilio
// Content Template to send (or null for plain data/prompt replies).

describe('Interactive button screen tracking', () => {
  test('first message sets screen to MAIN_MENU', () => {
    processMessage(USER, 'hi');
    expect(getScreen(USER)).toBe('MAIN_MENU');
  });

  test('unknown input re-shows main menu (screen = MAIN_MENU)', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '9'); // invalid option
    expect(getScreen(USER)).toBe('MAIN_MENU');
  });

  test('"2" navigates to leave type selection (screen = LEAVE_TYPE)', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '2');
    expect(getScreen(USER)).toBe('LEAVE_TYPE');
  });

  test('"1" shows leave balance — data reply, screen is null', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '1');
    expect(getScreen(USER)).toBeNull();
  });

  test('"3" opens payslip period prompt — free-text input, screen is null', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '3');
    expect(getScreen(USER)).toBeNull();
  });

  test('"0" from leave type step returns to main menu (screen = MAIN_MENU)', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '2'); // → LEAVE_TYPE
    processMessage(USER, '0'); // cancel → main menu
    expect(getScreen(USER)).toBe('MAIN_MENU');
  });

  test('invalid leave type shows text error — screen cleared to null', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '2'); // → LEAVE_TYPE (screen = LEAVE_TYPE)
    processMessage(USER, '9'); // invalid selection
    expect(getScreen(USER)).toBeNull();
  });

  test('button payload "2" (same as typing "2") navigates to leave type', () => {
    processMessage(USER, 'hi');
    const reply = processMessage(USER, '2'); // button tap sends id "2"
    expect(reply).toContain('Apply for Leave');
    expect(getScreen(USER)).toBe('LEAVE_TYPE');
  });

  test('button payload "1" (same as typing "1") shows leave balance', () => {
    processMessage(USER, 'hi');
    const reply = processMessage(USER, '1'); // button tap sends id "1"
    expect(reply).toContain('Leave Balance');
    expect(getScreen(USER)).toBeNull();
  });

  test('screen is null after leave confirmation (data reply stays in MAIN_MENU state)', () => {
    processMessage(USER, 'hi');
    processMessage(USER, '2');          // → LEAVE_TYPE
    processMessage(USER, '1');          // Annual
    processMessage(USER, '05/08/2024'); // start date
    processMessage(USER, '09/08/2024'); // end date
    processMessage(USER, 'Holiday');    // reason → confirmation
    expect(getScreen(USER)).toBeNull();
  });
});
