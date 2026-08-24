import * as XLSX from 'xlsx';
import { CompanySettings, SalaryBreakdown, BankTransferRecord } from '../types/payroll';
import { generatePaySlipPDF } from './pdfGenerator';

/**
 * Exports complete consolidated payroll register to Excel (.xlsx)
 */
export function exportConsolidatedPayrollExcel(salaries: SalaryBreakdown[], settings: CompanySettings, periodLabel: string): void {
  const data = salaries.map(s => ({
    'Employee ID': s.profile.empId,
    'Employee Name': s.profile.name,
    'Department': s.profile.department,
    'Designation': s.profile.designation,
    'Structure': s.profile.structureType.toUpperCase(),
    'Total Month Days': s.totalDays,
    'Days Present': s.attendance.daysPresent,
    'Paid Leaves': s.attendance.paidLeaves,
    'Unpaid Leaves (LOP)': s.lossOfPayDays,
    'Payable Days': s.payableDays,
    'OT Hours': s.attendance.overtimeHours,
    'Basic Salary': s.basicPay,
    'HRA': s.hra,
    'Conveyance Allowance': s.conveyanceAllowance,
    'Medical Allowance': s.medicalAllowance,
    'Special Allowance': s.specialAllowance,
    'Overtime Pay': s.overtimePay,
    'Holiday Shift Pay': s.holidayWorkPay,
    'Bonus & Incentives': s.performanceBonus,
    'Reimbursements': s.reimbursements,
    'GROSS EARNINGS': s.grossEarnings,
    'Provident Fund (PF)': s.providentFund,
    'Employer PF (CTC)': s.employerPF,
    'Health Insurance (ESI)': s.esi,
    'Income Tax (TDS)': s.incomeTaxTDS,
    'Professional Tax (PT)': s.professionalTax,
    'LOP Deductions': s.lossOfPayDeduction,
    'Late Penalty': s.lateDeduction,
    'Other Deductions': s.otherDeductions,
    'TOTAL DEDUCTIONS': s.totalDeductions,
    'NET PAY': s.netPay,
    'Currency': settings.currency,
    'Bank Name': s.profile.bankName,
    'Account Number': s.profile.accountNumber,
    'Routing / IFSC': s.profile.routingOrIfsc,
    'Status': s.status.toUpperCase(),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payroll_Register');

  const filename = `${settings.name.replace(/[^a-zA-Z0-9]/g, '_')}_Payroll_Register_${periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exports Bank Transfer Advice file formatted for automated banking systems (NEFT/ACH/Direct Deposit)
 */
export function exportBankTransferAdvice(salaries: SalaryBreakdown[], settings: CompanySettings, periodLabel: string): void {
  const data: BankTransferRecord[] = salaries.map((s, idx) => ({
    empId: s.profile.empId,
    employeeName: s.profile.name,
    bankName: s.profile.bankName,
    accountNumber: s.profile.accountNumber,
    routingOrIfsc: s.profile.routingOrIfsc,
    amount: s.netPay,
    paymentReference: `SAL-${s.month.replace('-', '')}-${(idx + 1).toString().padStart(4, '0')}`,
    status: 'pending',
  }));

  const formattedRows = data.map(d => ({
    'Payment Reference': d.paymentReference,
    'Beneficiary Name': d.employeeName,
    'Employee ID': d.empId,
    'Bank Name': d.bankName,
    'Account Number': d.accountNumber,
    'Routing / IFSC Code': d.routingOrIfsc,
    'Net Transfer Amount': d.amount,
    'Currency': settings.currency,
    'Payment Type': 'SALARY_DIRECT_DEPOSIT',
    'Payment Remarks': `Salary for ${periodLabel}`,
  }));

  const ws = XLSX.utils.json_to_sheet(formattedRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bank_Transfer_Advice');

  const filename = `Bank_Transfer_Advice_${periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exports Departmental Summary breakdown report
 */
export function exportDepartmentSummaryExcel(salaries: SalaryBreakdown[], settings: CompanySettings, periodLabel: string): void {
  const deptMap: Record<string, {
    dept: string;
    headcount: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    totalOT: number;
    totalPF: number;
    totalTDS: number;
  }> = {};

  salaries.forEach(s => {
    const d = s.profile.department || 'General';
    if (!deptMap[d]) {
      deptMap[d] = {
        dept: d,
        headcount: 0,
        totalGross: 0,
        totalDeductions: 0,
        totalNet: 0,
        totalOT: 0,
        totalPF: 0,
        totalTDS: 0,
      };
    }
    deptMap[d].headcount += 1;
    deptMap[d].totalGross += s.grossEarnings;
    deptMap[d].totalDeductions += s.totalDeductions;
    deptMap[d].totalNet += s.netPay;
    deptMap[d].totalOT += s.overtimePay;
    deptMap[d].totalPF += s.providentFund;
    deptMap[d].totalTDS += s.incomeTaxTDS;
  });

  const rows = Object.values(deptMap).map(d => ({
    'Department': d.dept,
    'Headcount': d.headcount,
    'Total Gross Earnings': Math.round(d.totalGross * 100) / 100,
    'Total Deductions': Math.round(d.totalDeductions * 100) / 100,
    'Total Net Payout': Math.round(d.totalNet * 100) / 100,
    'Total Overtime Payout': Math.round(d.totalOT * 100) / 100,
    'Total PF (Employee)': Math.round(d.totalPF * 100) / 100,
    'Total TDS (Tax)': Math.round(d.totalTDS * 100) / 100,
    'Average Net Salary': Math.round((d.totalNet / d.headcount) * 100) / 100,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dept_Payroll_Summary');

  const filename = `Department_Payroll_Summary_${periodLabel.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Downloads batch PDFs sequentially for multiple employees
 */
export async function downloadBatchPDFs(salaries: SalaryBreakdown[], settings: CompanySettings): Promise<void> {
  for (let i = 0; i < salaries.length; i++) {
    const salary = salaries[i];
    generatePaySlipPDF(salary, settings);
    // Slight pause to ensure browser download handling
    if (salaries.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}
