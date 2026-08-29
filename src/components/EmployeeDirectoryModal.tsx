import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  Cake, 
  Calendar, 
  Building2, 
  Eye, 
  Users, 
  CheckCircle2,
  DollarSign,
  Download,
  Landmark,
  Banknote,
  Smartphone,
  FileText,
  History
} from 'lucide-react';
import { EmployeeProfile, CompanySettings, UserRole } from '../types/payroll';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface EmployeeDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeProfile[];
  settings: CompanySettings;
  currentRole: UserRole;
  onEditEmployee: (employee: EmployeeProfile) => void;
  onDeleteEmployee: (empId: string, name: string) => void;
  onOpenAddEmployee: () => void;
  onViewPaySlipForEmployee?: (empId: string) => void;
  onOpenHistoricalPayslips?: (empId?: string) => void;
}

const DEPARTMENTS = [
  'ALL',
  'XML',
  'ePub',
  'PPT',
  'Word',
];

export const EmployeeDirectoryModal: React.FC<EmployeeDirectoryModalProps> = ({
  isOpen,
  onClose,
  employees,
  settings,
  currentRole,
  onEditEmployee,
  onDeleteEmployee,
  onOpenAddEmployee,
  onViewPaySlipForEmployee,
  onOpenHistoricalPayslips,
}) => {
  const sym = settings.currencySymbol || '$';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [deleteTarget, setDeleteTarget] = useState<{ empId: string; name: string } | null>(null);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.mobileNumber && emp.mobileNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;

    return matchesSearch && matchesDept;
  });

  const getDeptColor = (dept: string) => {
    switch (dept) {
      case 'XML':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ePub':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PPT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Word':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getPaymentModeBadge = (mode?: string) => {
    switch (mode) {
      case 'cash':
        return <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><Banknote className="w-3 h-3" /><span>Cash</span></span>;
      case 'upi':
        return <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full"><Smartphone className="w-3 h-3" /><span>UPI</span></span>;
      case 'cheque':
        return <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><FileText className="w-3 h-3" /><span>Cheque</span></span>;
      default:
        return <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full"><Landmark className="w-3 h-3" /><span>Bank</span></span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Employee Directory & Management
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {employees.length} Employees
                </span>
              </div>
              <p className="text-xs text-slate-500">
                View, search, edit employee profiles, mobile numbers, emails, DOB, and salary structures
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenHistoricalPayslips && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistoricalPayslips();
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs shadow-2xs transition cursor-pointer"
                title="View and manage historical past payslip records"
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span>Past Payslips Archive</span>
              </button>
            )}

            {currentRole !== 'employee' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddEmployee();
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Employee</span>
              </button>
            )}

            <button 
              type="button"
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Name, Emp ID, Mobile, Email, Designation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Department Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 font-semibold uppercase text-[10px] mr-1">Department:</span>
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                type="button"
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedDept === dept
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept === 'ALL' ? 'All Departments' : dept}
              </button>
            ))}
          </div>

        </div>

        {/* Table Container */}
        <div className="overflow-x-auto flex-1 p-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10.5px] tracking-wider border-b border-slate-200 sticky top-0 z-10 shadow-2xs">
              <tr>
                <th className="p-3.5 min-w-[100px]">Emp ID</th>
                <th className="p-3.5 min-w-[180px]">Name</th>
                <th className="p-3.5 min-w-[120px]">Department</th>
                <th className="p-3.5 min-w-[150px]">Designation</th>
                <th className="p-3.5 min-w-[140px]">Mobile Number</th>
                <th className="p-3.5 min-w-[160px]">Email Address</th>
                <th className="p-3.5 min-w-[120px] text-right">Base Salary</th>
                <th className="p-3.5 min-w-[120px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No employees found matching your criteria</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword or department filter.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition">
                    
                    {/* Emp ID */}
                    <td className="p-3.5 font-mono font-bold text-slate-800 text-xs">
                      {emp.empId}
                      {emp.isProbation && (
                        <div className="text-[10px] text-amber-600 font-semibold font-sans">Probation</div>
                      )}
                    </td>

                    {/* Name */}
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 shrink-0 text-xs overflow-hidden">
                          {emp.avatarUrl ? (
                            <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            emp.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {emp.name}
                          </div>
                          {emp.dob && (
                            <div className="text-[10.5px] text-slate-400 flex items-center space-x-1">
                              <Cake className="w-3 h-3 text-rose-400 shrink-0" />
                              <span>DOB: {emp.dob}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="p-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs border ${getDeptColor(emp.department)}`}>
                        {emp.department}
                      </span>
                    </td>

                    {/* Designation */}
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{emp.designation}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{emp.structureType} structure</div>
                    </td>

                    {/* Mobile Number */}
                    <td className="p-3.5">
                      {emp.mobileNumber ? (
                        <div className="flex items-center space-x-1.5 text-slate-800 font-medium text-xs">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <a href={`tel:${emp.mobileNumber}`} className="hover:text-blue-600 transition">
                            {emp.mobileNumber}
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not provided</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="p-3.5">
                      {emp.email ? (
                        <div className="flex items-center space-x-1.5 text-slate-700 text-xs">
                          <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <a href={`mailto:${emp.email}`} className="hover:text-blue-600 truncate max-w-[150px] transition" title={emp.email}>
                            {emp.email}
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">—</span>
                      )}
                    </td>

                    {/* Base Salary */}
                    <td className="p-3.5 text-right">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {sym} {(emp.baseSalary ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      {emp.structureType === 'hourly' && (
                        <div className="text-[10px] text-purple-600 font-semibold">
                          {sym} {emp.hourlyRate}/hr
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {onOpenHistoricalPayslips && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenHistoricalPayslips(emp.empId);
                            }}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title={`View Past Payslips History for ${emp.name}`}
                          >
                            <History className="w-4 h-4" />
                          </button>
                        )}

                        {currentRole !== 'employee' && (
                          <button
                            type="button"
                            onClick={() => onEditEmployee(emp)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title={`Edit ${emp.name}'s Profile & Salary`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {onViewPaySlipForEmployee && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewPaySlipForEmployee(emp.empId);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title={`View ${emp.name}'s Payslip`}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        {currentRole !== 'employee' && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ empId: emp.empId, name: emp.name })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title={`Delete ${emp.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Directory Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing {filteredEmployees.length} of {employees.length} registered employees
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 font-semibold text-slate-700 cursor-pointer shadow-2xs"
            >
              Close Directory
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) {
              onDeleteEmployee(deleteTarget.empId, deleteTarget.name);
            }
          }}
          title="Remove Employee Profile"
          message={`Are you sure you want to permanently remove ${deleteTarget?.name} (${deleteTarget?.empId}) from the company employee roster?`}
          confirmLabel="Remove Employee"
          isDangerous={true}
        />

      </div>
    </div>
  );
};
