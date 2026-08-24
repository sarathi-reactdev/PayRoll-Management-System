import React from 'react';
import { 
  DollarSign, 
  Users, 
  ArrowUpRight, 
  FileUp, 
  CheckCircle2, 
  FileSpreadsheet, 
  Building, 
  Send, 
  Download,
  CreditCard,
  Lock
} from 'lucide-react';
import { SalaryBreakdown, CompanySettings, PayrollStatus, UserRole } from '../types/payroll';

interface DashboardOverviewProps {
  salaries: SalaryBreakdown[];
  settings: CompanySettings;
  payrollStatus: PayrollStatus;
  onUpdatePayrollStatus: (status: PayrollStatus) => void;
  onOpenUploadModal: () => void;
  onOpenBankTransferModal: () => void;
  onOpenEmailModal: () => void;
  onExportConsolidatedExcel: () => void;
  onExportDeptSummaryExcel: () => void;
  onBatchDownloadPDF: () => void;
  currentRole: UserRole;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  salaries,
  settings,
  payrollStatus,
  onUpdatePayrollStatus,
  onOpenUploadModal,
  onOpenBankTransferModal,
  onOpenEmailModal,
  onExportConsolidatedExcel,
  onBatchDownloadPDF,
  currentRole,
}) => {
  const sym = settings.currencySymbol || '$';

  // Calculations
  const totalGross = salaries.reduce((acc, s) => acc + (s.grossEarnings ?? 0), 0);
  const totalEmployees = salaries.length;

  // Status Badge Helper
  const getStatusBadge = (status: PayrollStatus) => {
    switch (status) {
      case 'draft':
        return { label: 'Draft', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'under_review':
        return { label: 'Under Review', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'approved':
        return { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'disbursed':
        return { label: 'Disbursed', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'locked':
        return { label: 'Locked & Archived', bg: 'bg-slate-200 text-slate-800 border-slate-400' };
    }
  };

  const statusBadge = getStatusBadge(payrollStatus);

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Cycle Status & Action Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Payroll Processing Command Center
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.bg}`}>
              {statusBadge.label}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Period: <span className="font-semibold text-slate-700">{salaries[0]?.periodLabel || 'August 2026'}</span> • {totalEmployees} Active Employees Ingested • Currency: {settings.currency} ({sym})
          </p>
        </div>

        {/* Workflow Action Buttons */}
        {currentRole !== 'employee' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-upload-attendance"
              onClick={onOpenUploadModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
              <span>Ingest Attendance Excel</span>
            </button>

            {payrollStatus === 'draft' && (
              <button
                id="btn-submit-review"
                onClick={() => onUpdatePayrollStatus('under_review')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Submit for Review</span>
              </button>
            )}

            {payrollStatus === 'under_review' && (currentRole === 'super_admin' || currentRole === 'hr_manager') && (
              <button
                id="btn-approve-payroll"
                onClick={() => onUpdatePayrollStatus('approved')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Payroll Run</span>
              </button>
            )}

            {payrollStatus === 'approved' && (
              <button
                id="btn-mark-disbursed"
                onClick={() => onUpdatePayrollStatus('disbursed')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Mark Disbursed</span>
              </button>
            )}

            {payrollStatus === 'disbursed' && (
              <button
                id="btn-lock-cycle"
                onClick={() => onUpdatePayrollStatus('locked')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Cycle</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Card 1: Gross Payroll */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Gross Payroll</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {sym} {totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Total monthly gross wage obligation across all employees
            </p>
          </div>
        </div>

        {/* Card 2: Total Active Staff */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Active Employees</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {totalEmployees}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active staff members on current payroll roster
            </p>
          </div>
        </div>

      </div>

      {/* Quick Action Ribbon */}
      {currentRole !== 'employee' && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Multi-Format Output & Dispatch Center:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-excel-register"
              onClick={onExportConsolidatedExcel}
              className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Consolidated Excel Register</span>
            </button>

            <button
              id="btn-export-bank-advice"
              onClick={onOpenBankTransferModal}
              className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer"
            >
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bank Transfer Advice (NEFT/ACH)</span>
            </button>

            <button
              id="btn-batch-pdf-download"
              onClick={onBatchDownloadPDF}
              className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>Batch Download All PDFs</span>
            </button>

            <button
              id="btn-email-dispatch"
              onClick={onOpenEmailModal}
              className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium shadow-2xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Email Pay Slips</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
