import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mail, 
  MessageCircle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink,
  Phone,
  FileText,
  Download,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  History,
  Clock,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { SalaryBreakdown, CompanySettings } from '../types/payroll';
import { 
  openWhatsAppPayslip, 
  formatWhatsAppPayslipMessage,
  sendEmailPayslip,
  getPayslipPdfFileName,
  getFormattedPeriod,
  normalizePhoneNumber,
  DispatchReceipt
} from '../utils/dispatchHelper';
import { generatePaySlipPDF } from '../utils/pdfGenerator';

interface BulkDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaries: SalaryBreakdown[];
  settings: CompanySettings;
}

export const BulkDispatchModal: React.FC<BulkDispatchModalProps> = ({
  isOpen,
  onClose,
  salaries,
  settings,
}) => {
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email' | 'receipts'>('whatsapp');
  
  // Dynamic Period Calculation
  const firstSalary = salaries[0];
  const defaultPeriod = firstSalary ? getFormattedPeriod(firstSalary) : { ymd: '2026-08', monthName: 'August 2026', combined: '2026-08 (August 2026)' };
  
  // Email states
  const [subject, setSubject] = useState('');
  const [emailBodyTemplate, setEmailBodyTemplate] = useState('');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailDispatched, setEmailDispatched] = useState<Record<string, 'sent' | 'pending' | 'failed'>>({});
  const [emailProgress, setEmailProgress] = useState(0);
  const [selectedEmpForEmail, setSelectedEmpForEmail] = useState<SalaryBreakdown | null>(null);

  // WhatsApp states & Express Queue
  const [waSentMap, setWaSentMap] = useState<Record<string, boolean>>({});
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isQueueActive, setIsQueueActive] = useState<boolean>(false);
  const [selectedEmpForPreview, setSelectedEmpForPreview] = useState<SalaryBreakdown | null>(null);

  // Receipts / Audit Log
  const [receipts, setReceipts] = useState<DispatchReceipt[]>([]);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && salaries.length > 0) {
      const activeSalary = salaries[0];
      const period = getFormattedPeriod(activeSalary);
      const companyName = settings.name || 'iMATRIX TECHNOLOGY SOLUTIONS';
      
      setSubject(`Official Pay Slip - ${period.ymd} (${period.monthName}) - ${companyName}`);
      setEmailBodyTemplate(
`Dear {name} ({empId}),

Please find attached your official Salary Pay Slip (PDF) for the pay period {monthName} [{ymd}].

═══════════════════════════════════════
  SALARY DISBURSEMENT SUMMARY
═══════════════════════════════════════
• Employee ID: {empId}
• Designation: {designation}
• Department: {department}
• Net Take-Home Salary: {currencySymbol} {netPay}
• Payment Mode: {paymentMode}
• Pay Period: {monthName} ({ymd})

📎 ATTACHED PAYSLIP PDF:
File: {pdfFileName}
(Official 1-page digitally authenticated pay slip document)

If you have any questions regarding your salary computation, attendance records, or statutory deductions, please reach out to HR & Payroll Operations at ${settings.email || 'payroll@company.com'}.

Warm regards,
Payroll Operations Team
${companyName}`
      );
      
      setIsEmailSending(false);
      setEmailDispatched({});
      setWaSentMap({});
      setQueueIndex(0);
      setIsQueueActive(false);
      setEmailProgress(0);
      setSelectedEmpForPreview(salaries[0]);
      setSelectedEmpForEmail(salaries[0]);
    }
  }, [isOpen, salaries, settings]);

  if (!isOpen) return null;

  // Helper to personalize body for a specific employee
  const getPersonalizedBody = (s: SalaryBreakdown): string => {
    const period = getFormattedPeriod(s);
    const sym = settings.currencySymbol || '$';
    const pdfName = getPayslipPdfFileName(s);
    const paymentMode = (s.paymentMethod || s.profile.preferredPaymentMethod || 'Bank Transfer').replace('_', ' ').toUpperCase();

    return emailBodyTemplate
      .replace(/{name}/g, s.profile.name)
      .replace(/{empId}/g, s.profile.empId)
      .replace(/{monthName}/g, period.monthName)
      .replace(/{ymd}/g, period.ymd)
      .replace(/{designation}/g, s.profile.designation || 'Staff')
      .replace(/{department}/g, s.profile.department || 'General')
      .replace(/{currencySymbol}/g, sym)
      .replace(/{netPay}/g, s.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 }))
      .replace(/{paymentMode}/g, paymentMode)
      .replace(/{pdfFileName}/g, pdfName);
  };

  // Helper to personalize subject for a specific employee
  const getPersonalizedSubject = (s: SalaryBreakdown): string => {
    const period = getFormattedPeriod(s);
    const companyName = settings.name || 'iMATRIX TECHNOLOGY SOLUTIONS';
    if (subject.trim()) {
      return subject
        .replace(/{name}/g, s.profile.name)
        .replace(/{empId}/g, s.profile.empId)
        .replace(/{monthName}/g, period.monthName)
        .replace(/{ymd}/g, period.ymd);
    }
    return `Official Pay Slip - ${period.ymd} (${period.monthName}) - ${companyName}`;
  };

  // 🚀 Option 1: WhatsApp Express Queue Stepper Action
  // Dispatches current queue employee and smoothly steps to the next one
  const handleExecuteQueueStep = async (targetIndex?: number) => {
    const idx = targetIndex !== undefined ? targetIndex : queueIndex;
    if (idx >= salaries.length) return;

    const currentEmp = salaries[idx];
    setSelectedEmpForPreview(currentEmp);
    setIsQueueActive(true);

    // 1. Trigger WhatsApp + PDF download for this employee
    const res = await openWhatsAppPayslip(currentEmp, settings);
    
    // 2. Mark as sent and record receipt
    setWaSentMap(prev => ({ ...prev, [currentEmp.empId]: true }));
    if (res.receipt) {
      setReceipts(prev => [res.receipt, ...prev]);
    }

    // 3. Advance to next pending employee
    let nextIdx = idx + 1;
    setQueueIndex(nextIdx);
    if (nextIdx < salaries.length) {
      setSelectedEmpForPreview(salaries[nextIdx]);
    }
  };

  // Reset Queue
  const handleResetQueue = () => {
    setQueueIndex(0);
    setIsQueueActive(false);
    if (salaries.length > 0) {
      setSelectedEmpForPreview(salaries[0]);
    }
  };

  // Single employee direct WhatsApp dispatch
  const handleSendWhatsAppOne = async (s: SalaryBreakdown, index?: number) => {
    setSelectedEmpForPreview(s);
    const res = await openWhatsAppPayslip(s, settings);
    if (res.success) {
      setWaSentMap(prev => ({ ...prev, [s.empId]: true }));
      if (res.receipt) {
        setReceipts(prev => [res.receipt, ...prev]);
      }
      if (index !== undefined) {
        setQueueIndex(index + 1);
      }
    }
  };

  // Send single employee email
  const handleSendEmailOne = async (s: SalaryBreakdown) => {
    const personalizedSub = getPersonalizedSubject(s);
    const personalizedBody = getPersonalizedBody(s);

    const res = await sendEmailPayslip(s, settings, personalizedSub, personalizedBody);
    if (res.success) {
      setEmailDispatched(prev => ({ ...prev, [s.empId]: 'sent' }));
      if (res.receipt) {
        setReceipts(prev => [res.receipt, ...prev]);
      }
    }
  };

  // Automated Batch Email Dispatch
  const handleStartEmailDispatch = async () => {
    setIsEmailSending(true);
    setEmailProgress(0);
    const updated: Record<string, 'sent' | 'pending' | 'failed'> = { ...emailDispatched };

    for (let i = 0; i < salaries.length; i++) {
      const s = salaries[i];
      const personalizedSub = getPersonalizedSubject(s);
      const personalizedBody = getPersonalizedBody(s);
      
      const res = await sendEmailPayslip(s, settings, personalizedSub, personalizedBody);
      
      await new Promise(r => setTimeout(r, 200));
      updated[s.empId] = 'sent';
      setEmailDispatched({ ...updated });
      setEmailProgress(Math.round(((i + 1) / salaries.length) * 100));
      if (res.receipt) {
        setReceipts(prev => [res.receipt, ...prev]);
      }
    }
    setIsEmailSending(false);
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sentEmailCount = Object.values(emailDispatched).filter(v => v === 'sent').length;
  const sentWaCount = Object.values(waSentMap).filter(Boolean).length;
  const nextQueueEmployee = queueIndex < salaries.length ? salaries[queueIndex] : null;
  const isQueueComplete = sentWaCount === salaries.length || queueIndex >= salaries.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-xs ${
              activeChannel === 'whatsapp' ? 'bg-emerald-600 text-white' : 
              activeChannel === 'email' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              {activeChannel === 'whatsapp' ? <MessageCircle className="w-5 h-5" /> : 
               activeChannel === 'email' ? <Mail className="w-5 h-5" /> : <History className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">Payslip Dispatch & Distribution Engine</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  <span>WhatsApp Express Queue</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official PDF delivery engine • Pay Cycle: <span className="font-bold text-slate-800">{defaultPeriod.combined}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Channel Tabs */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
              <button
                id="tab-dispatch-whatsapp"
                onClick={() => setActiveChannel('whatsapp')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeChannel === 'whatsapp' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Express Queue ({sentWaCount}/{salaries.length})</span>
              </button>
              <button
                id="tab-dispatch-email"
                onClick={() => setActiveChannel('email')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeChannel === 'email' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email PDF ({sentEmailCount}/{salaries.length})</span>
              </button>
              <button
                id="tab-dispatch-receipts"
                onClick={() => setActiveChannel('receipts')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeChannel === 'receipts' 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Receipts ({receipts.length})</span>
              </button>
            </div>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs bg-slate-50/50">
          
          {/* WHATSAPP TAB */}
          {activeChannel === 'whatsapp' && (
            <div className="space-y-5">
              
              {/* WhatsApp Express Queue Active HUD Banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-2xl shadow-sm border border-emerald-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="p-1 bg-emerald-500/30 rounded-lg text-emerald-300">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <h3 className="font-extrabold text-sm text-white">WhatsApp Express Queue (Option 1)</h3>
                    <span className="bg-emerald-500/20 text-emerald-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                      {sentWaCount} of {salaries.length} Dispatched
                    </span>
                  </div>
                  
                  <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
                    {isQueueComplete ? (
                      <span className="text-emerald-300 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All {salaries.length} employee payslips have been dispatched to WhatsApp!</span>
                      </span>
                    ) : nextQueueEmployee ? (
                      <span>
                        Next Up: <strong className="text-white underline">{nextQueueEmployee.profile.name}</strong> ({nextQueueEmployee.profile.empId}) • Mobile: <span className="font-mono text-emerald-300">{normalizePhoneNumber(nextQueueEmployee.profile.mobileNumber || nextQueueEmployee.profile.phone).formatted}</span>
                      </span>
                    ) : (
                      <span>Ready to start sequential WhatsApp dispatch.</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {sentWaCount > 0 && (
                    <button
                      onClick={handleResetQueue}
                      className="px-3 py-2 bg-emerald-950/70 hover:bg-emerald-950 text-emerald-200 border border-emerald-600/50 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center space-x-1"
                      title="Reset Queue pointer to first employee"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}

                  {!isQueueComplete && nextQueueEmployee ? (
                    <button
                      onClick={() => handleExecuteQueueStep()}
                      className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-extrabold rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer text-xs group"
                    >
                      <Play className="w-4 h-4 fill-emerald-950 group-hover:scale-110 transition-transform" />
                      <span>
                        {queueIndex === 0 && !isQueueActive 
                          ? `Start WhatsApp Queue (${salaries.length})` 
                          : `Send & Next: ${nextQueueEmployee.profile.name} (${queueIndex + 1}/${salaries.length})`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 rounded-xl font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Queue Completed ({salaries.length}/{salaries.length})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step-by-Step Guidance Pill */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2.5">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    <strong>How the Express Queue works:</strong> Clicking <strong>"Send & Next"</strong> (1) downloads the employee's verified 1-page PDF payslip and (2) instantly opens their WhatsApp chat with the dynamic message pre-filled. Simply drag the PDF into WhatsApp or tap Enter to send!
                  </span>
                </div>
              </div>

              {/* Roster & Live Message Preview Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Employee List */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
                  <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center space-x-2">
                      <span>Staff WhatsApp Directory</span>
                      <span className="text-[10px] text-slate-500 font-normal">({salaries.length} total)</span>
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">{sentWaCount} / {salaries.length} Dispatched</span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 flex-1">
                    {salaries.map((s, idx) => {
                      const isSent = waSentMap[s.empId];
                      const isNextInQueue = queueIndex === idx;
                      const isSelected = selectedEmpForPreview?.empId === s.empId;
                      const phoneInfo = normalizePhoneNumber(s.profile.mobileNumber || s.profile.phone);
                      const pdfFileName = getPayslipPdfFileName(s);

                      return (
                        <div 
                          key={s.empId} 
                          className={`p-3 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                            isNextInQueue ? 'bg-emerald-50/70 ring-2 ring-emerald-400 z-10' :
                            isSelected ? 'bg-slate-50 ring-1 ring-slate-300' : ''
                          }`}
                          onClick={() => {
                            setSelectedEmpForPreview(s);
                            setQueueIndex(idx);
                          }}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs">{s.profile.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">{s.profile.empId}</span>
                              
                              {isSent ? (
                                <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Sent to WhatsApp</span>
                                </span>
                              ) : isNextInQueue ? (
                                <span className="inline-flex items-center space-x-0.5 text-[10px] font-extrabold text-emerald-950 bg-emerald-300 px-2 py-0.5 rounded-full animate-pulse">
                                  <span>👉 Next in Queue</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                  Pending
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                              <span className={`flex items-center space-x-1 font-mono ${phoneInfo.isValid ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-bold'}`}>
                                <Phone className="w-3 h-3" />
                                <span>{phoneInfo.formatted || 'Missing Mobile Number'}</span>
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">Net: {settings.currencySymbol} {s.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            
                            <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>{pdfFileName}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generatePaySlipPDF(s, settings);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                              title="Download 1-page PDF payslip"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendWhatsAppOne(s, idx);
                              }}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer ${
                                isSent 
                                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title={`Send PDF to ${s.profile.name} via WhatsApp`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{isSent ? 'Resend' : 'Send PDF'}</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live WhatsApp Notice Preview */}
                <div className="lg:col-span-5 bg-[#0b141a] rounded-xl p-4 text-white shadow-2xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <MessageCircle className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-xs text-white">Live WhatsApp Notice</span>
                      </div>
                      {selectedEmpForPreview && (
                        <button
                          onClick={() => handleCopyText(formatWhatsAppPayslipMessage(selectedEmpForPreview, settings), 'wa_text')}
                          className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white bg-white/10 px-2 py-0.5 rounded cursor-pointer"
                        >
                          {copiedKey === 'wa_text' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'wa_text' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-3 bg-[#1f2c34] p-3 rounded-lg border border-slate-700/50 text-[11px] font-mono leading-relaxed text-slate-100 whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {selectedEmpForPreview 
                        ? formatWhatsAppPayslipMessage(selectedEmpForPreview, settings)
                        : 'Select an employee on the left to preview their WhatsApp payslip message.'
                      }
                    </div>
                  </div>

                  {selectedEmpForPreview && (
                    <button
                      onClick={() => handleSendWhatsAppOne(selectedEmpForPreview)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Launch WhatsApp for {selectedEmpForPreview.profile.name}</span>
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* EMAIL TAB */}
          {activeChannel === 'email' && (
            <div className="space-y-5">
              
              {/* Email Explainer Banner */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-blue-950 font-bold text-sm">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>Official PDF Payslip Email Distribution</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Dispatches each employee's verified 1-page PDF payslip document. The email subject line and body automatically update with the <strong>month name</strong>, <strong>YYYY-MM</strong>, and their unique payslip attachment details.
                  </p>
                </div>

                <button
                  disabled={isEmailSending}
                  onClick={handleStartEmailDispatch}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer text-xs whitespace-nowrap"
                >
                  {isEmailSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{isEmailSending ? 'Dispatching...' : `⚡ 1-Click Send All via Email (${salaries.length})`}</span>
                </button>
              </div>

              {/* Email Template Configuration */}
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 block">Email Subject Line (Dynamic with Month & YMD)</label>
                    <span className="text-[10px] text-slate-400 font-mono">Variables: &#123;name&#125;, &#123;empId&#125;, &#123;monthName&#125;, &#123;ymd&#125;</span>
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full font-medium bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="Official Pay Slip - {ymd} ({monthName}) - Company Name"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800 block">Message Body Template (With PDF Attachment Details)</label>
                    <span className="text-[10px] text-slate-400 font-mono">Variables: &#123;name&#125;, &#123;empId&#125;, &#123;netPay&#125;, &#123;pdfFileName&#125;, &#123;monthName&#125;, &#123;ymd&#125;</span>
                  </div>
                  <textarea
                    rows={4}
                    value={emailBodyTemplate}
                    onChange={(e) => setEmailBodyTemplate(e.target.value)}
                    className="w-full font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Progress Bar when dispatching */}
              {isEmailSending && (
                <div className="space-y-1.5 bg-blue-50 border border-blue-200 p-3 rounded-xl">
                  <div className="flex justify-between font-semibold text-blue-900">
                    <span>Dispatching Official Email PDF Pay Slips...</span>
                    <span>{emailProgress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${emailProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Split Roster Table & Live Email Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Recipient Roster */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
                  <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800">
                    <span>Recipient Staff Roster ({salaries.length})</span>
                    <span className="text-[11px] text-blue-700 font-semibold">{sentEmailCount} / {salaries.length} Delivered</span>
                  </div>

                  <div className="border-t border-slate-100 max-h-80 overflow-y-auto divide-y divide-slate-100 flex-1">
                    {salaries.map((s) => {
                      const status = emailDispatched[s.empId] || 'pending';
                      const isSelected = selectedEmpForEmail?.empId === s.empId;
                      const pdfFileName = getPayslipPdfFileName(s);

                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedEmpForEmail(s)}
                          className={`p-3 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                            isSelected ? 'bg-blue-50/50 ring-1 ring-blue-300' : ''
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs">{s.profile.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">{s.profile.empId}</span>
                              {status === 'sent' && (
                                <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Sent / Ready</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                              <span className="font-mono text-slate-600">{s.profile.email}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">{settings.currencySymbol} {s.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="text-[10px] text-blue-600 font-mono flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-blue-500" />
                              <span>{pdfFileName}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generatePaySlipPDF(s, settings);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendEmailOne(s);
                              }}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-2xs transition cursor-pointer"
                              title={`Send email with PDF to ${s.profile.name}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Send Email</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live Email Draft Preview */}
                <div className="lg:col-span-5 bg-slate-900 rounded-xl p-4 text-white shadow-2xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-xs text-white">Live Email Draft Preview</span>
                      </div>
                      {selectedEmpForEmail && (
                        <button
                          onClick={() => handleCopyText(getPersonalizedBody(selectedEmpForEmail), 'email_text')}
                          className="flex items-center space-x-1 text-[11px] text-slate-300 hover:text-white bg-white/10 px-2 py-0.5 rounded cursor-pointer"
                        >
                          {copiedKey === 'email_text' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'email_text' ? 'Copied' : 'Copy Body'}</span>
                        </button>
                      )}
                    </div>

                    {selectedEmpForEmail && (
                      <div className="mt-3 space-y-2.5">
                        <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 text-[11px] space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 font-semibold">To:</span>
                            <span className="font-mono text-white font-bold">{selectedEmpForEmail.profile.email}</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-slate-400 font-semibold">Subject:</span>
                            <span className="text-blue-300 font-medium">{getPersonalizedSubject(selectedEmpForEmail)}</span>
                          </div>
                          <div className="flex items-center space-x-2 pt-1 border-t border-slate-700/60">
                            <span className="text-slate-400 font-semibold">Attachment:</span>
                            <span className="bg-blue-900/60 text-blue-200 border border-blue-700 px-2 py-0.5 rounded text-[10px] font-mono flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-blue-400" />
                              <span>{getPayslipPdfFileName(selectedEmpForEmail)}</span>
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/60 text-[11px] font-mono leading-relaxed text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
                          {getPersonalizedBody(selectedEmpForEmail)}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedEmpForEmail && (
                    <button
                      onClick={() => handleSendEmailOne(selectedEmpForEmail)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Email with PDF to {selectedEmpForEmail.profile.name}</span>
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* RECEIPTS / AUDIT TRAIL TAB */}
          {activeChannel === 'receipts' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Real-Time Payslip Dispatch Audit Receipts</span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    Timestamped audit logs of all PDF payslips dispatched to employees' verified phone numbers & emails.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800">{receipts.length} Recorded Deliveries</span>
                </div>
              </div>

              {receipts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-700 text-sm">No dispatches sent yet in this session</div>
                  <p className="text-xs text-slate-500">
                    Use the <strong>WhatsApp Express Queue</strong> or <strong>Email tabs</strong> to dispatch payslips and view live receipts.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="p-3">Reference ID</th>
                        <th className="p-3">Employee</th>
                        <th className="p-3">Channel & Destination</th>
                        <th className="p-3">PDF Attachment</th>
                        <th className="p-3">Net Disbursed</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {receipts.map((rcpt) => (
                        <tr key={rcpt.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono text-[11px] text-slate-500">{rcpt.referenceId}</td>
                          <td className="p-3 font-bold text-slate-900">{rcpt.employeeName} ({rcpt.empId})</td>
                          <td className="p-3 font-mono text-slate-700">
                            <span className="inline-flex items-center space-x-1.5">
                              {rcpt.channel === 'whatsapp' ? (
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-blue-600" />
                              )}
                              <span>{rcpt.recipient}</span>
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-blue-600 font-mono">{rcpt.pdfFileName}</td>
                          <td className="p-3 font-bold text-emerald-700">{rcpt.netPay}</td>
                          <td className="p-3 text-slate-500">{new Date(rcpt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                          <td className="p-3 text-right">
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Dispatched</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                salaries.forEach((s, idx) => {
                  setTimeout(() => {
                    generatePaySlipPDF(s, settings);
                  }, idx * 150);
                });
              }}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1.5"
              title="Download all employees' PDF payslips to local storage"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Download All ({salaries.length}) PDFs</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>

            {activeChannel === 'whatsapp' && (
              <button
                onClick={() => handleExecuteQueueStep()}
                disabled={isQueueComplete && queueIndex >= salaries.length}
                className="inline-flex items-center space-x-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg shadow-xs transition cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {nextQueueEmployee 
                    ? `Send WhatsApp to ${nextQueueEmployee.profile.name} (${queueIndex + 1}/${salaries.length})`
                    : `All Dispatched (${salaries.length})`}
                </span>
              </button>
            )}

            {activeChannel === 'email' && (
              <button
                disabled={isEmailSending}
                onClick={handleStartEmailDispatch}
                className="inline-flex items-center space-x-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg shadow-xs transition cursor-pointer"
              >
                {isEmailSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isEmailSending ? 'Sending in Progress...' : `⚡ 1-Click Send All via Email (${salaries.length})`}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
