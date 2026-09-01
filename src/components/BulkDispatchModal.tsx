import React, { useState, useEffect } from 'react';
import { 
  X, 
  MessageCircle, 
  CheckCircle2, 
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
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'receipts'>('whatsapp');
  
  // Dynamic Period Calculation
  const firstSalary = salaries[0];
  const defaultPeriod = firstSalary ? getFormattedPeriod(firstSalary) : { ymd: '2026-08', monthName: 'August 2026', combined: '2026-08 (August 2026)' };
  
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
      setWaSentMap({});
      setQueueIndex(0);
      setIsQueueActive(false);
      setSelectedEmpForPreview(salaries[0]);
    }
  }, [isOpen, salaries, settings]);

  if (!isOpen) return null;

  // 🚀 WhatsApp Express Queue Stepper Action
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

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sentWaCount = Object.values(waSentMap).filter(Boolean).length;
  const nextQueueEmployee = queueIndex < salaries.length ? salaries[queueIndex] : null;
  const isQueueComplete = sentWaCount === salaries.length || queueIndex >= salaries.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-emerald-600 text-white shadow-sm shadow-emerald-200">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">WhatsApp Payslip Dispatch Engine</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                  <span>Express Queue</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official PDF & Verified Notice Delivery • Pay Cycle: <span className="font-semibold text-slate-800">{defaultPeriod.combined}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Channel Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
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
                <span>WhatsApp Queue ({sentWaCount}/{salaries.length})</span>
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
                <span>Audit Receipts ({receipts.length})</span>
              </button>
            </div>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer hover:bg-slate-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs bg-slate-50/70">
          
          {/* WHATSAPP TAB */}
          {activeChannel === 'whatsapp' && (
            <div className="space-y-5">
              
              {/* WhatsApp Express Queue Active HUD Banner - Light, Crisp, Vibrant Theme */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-100/70 border border-emerald-200 text-slate-900 rounded-2xl shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-bold text-sm text-emerald-950">WhatsApp Express Queue</h3>
                    <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                      {sentWaCount} of {salaries.length} Dispatched
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    {isQueueComplete ? (
                      <span className="text-emerald-700 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>All {salaries.length} employee payslips have been dispatched to WhatsApp!</span>
                      </span>
                    ) : nextQueueEmployee ? (
                      <span>
                        Next in line: <strong className="text-slate-900 font-bold">{nextQueueEmployee.profile.name}</strong> ({nextQueueEmployee.profile.empId}) • Mobile: <span className="font-mono font-semibold text-emerald-700">{normalizePhoneNumber(nextQueueEmployee.profile.mobileNumber || nextQueueEmployee.profile.phone).formatted}</span>
                      </span>
                    ) : (
                      <span>Ready to start sequential WhatsApp payslip dispatch.</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {sentWaCount > 0 && (
                    <button
                      onClick={handleResetQueue}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold text-xs transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                      title="Reset Queue pointer to first employee"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Reset</span>
                    </button>
                  )}

                  {!isQueueComplete && nextQueueEmployee ? (
                    <button
                      onClick={() => handleExecuteQueueStep()}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center space-x-2 cursor-pointer text-xs group"
                    >
                      <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                      <span>
                        {queueIndex === 0 && !isQueueActive 
                          ? `Start WhatsApp Queue (${salaries.length})` 
                          : `Send & Next: ${nextQueueEmployee.profile.name} (${queueIndex + 1}/${salaries.length})`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Queue Completed ({salaries.length}/{salaries.length})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step-by-Step Guidance Banner */}
              <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs text-slate-700 flex items-center justify-between shadow-2xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    <Info className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    <strong>How WhatsApp PDF Dispatch works:</strong> Clicking <strong>"Send & Next"</strong> (1) downloads the employee's official 1-page PDF payslip and (2) opens their WhatsApp chat with the dynamic payslip summary. Simply drag or attach the downloaded PDF into WhatsApp!
                  </span>
                </div>
              </div>

              {/* Roster & Live Message Preview Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Employee Roster (Left Column) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between font-bold text-slate-800">
                    <span className="flex items-center space-x-2">
                      <span>Staff WhatsApp Directory</span>
                      <span className="text-[11px] text-slate-500 font-normal">({salaries.length} total)</span>
                    </span>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      {sentWaCount} / {salaries.length} Sent
                    </span>
                  </div>

                  <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 flex-1">
                    {salaries.map((s, idx) => {
                      const isSent = waSentMap[s.empId];
                      const isNextInQueue = queueIndex === idx;
                      const isSelected = selectedEmpForPreview?.empId === s.empId;
                      const phoneInfo = normalizePhoneNumber(s.profile.mobileNumber || s.profile.phone);
                      const pdfFileName = getPayslipPdfFileName(s);

                      return (
                        <div 
                          key={s.empId} 
                          className={`p-3 flex items-center justify-between hover:bg-slate-50/80 transition cursor-pointer ${
                            isNextInQueue ? 'bg-emerald-50/80 ring-2 ring-emerald-400 z-10' :
                            isSelected ? 'bg-slate-50 ring-1 ring-slate-300' : ''
                          }`}
                          onClick={() => {
                            setSelectedEmpForPreview(s);
                            setQueueIndex(idx);
                          }}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-900 text-xs">{s.profile.name}</span>
                              <span className="font-mono text-[10px] text-slate-400">{s.profile.empId}</span>
                              
                              {isSent ? (
                                <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Sent to WhatsApp</span>
                                </span>
                              ) : isNextInQueue ? (
                                <span className="inline-flex items-center space-x-0.5 text-[10px] font-extrabold text-white bg-emerald-600 px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                                  <span>👉 Next in Queue</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
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
                            
                            <div className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span className="truncate max-w-[260px]">{pdfFileName}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                generatePaySlipPDF(s, settings);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer border border-slate-200"
                              title="Download 1-page PDF payslip"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendWhatsAppOne(s, idx);
                              }}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer ${
                                isSent 
                                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300' 
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                              title={`Send PDF to ${s.profile.name} via WhatsApp`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>{isSent ? 'Resend' : 'Send WhatsApp'}</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Live WhatsApp Notice Preview (Right Column) - Clean, Bright, Beautiful */}
                <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-slate-800">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">Live WhatsApp Message Preview</span>
                          <span className="text-[10px] text-slate-500">Auto-generated with official PDF attachment reference</span>
                        </div>
                      </div>
                      {selectedEmpForPreview && (
                        <button
                          onClick={() => handleCopyText(formatWhatsAppPayslipMessage(selectedEmpForPreview, settings), 'wa_text')}
                          className="flex items-center space-x-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md cursor-pointer transition shadow-2xs"
                        >
                          {copiedKey === 'wa_text' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'wa_text' ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    {selectedEmpForPreview && (
                      <div className="mt-3 space-y-2">
                        {/* Employee Target Tag */}
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]">
                          <span className="font-bold text-slate-800">{selectedEmpForPreview.profile.name}</span>
                          <span className="font-mono text-emerald-700 font-semibold">
                            {normalizePhoneNumber(selectedEmpForPreview.profile.mobileNumber || selectedEmpForPreview.profile.phone).formatted}
                          </span>
                        </div>

                        {/* WhatsApp Message Bubble Styled Preview */}
                        <div className="bg-[#E7F8E8] border border-emerald-200 rounded-xl p-3.5 text-[11px] font-mono leading-relaxed text-slate-800 whitespace-pre-wrap max-h-64 overflow-y-auto shadow-2xs">
                          {formatWhatsAppPayslipMessage(selectedEmpForPreview, settings)}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedEmpForPreview && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleSendWhatsAppOne(selectedEmpForPreview)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Launch WhatsApp for {selectedEmpForPreview.profile.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </button>
                    </div>
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
                    <span>Real-Time WhatsApp Payslip Dispatch Audit Receipts</span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    Timestamped audit logs of all PDF payslips dispatched to employees' verified phone numbers.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">{receipts.length} Recorded Deliveries</span>
                </div>
              </div>

              {receipts.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-2">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="font-bold text-slate-700 text-sm">No dispatches sent yet in this session</div>
                  <p className="text-xs text-slate-500">
                    Use the <strong>WhatsApp Express Queue</strong> to dispatch payslips and record live receipts.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-3">Reference ID</th>
                        <th className="p-3">Employee</th>
                        <th className="p-3">Recipient Mobile</th>
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
                          <td className="p-3 font-mono text-emerald-700 font-semibold">
                            <span className="inline-flex items-center space-x-1.5">
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
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
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                salaries.forEach((s, idx) => {
                  setTimeout(() => {
                    generatePaySlipPDF(s, settings);
                  }, idx * 150);
                });
              }}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition cursor-pointer flex items-center space-x-1.5 shadow-2xs"
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
                    ? `Send WhatsApp: ${nextQueueEmployee.profile.name} (${queueIndex + 1}/${salaries.length})`
                    : `All Dispatched (${salaries.length})`}
                </span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
