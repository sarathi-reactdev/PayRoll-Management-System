export type SalaryStructureType = 'fixed' | 'hourly' | 'contract' | 'piece_rate';

export type PaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'upi';

export type PayrollStatus = 'draft' | 'under_review' | 'approved' | 'disbursed' | 'locked';

export type UserRole = 'super_admin' | 'hr_manager' | 'dept_head' | 'employee';

export interface CompanySettings {
  name: string;
  appTitle?: string;
  brandSubTitle?: string;
  logoUrl?: string;
  address: string;
  taxId: string; // EIN / GST / PAN / VAT
  email: string;
  phone: string;
  website: string;
  currency: string;
  currencySymbol: string;
  payCycleDayCount: number; // e.g. 30 or actual days in month
  otRateMultiplier: number; // e.g. 1.5x
  holidayOtMultiplier: number; // e.g. 2.0x
  lateDeductionThreshold: number; // e.g. 3 late marks = 0.5 day salary
  pfPercentage: number; // 12%
  pfCapLimit: number; // e.g. 1800 or 0 for uncapped
  esiPercentage: number; // 0.75%
  esiWageThreshold: number; // e.g. 21000 or 3000
  ptSlabAmount: number; // Professional Tax flat/slab
  companySignatoryName: string;
  companySignatoryTitle: string;
}

export interface EmployeeProfile {
  id: string;
  empId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  joinDate: string;
  resignationDate?: string;
  isProbation?: boolean;
  structureType: SalaryStructureType;
  baseSalary: number; // Monthly basic or hourly rate or piece rate
  hourlyRate?: number;
  bankName: string;
  accountNumber: string;
  routingOrIfsc: string;
  panOrTaxNumber: string;
  pfAccountNumber?: string;
  uanNumber?: string;
  preferredPaymentMethod?: PaymentMethod; // 'bank_transfer' | 'cash' | 'cheque' | 'upi'
  avatarUrl?: string;
  gender?: string;
}

export interface AttendanceRecord {
  empId: string;
  employeeName?: string;
  department?: string;
  totalMonthDays: number;
  daysPresent: number;
  daysAbsent: number;
  halfDays: number;
  paidLeaves: number;
  unpaidLeaves: number; // Loss of Pay (LOP)
  overtimeHours: number;
  holidayOvertimeHours: number;
  lateArrivalsCount: number;
  earlyDeparturesCount: number;
  holidaysWorked: number;
  piecesCompleted?: number;
  baseSalary?: number;
  remarks?: string;
}

export interface SalaryBreakdown {
  id: string;
  empId: string;
  month: string; // e.g. "2026-08"
  periodLabel: string; // e.g. "August 2026"
  profile: EmployeeProfile;
  attendance: AttendanceRecord;
  
  // Working days summary
  totalDays: number;
  payableDays: number;
  lossOfPayDays: number;
  
  // Earnings
  basicPay: number;
  hra: number; // House Rent Allowance (e.g. 40% of basic)
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  overtimePay: number;
  holidayWorkPay: number;
  performanceBonus: number;
  reimbursements: number;
  grossEarnings: number;
  
  // Deductions
  providentFund: number; // Employee PF (12%)
  employerPF: number; // Employer PF (12% for reference/CTC)
  esi: number; // Health Insurance / ESI
  professionalTax: number; // PT
  incomeTaxTDS: number; // TDS
  lossOfPayDeduction: number; // Proration deduction for absent days
  lateDeduction: number; // Penalty for late marks
  otherDeductions: number;
  totalDeductions: number;
  
  // Net
  netPay: number;
  netPayInWords: string;
  
  // Payment Mode (Bank Transfer, Cash, UPI, Cheque)
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentStatus?: 'pending' | 'paid' | 'unpaid';
  paidAt?: string;

  // Status & Audit
  status: PayrollStatus;
  isCustomAdjusted: boolean;
  adjustmentReason?: string;
  lastUpdated: string;
}

export interface ColumnMapping {
  empId: string;
  name: string;
  department: string;
  daysPresent: string;
  daysAbsent: string;
  halfDays: string;
  overtimeHours: string;
  paidLeaves: string;
  unpaidLeaves: string;
  holidaysWorked: string;
  lateArrivals: string;
  baseSalary?: string;
}

export interface AuditLog {
  id: string;
  empId: string;
  employeeName: string;
  fieldChanged: string;
  previousValue: string | number;
  newValue: string | number;
  changedBy: string;
  timestamp: string;
  reason: string;
}

export interface BankTransferRecord {
  empId: string;
  employeeName: string;
  bankName: string;
  accountNumber: string;
  routingOrIfsc: string;
  amount: number;
  paymentReference: string;
  status: 'pending' | 'success' | 'failed';
}

export interface EmailDispatchRecord {
  empId: string;
  employeeName: string;
  email: string;
  sentAt?: string;
  status: 'ready' | 'sent' | 'failed';
  error?: string;
}
