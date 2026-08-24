import React, { useState } from 'react';
import { X, Edit3, CheckCircle2, ShieldAlert, Calendar, DollarSign, Clock, Banknote, Landmark, Smartphone, FileText } from 'lucide-react';
import { SalaryBreakdown, CompanySettings, AttendanceRecord, PaymentMethod } from '../types/payroll';

interface SalaryAdjustmentModalProps {
  isOpen: boolean;
  salary: SalaryBreakdown | null;
  settings: CompanySettings;
  onClose: () => void;
  onSaveAdjustment: (
    updatedSalary: SalaryBreakdown,
    reason: string,
    fieldChanged: string,
    prevVal: any,
    newVal: any,
    updatedAttendance?: Partial<AttendanceRecord>
  ) => void;
}

export const SalaryAdjustmentModal: React.FC<SalaryAdjustmentModalProps> = ({
  isOpen,
  salary,
  settings,
  onClose,
  onSaveAdjustment,
}) => {
  if (!isOpen || !salary) return null;

  const sym = settings.currencySymbol || '$';
  const totalMonthDays = salary.attendance.totalMonthDays || settings.payCycleDayCount || 30;

  // Attendance states
  const [daysPresent, setDaysPresent] = useState<number>(salary.attendance.daysPresent ?? totalMonthDays);
  const [daysAbsent, setDaysAbsent] = useState<number>(salary.attendance.daysAbsent ?? 0);
  const [paidLeaves, setPaidLeaves] = useState<number>(salary.attendance.paidLeaves ?? 0);
  const [unpaidLeaves, setUnpaidLeaves] = useState<number>(salary.attendance.unpaidLeaves ?? 0);
  const [overtimeHours, setOvertimeHours] = useState<number>(salary.attendance.overtimeHours ?? 0);

  // Financial adjustments
  const [bonus, setBonus] = useState<number>(salary.performanceBonus || 0);
  const [reimbursements, setReimbursements] = useState<number>(salary.reimbursements || 0);
  const [otherDeductions, setOtherDeductions] = useState<number>(salary.otherDeductions || 0);
  const [overtimePay, setOvertimePay] = useState<number>(salary.overtimePay || 0);
  
  // Payment mode states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(salary.paymentMethod || 'bank_transfer');
  const [paymentReference, setPaymentReference] = useState<string>(
    salary.paymentReference || 
    (salary.paymentMethod === 'cash' 
      ? `CASH-VCHR-${salary.month.replace('-', '')}-${salary.empId.replace(/[^a-zA-Z0-9]/g, '')}`
      : `TXN-${salary.month.replace('-', '')}-${salary.empId.replace(/[^a-zA-Z0-9]/g, '')}`)
  );

  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Dynamically calculate payable days & proration
  const payableDays = Math.min(totalMonthDays, Math.max(0, daysPresent + paidLeaves));
  const lossOfPayDays = Math.max(0, totalMonthDays - payableDays);
  const perDaySalary = salary.basicPay > 0 && totalMonthDays > 0 ? salary.basicPay / totalMonthDays : 0;
  const computedLopDeduction = Math.round(perDaySalary * lossOfPayDays * 100) / 100;

  // Recompute estimated net pay
  const estimatedGross = Math.round(
    (salary.basicPay + salary.hra + salary.conveyanceAllowance + salary.medicalAllowance + salary.specialAllowance + overtimePay + salary.holidayWorkPay + bonus + reimbursements) * 100
  ) / 100;

  const estimatedTotalDeductions = Math.round(
    (salary.providentFund + salary.esi + salary.professionalTax + salary.incomeTaxTDS + salary.lateDeduction + computedLopDeduction + otherDeductions) * 100
  ) / 100;

  const estimatedNetPay = Math.max(0, Math.round((estimatedGross - estimatedTotalDeductions) * 100) / 100);

  const handleSave = () => {
    if (!reason.trim()) {
      setError('Audit Compliance Mandate: Please provide a valid justification/reason for modifying payroll or attendance records.');
      return;
    }

    const updatedAttendance: Partial<AttendanceRecord> = {
      daysPresent,
      daysAbsent,
      paidLeaves,
      unpaidLeaves: lossOfPayDays,
      overtimeHours,
    };

    const updated: SalaryBreakdown = {
      ...salary,
      payableDays,
      lossOfPayDays,
      lossOfPayDeduction: computedLopDeduction,
      performanceBonus: bonus,
      reimbursements,
      otherDeductions,
      overtimePay,
      grossEarnings: estimatedGross,
      totalDeductions: estimatedTotalDeductions,
      netPay: estimatedNetPay,
      paymentMethod,
      paymentReference,
      isCustomAdjusted: true,
      adjustmentReason: reason,
      lastUpdated: new Date().toISOString(),
      attendance: {
        ...salary.attendance,
        ...updatedAttendance,
      },
    };

    onSaveAdjustment(
      updated, 
      reason, 
      salary.paymentMethod !== paymentMethod ? `Payment Mode Changed to ${paymentMethod.replace('_', ' ').toUpperCase()}` : 'Attendance & Salary Adjustment', 
      salary.netPay, 
      estimatedNetPay, 
      updatedAttendance
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Adjust Attendance & Salary</h3>
              <p className="text-xs text-slate-500">
                {salary.profile?.name || 'Employee'} ({salary.profile?.empId || ''}) • Base: {sym}{(salary.basicPay ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Real-time Net Pay Summary */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-950 flex items-center justify-between">
            <div>
              <span className="text-blue-700 font-medium">Payable Days:</span>{' '}
              <strong className="font-bold text-blue-900">{payableDays} / {totalMonthDays} days</strong>
              {lossOfPayDays > 0 && (
                <span className="text-rose-600 ml-1.5 font-semibold">(-{lossOfPayDays} LOP days)</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-slate-500 mr-1 text-[11px]">Net Pay:</span>
              <strong className="text-sm font-black text-emerald-700">{sym}{(estimatedNetPay ?? 0).toLocaleString()}</strong>
            </div>
          </div>

          {/* Section 1: Attendance Days Input */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Attendance & Leave Days</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Days Present</label>
                <input
                  type="number"
                  min="0"
                  max={totalMonthDays}
                  step="1"
                  value={daysPresent}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(totalMonthDays, parseFloat(e.target.value) || 0));
                    setDaysPresent(val);
                    setDaysAbsent(Math.max(0, totalMonthDays - val - paidLeaves));
                  }}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Days Absent</label>
                <input
                  type="number"
                  min="0"
                  max={totalMonthDays}
                  step="1"
                  value={daysAbsent}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(totalMonthDays, parseFloat(e.target.value) || 0));
                    setDaysAbsent(val);
                    setDaysPresent(Math.max(0, totalMonthDays - val - paidLeaves));
                  }}
                  className="w-full text-xs font-bold text-rose-600 bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Paid Leaves</label>
                <input
                  type="number"
                  min="0"
                  max={totalMonthDays}
                  step="1"
                  value={paidLeaves}
                  onChange={(e) => setPaidLeaves(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Overtime Hrs</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

            {/* Section 2: Financial Adjustments */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Earnings & Additional Deductions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Incentive & Bonus ({sym})</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={bonus}
                    onChange={(e) => setBonus(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Overtime Pay ({sym})</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={overtimePay}
                    onChange={(e) => setOvertimePay(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">Loan & Advances ({sym})</label>
                  <input
                    type="number"
                    min="0"
                    step="25"
                    value={otherDeductions}
                    onChange={(e) => setOtherDeductions(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Payment Mode & Disbursal Channel */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                <span>Payment Mode & Disbursal Method</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank_transfer');
                    setPaymentReference(`TXN-${salary.month.replace('-', '')}-${salary.empId.replace(/[^a-zA-Z0-9]/g, '')}`);
                  }}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Landmark className="w-4 h-4 text-blue-600 mb-1" />
                  <div>
                    <div className="font-bold text-[11px]">Bank Transfer</div>
                    <div className="text-[9px] text-slate-500">Direct Deposit</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setPaymentReference(`CASH-VCHR-${salary.month.replace('-', '')}-${salary.empId.replace(/[^a-zA-Z0-9]/g, '')}`);
                  }}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600 mb-1" />
                  <div>
                    <div className="font-bold text-[11px]">Paid by Cash</div>
                    <div className="text-[9px] text-slate-500">Physical Cash Payout</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('upi');
                    setPaymentReference(`UPI-REF-${Date.now().toString().slice(-6)}`);
                  }}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-1 ring-purple-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-purple-600 mb-1" />
                  <div>
                    <div className="font-bold text-[11px]">UPI / Instant</div>
                    <div className="text-[9px] text-slate-500">Mobile Transfer</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('cheque');
                    setPaymentReference(`CHQ-${Date.now().toString().slice(-6)}`);
                  }}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition cursor-pointer ${
                    paymentMethod === 'cheque'
                      ? 'border-amber-600 bg-amber-50/70 text-amber-900 ring-1 ring-amber-600'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-600 mb-1" />
                  <div>
                    <div className="font-bold text-[11px]">Cheque</div>
                    <div className="text-[9px] text-slate-500">Paper Cheque</div>
                  </div>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Payment Reference / Voucher / Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={paymentMethod === 'cash' ? 'e.g. CASH-VOUCHER-0826-01' : 'e.g. UTR-84920194820'}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

          {/* Section 4: Audit Justification */}
          <div>
            <label className="text-xs font-bold text-slate-900 block mb-1 flex items-center justify-between">
              <span>Reason for Adjustment <span className="text-red-500">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Audit Compliance</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="e.g. Updated attendance based on biometric sign-in log & added $100 bonus"
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {error && (
              <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-2 shrink-0">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-xs transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Changes & Recalculate</span>
          </button>
        </div>

      </div>
    </div>
  );
};
