import React from 'react';
import { X, ShieldCheck, Clock, User, FileText, ArrowRight } from 'lucide-react';
import { AuditLog, CompanySettings } from '../types/payroll';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  settings: CompanySettings;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({
  isOpen,
  onClose,
  logs,
  settings,
}) => {
  if (!isOpen) return null;

  const sym = settings.currencySymbol || '$';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Payroll Compliance & Audit Trail</h2>
              <p className="text-xs text-slate-500">Immutable ledger of all salary overrides, adjustments and approvals</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No manual salary overrides have been logged in this payroll cycle.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
              {logs.map((log) => (
                <div key={log.id} className="p-4 bg-white hover:bg-slate-50 transition text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{log.employeeName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({log.empId})</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                        {log.fieldChanged}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-700">
                    <span className="text-slate-400">Previous:</span>
                    <span className="line-through font-medium text-slate-500">{typeof log.previousValue === 'number' ? `${sym}${log.previousValue.toLocaleString()}` : log.previousValue}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-emerald-700">{typeof log.newValue === 'number' ? `${sym}${log.newValue.toLocaleString()}` : log.newValue}</span>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-[11px] text-slate-600">
                    <strong className="font-semibold text-slate-700">Justification:</strong> {log.reason}
                    <span className="ml-2 text-slate-400">• Approved by {log.changedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Total Audit Records: {logs.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition"
          >
            Close Ledger
          </button>
        </div>

      </div>
    </div>
  );
};
