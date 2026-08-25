import React, { useState } from 'react';
import { X, Send, Mail, CheckCircle2, AlertCircle, RefreshCw, Sparkles, FileText } from 'lucide-react';
import { SalaryBreakdown, CompanySettings, EmailDispatchRecord } from '../types/payroll';

interface EmailDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaries: SalaryBreakdown[];
  settings: CompanySettings;
}

export const EmailDistributionModal: React.FC<EmailDistributionModalProps> = ({
  isOpen,
  onClose,
  salaries,
  settings,
}) => {
  if (!isOpen) return null;

  const [subject, setSubject] = useState(`Official Pay Slip - ${salaries[0]?.periodLabel || 'August 2026'} - ${settings.name}`);
  const [emailBody, setEmailBody] = useState(`Dear Employee,\n\nPlease find attached your verified monthly pay slip for the period ${salaries[0]?.periodLabel || 'August 2026'}.\n\nFor any inquiries or tax declarations, please contact ${settings.email}.\n\nWarm regards,\nPayroll Operations Team\n${settings.name}`);
  
  const [isSending, setIsSending] = useState(false);
  const [dispatched, setDispatched] = useState<Record<string, 'sent' | 'pending' | 'failed'>>({});
  const [progress, setProgress] = useState(0);

  const handleStartDispatch = async () => {
    setIsSending(true);
    setProgress(0);
    const updated: Record<string, 'sent' | 'pending' | 'failed'> = {};

    for (let i = 0; i < salaries.length; i++) {
      const s = salaries[i];
      // Simulate real-time email dispatch queue
      await new Promise(r => setTimeout(r, 400));
      updated[s.empId] = 'sent';
      setDispatched({ ...updated });
      setProgress(Math.round(((i + 1) / salaries.length) * 100));
    }
    setIsSending(false);
  };

  const sentCount = Object.values(dispatched).filter(v => v === 'sent').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Direct Email Pay Slip Distribution Engine</h2>
              <p className="text-xs text-slate-500">Automated dispatch of individual encrypted PDF salary slips</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* Email Template Configuration */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Email Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full font-medium bg-white border border-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Message Body Template</label>
              <textarea
                rows={4}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full font-medium bg-white border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              * Individual PDF payslips will be generated dynamically and securely attached to each recipient's email.
            </p>
          </div>

          {/* Progress Bar when dispatching */}
          {isSending && (
            <div className="space-y-1.5 bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <div className="flex justify-between font-semibold text-blue-900">
                <span>Dispatching Pay Slips...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Recipient Roster */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Recipient Roster ({salaries.length} Employees)</h3>
              {sentCount > 0 && (
                <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{sentCount} of {salaries.length} successfully delivered</span>
                </span>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5">Emp ID</th>
                    <th className="p-2.5">Employee Name</th>
                    <th className="p-2.5">Target Email</th>
                    <th className="p-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {salaries.map((s) => {
                    const status = dispatched[s.empId] || 'pending';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-600">{s.profile.empId}</td>
                        <td className="p-2.5 font-bold text-slate-900">{s.profile.name}</td>
                        <td className="p-2.5 text-slate-600 font-mono">{s.profile.email}</td>
                        <td className="p-2.5 text-right">
                          {status === 'sent' ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Delivered</span>
                            </span>
                          ) : isSending ? (
                            <span className="text-blue-600 font-medium animate-pulse">Sending...</span>
                          ) : (
                            <span className="text-slate-400">Ready in Queue</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <button
            disabled={isSending}
            onClick={handleStartDispatch}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg shadow-xs transition"
          >
            {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isSending ? 'Sending in Progress...' : 'Start Email Dispatch Batch'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
