import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Settings, 
  BookOpen, 
  UserCheck, 
  Calendar
} from 'lucide-react';
import { UserRole, CompanySettings } from '../types/payroll';

interface NavbarProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  companySettings: CompanySettings;
  onOpenSettings: () => void;
  onOpenArchitecture: () => void;
  onOpenUpload: () => void;
  onOpenAuditTrail: () => void;
  employeeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setCurrentRole,
  selectedMonth,
  setSelectedMonth,
  companySettings,
  onOpenSettings,
  onOpenArchitecture,
  onOpenUpload,
  onOpenAuditTrail,
  employeeCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            {companySettings.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt="Logo"
                className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5 shadow-2xs"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs shadow-blue-200">
                {(companySettings.appTitle || 'P').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  {companySettings.appTitle || 'PayMaster Pro'}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                  {companySettings.brandSubTitle || 'Enterprise'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                {companySettings.name}
              </p>
            </div>
          </div>

          {/* Center Navigation: Month & Template */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-400">Pay Cycle:</span>
              <input
                type="month"
                id="pay-period-input"
                value={selectedMonth}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                  }
                }}
                className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer text-xs"
                title="Select any custom month and year for pay cycle"
              />
            </div>
          </div>

          {/* Right Controls: Role Switcher & Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Role Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              <select
                id="user-role-select"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="super_admin" className="bg-white text-slate-900">Super Admin</option>
                <option value="employee" className="bg-white text-slate-900">Employee Self-Service</option>
              </select>
            </div>

            {/* Settings Trigger */}
            {currentRole !== 'employee' && (
              <button
                id="btn-company-settings"
                onClick={onOpenSettings}
                className="p-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 transition shadow-2xs cursor-pointer"
                title="Payroll & Company Configuration"
              >
                <Settings className="w-4 h-4 text-slate-500 hover:text-slate-800" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
