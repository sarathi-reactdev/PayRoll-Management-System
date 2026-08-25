import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  RefreshCw,
  Download
} from 'lucide-react';
import { AttendanceRecord, ColumnMapping } from '../types/payroll';
import { 
  parseAttendanceExcel, 
  mapRowsToAttendance, 
  DEFAULT_COLUMN_KEYWORDS, 
  downloadSampleAttendanceTemplate 
} from '../utils/excelParser';
import { INITIAL_ATTENDANCE } from '../utils/sampleData';

interface DataIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAttendance: (records: AttendanceRecord[]) => void;
  totalMonthDays: number;
}

export const DataIngestionModal: React.FC<DataIngestionModalProps> = ({
  isOpen,
  onClose,
  onApplyAttendance,
  totalMonthDays,
}) => {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    empId: '',
    name: '',
    department: '',
    daysPresent: '',
    daysAbsent: '',
    halfDays: '',
    overtimeHours: '',
    paidLeaves: '',
    unpaidLeaves: '',
    holidaysWorked: '',
    lateArrivals: '',
  });
  const [parsedRecords, setParsedRecords] = useState<AttendanceRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; empId?: string; field: string; message: string; severity: 'error' | 'warning' }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setFileName(file.name);
      const result = await parseAttendanceExcel(file);
      setHeaders(result.headers);
      setRawRows(result.rawRows);
      setMapping(result.detectedMapping);
      setParsedRecords(result.records);
      setValidationErrors(result.validationErrors);
      setStep('mapping');
    } catch (err: any) {
      alert(`Error reading file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSampleDataset = () => {
    setFileName('August_2026_Attendance_Master.xlsx');
    setParsedRecords(INITIAL_ATTENDANCE);
    setValidationErrors([]);
    onApplyAttendance(INITIAL_ATTENDANCE);
    onClose();
  };

  const handleMappingChange = (field: keyof ColumnMapping, header: string) => {
    const updatedMapping = { ...mapping, [field]: header };
    setMapping(updatedMapping);
    const { records, validationErrors: errors } = mapRowsToAttendance(rawRows, updatedMapping, totalMonthDays);
    setParsedRecords(records);
    setValidationErrors(errors);
  };

  const handleProceedToPreview = () => {
    if (!mapping.empId) {
      alert('Please map the Employee ID column before proceeding.');
      return;
    }
    const { records, validationErrors: errors } = mapRowsToAttendance(rawRows, mapping, totalMonthDays);
    setParsedRecords(records);
    setValidationErrors(errors);
    setStep('preview');
  };

  const handleCommit = () => {
    onApplyAttendance(parsedRecords);
    onClose();
  };

  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Attendance Data Ingestion Module</h2>
              <p className="text-xs text-slate-500">Excel / CSV parser with automated column schema mapping</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center space-x-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>1</span>
            <span className={step === 'upload' ? 'text-blue-600' : ''}>Upload File</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className="flex items-center space-x-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'mapping' ? 'bg-blue-600 text-white' : step === 'preview' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>2</span>
            <span className={step === 'mapping' ? 'text-blue-600' : ''}>Map Columns</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <div className="flex items-center space-x-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</span>
            <span className={step === 'preview' ? 'text-blue-600' : ''}>Validate & Process</span>
          </div>
        </div>

        {/* Body Content by Step */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                  dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {isProcessing ? 'Parsing Excel File...' : 'Drop your Attendance Excel or CSV here'}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Supports .xlsx, .xls, and .csv formats. The system will auto-detect headers for Employee ID, Present Days, Absent, OT, etc.
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs">
                    Browse Files
                  </span>
                </div>
              </div>

              {/* Sample Helpers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Standard Excel Template</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Download a pre-formatted Excel template with sample formulas and column descriptions.
                    </p>
                    <button
                      onClick={downloadSampleAttendanceTemplate}
                      className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Download Template (.xlsx)
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Load Demo Attendance Dataset</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Instantly populate August 2026 attendance with diverse employee cases (overtime, LOP, mid-month join).
                    </p>
                    <button
                      onClick={handleLoadSampleDataset}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Load Sample Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    File: <strong className="font-semibold">{fileName}</strong> ({rawRows.length} rows detected). We've auto-mapped columns based on headers. Adjust if needed:
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                {/* Mandatory Field */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Employee ID <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">Internal Key</span>
                  </label>
                  <select
                    value={mapping.empId}
                    onChange={(e) => handleMappingChange('empId', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Employee Name</span>
                    <span className="text-[10px] text-slate-400 font-normal">Display name</span>
                  </label>
                  <select
                    value={mapping.name}
                    onChange={(e) => handleMappingChange('name', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Department / Division</span>
                    <span className="text-[10px] text-slate-400 font-normal">Cost Center</span>
                  </label>
                  <select
                    value={mapping.department}
                    onChange={(e) => handleMappingChange('department', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Days Present */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Days Present</span>
                    <span className="text-[10px] text-slate-400 font-normal">Payable day count</span>
                  </label>
                  <select
                    value={mapping.daysPresent}
                    onChange={(e) => handleMappingChange('daysPresent', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Days Absent */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Days Absent</span>
                    <span className="text-[10px] text-slate-400 font-normal">Absence count</span>
                  </label>
                  <select
                    value={mapping.daysAbsent}
                    onChange={(e) => handleMappingChange('daysAbsent', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Half Days */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Half Days (0.5x)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Partial days</span>
                  </label>
                  <select
                    value={mapping.halfDays}
                    onChange={(e) => handleMappingChange('halfDays', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Overtime Hours */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Overtime Hours</span>
                    <span className="text-[10px] text-slate-400 font-normal">Regular 1.5x</span>
                  </label>
                  <select
                    value={mapping.overtimeHours}
                    onChange={(e) => handleMappingChange('overtimeHours', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Paid Leaves */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Paid Leaves (CL/SL/EL)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Approved leaves</span>
                  </label>
                  <select
                    value={mapping.paidLeaves}
                    onChange={(e) => handleMappingChange('paidLeaves', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Unpaid Leaves */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Unpaid Leaves (Loss of Pay)</span>
                    <span className="text-[10px] text-slate-400 font-normal">LOP deduction</span>
                  </label>
                  <select
                    value={mapping.unpaidLeaves}
                    onChange={(e) => handleMappingChange('unpaidLeaves', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Late Arrivals */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Late Arrivals / Marks</span>
                    <span className="text-[10px] text-slate-400 font-normal">Penalty threshold</span>
                  </label>
                  <select
                    value={mapping.lateArrivals}
                    onChange={(e) => handleMappingChange('lateArrivals', e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Excel Header --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Base Salary (Optional) */}
                <div className="space-y-1.5 p-3 rounded-lg bg-white border border-slate-200">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Basic / Base Salary</span>
                    <span className="text-[10px] text-slate-400 font-normal">Optional auto-set</span>
                  </label>
                  <select
                    value={mapping.baseSalary || ''}
                    onChange={(e) => handleMappingChange('baseSalary' as any, e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Auto-detect / Keep Profile Base --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Validation Summary Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-semibold text-slate-800">
                    Validation Outcome: {parsedRecords.length} records ready
                  </span>
                  {errorCount > 0 ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errorCount} Errors</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>0 Fatal Errors</span>
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{warningCount} Warnings</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Warning Log if any */}
              {validationErrors.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1.5 p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>
                        Row {err.row} ({err.empId || 'Unknown'}): <strong>{err.field}</strong> — {err.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-64">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200">Emp ID</th>
                      <th className="p-2.5 border-b border-slate-200">Name</th>
                      <th className="p-2.5 border-b border-slate-200">Basic Salary</th>
                      <th className="p-2.5 border-b border-slate-200">Present</th>
                      <th className="p-2.5 border-b border-slate-200">Paid Leave</th>
                      <th className="p-2.5 border-b border-slate-200">Half Days</th>
                      <th className="p-2.5 border-b border-slate-200">LOP</th>
                      <th className="p-2.5 border-b border-slate-200">OT Hrs</th>
                      <th className="p-2.5 border-b border-slate-200">Lates</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {parsedRecords.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-medium text-blue-600">{r.empId}</td>
                        <td className="p-2.5 text-slate-800">{r.employeeName || '—'}</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">{r.baseSalary ? `$${r.baseSalary.toLocaleString()}` : 'Default'}</td>
                        <td className="p-2.5 text-slate-700 font-semibold">{r.daysPresent}</td>
                        <td className="p-2.5 text-slate-600">{r.paidLeaves}</td>
                        <td className="p-2.5 text-slate-600">{r.halfDays}</td>
                        <td className="p-2.5 text-rose-600 font-medium">{r.unpaidLeaves}</td>
                        <td className="p-2.5 text-purple-600 font-semibold">{r.overtimeHours}h</td>
                        <td className="p-2.5 text-amber-600">{r.lateArrivalsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step === 'upload' ? (
            <div></div>
          ) : (
            <button
              onClick={() => setStep(step === 'preview' ? 'mapping' : 'upload')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition"
            >
              Back
            </button>
          )}

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            {step === 'mapping' && (
              <button
                onClick={handleProceedToPreview}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-xs transition"
              >
                <span>Preview Parsed Data</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'preview' && (
              <button
                onClick={handleCommit}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-xs transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Process & Recalculate Payroll</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
