import React from 'react';
import { X, Building, Download, CheckCircle2, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { SalaryBreakdown, CompanySettings } from '../types/payroll';
import { exportBankTransferAdvice } from '../utils/exportUtils';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaries: SalaryBreakdown[];
  settings: CompanySettings;
}

export const BankTransferModal: React.FC<BankTransferModalProps> = ({
  isOpen,
  onClose,
  salaries,
  settings,
}) => {
  if (!isOpen) return null;

  const sym = settings.currencySymbol || '$';
  const totalPayout = salaries.reduce((acc, s) => acc + s.netPay, 0);
  const periodLabel = salaries[0]?.periodLabel || 'August 2026';

  const handleExport = () => {
    exportBankTransferAdvice(salaries, settings, periodLabel);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Direct Deposit & Bank Transfer Advice</h2>
              <p className="text-xs text-slate-500">Corporate banking payment batch file generator (NEFT / ACH)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="px-6 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-4 text-indigo-950">
            <span>Total Beneficiaries: <strong>{salaries.length}</strong></span>
            <span>•</span>
            <span>Total Net Payout: <strong className="text-indigo-700 font-extrabold">{sym} {totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
            <span>•</span>
            <span>Batch Reference: <strong className="font-mono">BATCH-{periodLabel.replace(/\s+/g, '-').toUpperCase()}</strong></span>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Bank Excel Advice</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Beneficiary Name</th>
                  <th className="p-3">Bank Name</th>
                  <th className="p-3">Account Number</th>
                  <th className="p-3">Routing / IFSC</th>
                  <th className="p-3 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {salaries.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">
                      SAL-{s.month.replace('-', '')}-{(idx + 1).toString().padStart(4, '0')}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{s.profile.name}</td>
                    <td className="p-3 text-slate-600">{s.profile.bankName}</td>
                    <td className="p-3 font-mono text-slate-800">{s.profile.accountNumber}</td>
                    <td className="p-3 font-mono text-slate-600">{s.profile.routingOrIfsc}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      {sym} {s.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ready for upload to corporate internet banking portals (ACH/NEFT)</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
