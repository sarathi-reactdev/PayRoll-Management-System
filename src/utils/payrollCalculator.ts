import { CompanySettings, EmployeeProfile, AttendanceRecord, SalaryBreakdown } from '../types/payroll';

/**
 * Converts a numeric amount to English words (e.g. 1250.50 -> "One Thousand Two Hundred Fifty Dollars and Fifty Cents")
 */
export function numberToWords(amount: number, currencyName = 'Dollars', centsName = 'Cents'): string {
  if (isNaN(amount) || amount === 0) return `Zero ${currencyName} Only`;

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand', 'Million', 'Billion'];

  function convertChunk(num: number): string {
    let chunkStr = '';
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;

    if (hundred > 0) {
      chunkStr += `${singleDigits[hundred]} Hundred `;
    }

    if (remainder > 0) {
      if (remainder < 10) {
        chunkStr += `${singleDigits[remainder]} `;
      } else if (remainder < 20) {
        chunkStr += `${teens[remainder - 10]} `;
      } else {
        const tenDigit = Math.floor(remainder / 10);
        const singleDigit = remainder % 10;
        chunkStr += `${tens[tenDigit]} ${singleDigits[singleDigit]} `;
      }
    }

    return chunkStr.trim();
  }

  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return `Zero ${currencyName} Only`;

  let words = '';
  let tempInt = integerPart;
  let chunkIdx = 0;

  if (integerPart === 0) {
    words = 'Zero';
  } else {
    while (tempInt > 0) {
      const chunk = tempInt % 1000;
      if (chunk > 0) {
        const chunkWords = convertChunk(chunk);
        words = `${chunkWords} ${thousands[chunkIdx]} ${words}`.trim();
      }
      tempInt = Math.floor(tempInt / 1000);
      chunkIdx++;
    }
  }

  let result = `${words} ${currencyName}`;
  if (decimalPart > 0) {
    result += ` and ${convertChunk(decimalPart)} ${centsName}`;
  }
  result += ' Only';

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Calculates progressive Income Tax (TDS) based on annual projected taxable income
 */
export function calculateEstimatedTDS(monthlyGross: number): number {
  const annualGross = monthlyGross * 12;
  const standardDeduction = 50000; // Standard annual deduction
  const taxableIncome = Math.max(0, annualGross - standardDeduction);

  let annualTax = 0;
  if (taxableIncome <= 300000) {
    annualTax = 0;
  } else if (taxableIncome <= 600000) {
    annualTax = (taxableIncome - 300000) * 0.05;
  } else if (taxableIncome <= 900000) {
    annualTax = 15000 + (taxableIncome - 600000) * 0.10;
  } else if (taxableIncome <= 1200000) {
    annualTax = 45000 + (taxableIncome - 900000) * 0.15;
  } else if (taxableIncome <= 1500000) {
    annualTax = 90000 + (taxableIncome - 1200000) * 0.20;
  } else {
    annualTax = 150000 + (taxableIncome - 1500000) * 0.30;
  }

  // Monthly TDS rounded
  return Math.round((annualTax / 12) * 100) / 100;
}

/**
 * Computes the complete salary breakdown for an employee based on attendance & rules
 */
export function calculateSalaryBreakdown(
  profile: EmployeeProfile,
  attendance: AttendanceRecord,
  settings: CompanySettings,
  month = '2026-08',
  periodLabel = 'August 2026'
): SalaryBreakdown {
  const totalMonthDays = attendance.totalMonthDays || settings.payCycleDayCount || 30;

  // 1. Calculate active join/exit proration if applicable
  let effectiveMaxDays = totalMonthDays;
  if (profile.joinDate) {
    const join = new Date(profile.joinDate);
    const [currYear, currMonth] = month.split('-').map(Number);
    // Only apply joining proration if join date is strictly within the current pay cycle and after day 1
    if (join.getFullYear() === currYear && (join.getMonth() + 1) === currMonth && join.getDate() > 1) {
      const dayOfMonth = join.getDate();
      effectiveMaxDays = Math.max(1, totalMonthDays - dayOfMonth + 1);
    }
  }

  // 2. Payable Days calculation
  const halfDaysValue = (attendance.halfDays || 0) * 0.5;
  const presentDays = attendance.daysPresent ?? 0;
  const paidLeaves = attendance.paidLeaves ?? 0;
  const unpaidLeaves = attendance.unpaidLeaves ?? 0;
  const holidaysWorked = attendance.holidaysWorked ?? 0;

  // If explicit attendance is entered (e.g., from Excel or manual input), respect the recorded present + paid days
  const rawPayableDays = presentDays + paidLeaves + halfDaysValue;
  // If user entered attendance that exceeds effectiveMaxDays, prioritize user's entered attendance up to totalMonthDays
  const maxPossibleDays = Math.max(effectiveMaxDays, Math.min(totalMonthDays, rawPayableDays));
  const payableDays = Math.min(totalMonthDays, Math.max(0, rawPayableDays > 0 ? rawPayableDays : Math.min(effectiveMaxDays, totalMonthDays)));
  const lossOfPayDays = Math.max(0, totalMonthDays - payableDays);

  const prorationFactor = totalMonthDays > 0 ? (payableDays / totalMonthDays) : 1;

  // 3. Base salary calculation according to structure
  let fullMonthlyBase = 0;
  let hourlyRate = 0;

  if (profile.structureType === 'hourly') {
    hourlyRate = profile.hourlyRate || profile.baseSalary || 35;
    // Standard 8h per payable day
    fullMonthlyBase = hourlyRate * 8 * 22; // approx monthly
  } else if (profile.structureType === 'piece_rate') {
    const pieces = attendance.piecesCompleted || 100;
    fullMonthlyBase = profile.baseSalary * pieces;
  } else {
    fullMonthlyBase = profile.baseSalary;
  }

  // Daily rate for proration & loss of pay
  const dailyRate = fullMonthlyBase / totalMonthDays;
  const standardHourlyRate = dailyRate / 8;

  // Basic salary component (50% of base), HRA (40% of Basic), Conveyance, Medical, Special Allowance
  const fullBasic = fullMonthlyBase * 0.50;
  const fullHra = fullBasic * 0.40;
  const fullConveyance = fullMonthlyBase > 3000 ? 200 : 100;
  const fullMedical = fullMonthlyBase > 3000 ? 150 : 80;
  const fullSpecial = Math.max(0, fullMonthlyBase - (fullBasic + fullHra + fullConveyance + fullMedical));

  // Prorated earnings components
  const basicPay = Math.round(fullBasic * prorationFactor * 100) / 100;
  const hra = Math.round(fullHra * prorationFactor * 100) / 100;
  const conveyanceAllowance = Math.round(fullConveyance * prorationFactor * 100) / 100;
  const medicalAllowance = Math.round(fullMedical * prorationFactor * 100) / 100;
  const specialAllowance = Math.round(fullSpecial * prorationFactor * 100) / 100;

  // 4. Overtime & Holiday Pay
  const calcHourlyRate = profile.structureType === 'hourly' ? (profile.hourlyRate || hourlyRate) : standardHourlyRate;
  const otHours = attendance.overtimeHours || 0;
  const holidayOtHours = attendance.holidayOvertimeHours || 0;

  const regularOtPay = otHours * calcHourlyRate * settings.otRateMultiplier;
  const holidayOtPay = holidayOtHours * calcHourlyRate * settings.holidayOtMultiplier;
  const overtimePay = Math.round((regularOtPay + holidayOtPay) * 100) / 100;

  const holidayWorkPay = holidaysWorked > 0 ? Math.round(holidaysWorked * dailyRate * 100) / 100 : 0;
  const performanceBonus = profile.designation.includes('Lead') || profile.designation.includes('Principal') ? 500 : 0;
  const reimbursements = 0;

  // Gross Earnings
  const grossEarnings = Math.round(
    (basicPay + hra + conveyanceAllowance + medicalAllowance + specialAllowance + overtimePay + holidayWorkPay + performanceBonus + reimbursements) * 100
  ) / 100;

  // 5. Deductions
  // Employee Provident Fund (12% of Basic, capped if rule applies)
  let providentFund = (basicPay * (settings.pfPercentage / 100));
  if (settings.pfCapLimit > 0 && providentFund > settings.pfCapLimit) {
    providentFund = settings.pfCapLimit;
  }
  providentFund = Math.round(providentFund * 100) / 100;
  const employerPF = providentFund; // Equal employer contribution

  // ESI / Health insurance (0.75% of Gross if within threshold)
  let esi = 0;
  if (grossEarnings <= settings.esiWageThreshold && settings.esiPercentage > 0) {
    esi = Math.round((grossEarnings * (settings.esiPercentage / 100)) * 100) / 100;
  }

  // Professional Tax (PT)
  const professionalTax = grossEarnings > 1500 ? settings.ptSlabAmount : 0;

  // Income Tax (TDS)
  const incomeTaxTDS = calculateEstimatedTDS(grossEarnings);

  // Late arrival penalty
  let lateDeduction = 0;
  if (attendance.lateArrivalsCount && attendance.lateArrivalsCount >= settings.lateDeductionThreshold) {
    const penaltyUnits = Math.floor(attendance.lateArrivalsCount / settings.lateDeductionThreshold);
    lateDeduction = Math.round((penaltyUnits * 0.5 * dailyRate) * 100) / 100;
  }

  // Loss of Pay (LOP) deduction explicitly logged
  const lossOfPayDeduction = Math.round((unpaidLeaves * dailyRate) * 100) / 100;

  const otherDeductions = 0;

  // Total Deductions
  const totalDeductions = Math.round(
    (providentFund + esi + professionalTax + incomeTaxTDS + lateDeduction + lossOfPayDeduction + otherDeductions) * 100
  ) / 100;

  // 6. Net Pay
  const netPay = Math.max(0, Math.round((grossEarnings - totalDeductions) * 100) / 100);
  const netPayInWords = numberToWords(netPay, settings.currency === 'USD' ? 'Dollars' : 'Rupees', 'Cents');

  return {
    id: `calc-${profile.empId}-${month}`,
    empId: profile.empId,
    month,
    periodLabel,
    profile,
    attendance,
    totalDays: totalMonthDays,
    payableDays: Math.round(payableDays * 10) / 10,
    lossOfPayDays: Math.round(lossOfPayDays * 10) / 10,
    basicPay,
    hra,
    conveyanceAllowance,
    medicalAllowance,
    specialAllowance,
    overtimePay,
    holidayWorkPay,
    performanceBonus,
    reimbursements,
    grossEarnings,
    providentFund,
    employerPF,
    esi,
    professionalTax,
    incomeTaxTDS,
    lossOfPayDeduction,
    lateDeduction,
    otherDeductions,
    totalDeductions,
    netPay,
    netPayInWords,
    paymentMethod: profile.preferredPaymentMethod || 'bank_transfer',
    paymentReference: profile.preferredPaymentMethod === 'cash' 
      ? `CASH-VCHR-${month.replace('-', '')}-${profile.empId.replace(/[^a-zA-Z0-9]/g, '')}`
      : `TXN-${month.replace('-', '')}-${profile.empId.replace(/[^a-zA-Z0-9]/g, '')}`,
    paymentStatus: 'paid',
    paidAt: new Date().toISOString(),
    status: 'draft',
    isCustomAdjusted: false,
    lastUpdated: new Date().toISOString(),
  };
}
