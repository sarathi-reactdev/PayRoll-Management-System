import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Database, 
  Cpu, 
  ShieldCheck, 
  GitMerge, 
  Server, 
  Zap, 
  Code, 
  CheckCircle2, 
  Sparkles,
  Lock,
  Workflow
} from 'lucide-react';

interface ArchitectureDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureDocsModal: React.FC<ArchitectureDocsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'stack' | 'scaling' | 'roadmap'>('architecture');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                System Architecture & Technical Specifications
              </h2>
              <p className="text-xs text-slate-400">
                Enterprise Payroll & Ingestion Engine Blueprint (50 to 10,000+ Scale)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-900/90 flex space-x-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'architecture', label: 'System Architecture', icon: Workflow },
            { id: 'schema', label: 'Database Schema (ERD)', icon: Database },
            { id: 'stack', label: 'Tech Stack & Security', icon: Server },
            { id: 'scaling', label: '10,000+ Scaling Architecture', icon: Zap },
            { id: 'roadmap', label: 'MVP vs Advanced Roadmap', icon: GitMerge },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 border-b-2 flex items-center space-x-1.5 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-400 text-indigo-300 font-bold bg-indigo-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-300 leading-relaxed">
          
          {/* TAB 1: SYSTEM ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">High-Level System Architecture Diagram</h3>
                <p className="text-slate-400">
                  Microservices / Event-Driven Modular Architecture designed for high-concurrency Excel attendance ingestion, isolated calculation workers, and secure document vaults.
                </p>
              </div>

              {/* Architecture Blueprint Visual Flow */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-5 rounded-xl border border-slate-800">
                
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-blue-400">1. Client & Ingestion Layer</div>
                  <h4 className="font-bold text-white">Web UI / Portal</h4>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>React 19 SPA + Tailwind CSS</li>
                    <li>Excel / CSV Streaming Parser</li>
                    <li>Column Mapping Heuristic</li>
                    <li>RBAC & Employee Portal</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">2. Processing & Queue Layer</div>
                  <h4 className="font-bold text-white">API Gateway & BullMQ</h4>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>Node.js / Express Gateway</li>
                    <li>Redis Job Queue Manager</li>
                    <li>Worker Thread Pool (Proration)</li>
                    <li>Attendance Tally Engine</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-purple-400">3. Business Engine Layer</div>
                  <h4 className="font-bold text-white">Payroll & Tax Engine</h4>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>Statutory Rules (PF, ESI, TDS)</li>
                    <li>Overtime & Penalty Evaluator</li>
                    <li>Audit Ledger & Change Tracker</li>
                    <li>Number-to-Words Formatter</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-amber-400">4. Output & Dispatch Vault</div>
                  <h4 className="font-bold text-white">Document & Banking</h4>
                  <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
                    <li>PDF Engine (jsPDF / Puppeteer)</li>
                    <li>Consolidated Excel Exporter</li>
                    <li>ACH / NEFT Bank Advice File</li>
                    <li>SMTP / SendGrid Dispatcher</li>
                  </ul>
                </div>

              </div>

              {/* Data Flow Description */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white">Data Ingestion & Calculation Execution Pipeline</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                  <li><strong>File Upload & Schema Mapping:</strong> Administrator uploads Excel/CSV. The parser tokenizes headers and auto-maps them to canonical fields (`empId`, `daysPresent`, `overtimeHours`).</li>
                  <li><strong>Validation & Anomaly Detection:</strong> Attendance rows are validated against company month days (flagging negative numbers, attendance &gt; total days, extreme overtime).</li>
                  <li><strong>Prorated Calculation:</strong> Base salary is prorated by active days in pay period, computing basic, HRA, statutory PF (12%), ESI, professional tax, and progressive income tax (TDS).</li>
                  <li><strong>Audit Logging & Human Sign-off:</strong> HR reviews calculated payouts, makes line-item adjustments with mandatory justifications logged to an immutable audit trail.</li>
                  <li><strong>Multi-Format Dispatch:</strong> Pay slips rendered to encrypted PDFs, bank transfer ACH batch file exported, and email notices dispatched.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: DATABASE SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Relational Database Schema (PostgreSQL / Cloud SQL)</h3>
                <p className="text-slate-400">
                  Normalized 3NF relational schema supporting multi-tenancy, immutable audit trails, and configurable statutory components.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Table: employees */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                  <div className="font-bold text-indigo-400 mb-2 border-b border-slate-800 pb-1 flex justify-between">
                    <span>TABLE: employees</span>
                    <span className="text-slate-500 font-normal">Core Master</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>id: UUID PRIMARY KEY</div>
                    <div>company_id: UUID FK → companies</div>
                    <div>emp_code: VARCHAR(30) UNIQUE</div>
                    <div>name: VARCHAR(150) NOT NULL</div>
                    <div>email: VARCHAR(150) UNIQUE</div>
                    <div>department_id: UUID FK → departments</div>
                    <div>designation: VARCHAR(100)</div>
                    <div>join_date: DATE NOT NULL</div>
                    <div>structure_type: ENUM (fixed, hourly, contract, piece)</div>
                    <div>base_salary: NUMERIC(12, 2)</div>
                    <div>bank_account_enc: BYTEA (AES-256 Encrypted)</div>
                    <div>tax_id_enc: BYTEA (AES-256 Encrypted)</div>
                    <div>is_active: BOOLEAN DEFAULT true</div>
                  </div>
                </div>

                {/* Table: attendance_records */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                  <div className="font-bold text-emerald-400 mb-2 border-b border-slate-800 pb-1 flex justify-between">
                    <span>TABLE: attendance_records</span>
                    <span className="text-slate-500 font-normal">Monthly Logs</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>id: UUID PRIMARY KEY</div>
                    <div>payroll_run_id: UUID FK → payroll_runs</div>
                    <div>employee_id: UUID FK → employees</div>
                    <div>month_period: VARCHAR(7) -- '2026-08'</div>
                    <div>total_month_days: INT NOT NULL</div>
                    <div>days_present: NUMERIC(4, 1)</div>
                    <div>days_absent: NUMERIC(4, 1)</div>
                    <div>half_days: INT DEFAULT 0</div>
                    <div>paid_leaves: NUMERIC(4, 1)</div>
                    <div>unpaid_leaves: NUMERIC(4, 1)</div>
                    <div>overtime_hours: NUMERIC(5, 2)</div>
                    <div>holidays_worked: INT DEFAULT 0</div>
                    <div>late_marks: INT DEFAULT 0</div>
                  </div>
                </div>

                {/* Table: payroll_runs */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                  <div className="font-bold text-purple-400 mb-2 border-b border-slate-800 pb-1 flex justify-between">
                    <span>TABLE: payroll_runs</span>
                    <span className="text-slate-500 font-normal">Cycle Batch</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>id: UUID PRIMARY KEY</div>
                    <div>company_id: UUID FK → companies</div>
                    <div>period_month: VARCHAR(7) -- '2026-08'</div>
                    <div>total_gross_payout: NUMERIC(14, 2)</div>
                    <div>total_net_payout: NUMERIC(14, 2)</div>
                    <div>total_tax_withheld: NUMERIC(12, 2)</div>
                    <div>status: ENUM (draft, review, approved, disbursed, locked)</div>
                    <div>approved_by: UUID FK → users</div>
                    <div>approved_at: TIMESTAMP</div>
                    <div>created_at: TIMESTAMP DEFAULT NOW()</div>
                  </div>
                </div>

                {/* Table: audit_logs */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px]">
                  <div className="font-bold text-amber-400 mb-2 border-b border-slate-800 pb-1 flex justify-between">
                    <span>TABLE: payroll_audit_logs</span>
                    <span className="text-slate-500 font-normal">Immutable Audit</span>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>id: UUID PRIMARY KEY</div>
                    <div>payroll_run_id: UUID FK → payroll_runs</div>
                    <div>employee_id: UUID FK → employees</div>
                    <div>field_name: VARCHAR(100)</div>
                    <div>previous_value: VARCHAR(255)</div>
                    <div>new_value: VARCHAR(255)</div>
                    <div>reason_justification: TEXT NOT NULL</div>
                    <div>actor_user_id: UUID FK → users</div>
                    <div>timestamp: TIMESTAMP WITH TIME ZONE DEFAULT NOW()</div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: TECH STACK & SECURITY */}
          {activeTab === 'stack' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Recommended Production Technology Stack</h3>
                <p className="text-slate-400">
                  Battle-tested, compliant stack designed for high throughput, encryption at rest and in transit, and SOC2/GDPR compliance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-blue-400">Frontend Tier</div>
                  <ul className="text-slate-300 space-y-1 text-[11px]">
                    <li>• <strong>Framework:</strong> React 19 + TypeScript</li>
                    <li>• <strong>Styling:</strong> Tailwind CSS</li>
                    <li>• <strong>Data Viz:</strong> Recharts</li>
                    <li>• <strong>Client Parser:</strong> SheetJS / xlsx</li>
                    <li>• <strong>Client Export:</strong> jsPDF + AutoTable</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-emerald-400">Backend & APIs</div>
                  <ul className="text-slate-300 space-y-1 text-[11px]">
                    <li>• <strong>Runtime:</strong> Node.js (v22+) / TypeScript</li>
                    <li>• <strong>Framework:</strong> Express.js / Fastify</li>
                    <li>• <strong>Job Queue:</strong> BullMQ + Redis Cluster</li>
                    <li>• <strong>PDF Renderer:</strong> Puppeteer / Gotenberg</li>
                    <li>• <strong>Email Service:</strong> SendGrid / AWS SES</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-purple-400">Database & Security</div>
                  <ul className="text-slate-300 space-y-1 text-[11px]">
                    <li>• <strong>Database:</strong> PostgreSQL / Cloud SQL</li>
                    <li>• <strong>Cache:</strong> Redis Enterprise</li>
                    <li>• <strong>PII Encryption:</strong> AES-256 GCM Envelope</li>
                    <li>• <strong>Auth:</strong> JWT + OAuth2 + MFA</li>
                    <li>• <strong>Audit Ledger:</strong> Append-Only Storage</li>
                  </ul>
                </div>

              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-amber-400 flex items-center space-x-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Security & PII Data Protection Standards</span>
                </h4>
                <p className="text-slate-300 text-[11px]">
                  <strong>1. Zero-Knowledge Bank Account Encryption:</strong> Employee bank accounts, SSNs, and tax numbers are encrypted using customer-managed encryption keys (CMEK) via AWS KMS or GCP Cloud KMS before persisting in the database.
                </p>
                <p className="text-slate-300 text-[11px]">
                  <strong>2. Role-Based Access Control (RBAC):</strong> Strict role segregation ensures department heads only see aggregated attendance; HR managers can view and adjust salaries; Super Admins hold final sign-off; and Employees only access their own pay slip archive.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: 10,000+ SCALING */}
          {activeTab === 'scaling' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Architecture for Scaling from 50 to 10,000+ Employees</h3>
                <p className="text-slate-400">
                  Techniques for processing massive rosters without memory spikes or database contention.
                </p>
              </div>

              <div className="space-y-4">
                
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-emerald-400">1. Chunked Streaming Excel Parser (O(1) Memory Footprint)</h4>
                  <p className="text-slate-300 text-[11px]">
                    Instead of loading multi-megabyte Excel files with 10,000+ rows into Node.js V8 heap, use streaming parsers (e.g. `exceljs` read stream or `fast-csv`) that emit chunks of 500 rows. Memory consumption remains strictly constant (&lt;50MB) regardless of file size.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-blue-400">2. Parallel Worker Calculation Engine (BullMQ + Redis)</h4>
                  <p className="text-slate-300 text-[11px]">
                    Attendance rows are partitioned into sub-batches of 250 employees and dispatched to parallel worker nodes. 10,000 salaries can be calculated and validated across 8 worker processes in under 3.5 seconds.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-purple-400">3. Asynchronous PDF Generation & S3 Direct Upload</h4>
                  <p className="text-slate-300 text-[11px]">
                    Pay slip PDFs are generated asynchronously by dedicated headless Chromium instances (Gotenberg cluster) and streamed directly to S3 / Cloud Storage buckets with pre-signed temporary download URLs.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <h4 className="font-bold text-amber-400">4. Database Connection Pooling & Read Replicas</h4>
                  <p className="text-slate-300 text-[11px]">
                    Using PgBouncer connection pooling and routing employee read queries to read replicas prevents database locking while payroll calculation writes batch updates.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: ROADMAP */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Step-by-Step Implementation Roadmap</h3>
                <p className="text-slate-400">
                  Phased delivery plan from MVP core calculation to advanced enterprise integrations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Phase 1: MVP (Complete in App) */}
                <div className="p-5 rounded-xl bg-slate-950 border-2 border-emerald-500/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase tracking-wider">
                      Phase 1 (MVP - Fully Built & Live)
                    </span>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Core Payroll & Pay Slip Engine</h4>
                  <ul className="text-[11px] text-slate-300 space-y-2">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Excel Attendance Ingestion:</strong> Drag-and-drop parsing of .xlsx/.csv with heuristic auto-mapping.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Proration & Calculation:</strong> Prorated basic pay, overtime rates (1.5x/2.0x), LOP deductions, late penalties.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Statutory Engine:</strong> PF (12%), ESI, Professional Tax, and Progressive Income Tax (TDS).</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>High-Fidelity PDF Pay Slips:</strong> Executive formatted single & batch PDF pay slips with currency in words.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Audit Ledger:</strong> Mandatory change reason logging for all manual salary overrides.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Banking & Summary Export:</strong> ACH/NEFT bank advice file and consolidated payroll register.</span>
                    </li>
                  </ul>
                </div>

                {/* Phase 2: Advanced Future Releases */}
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase tracking-wider">
                      Phase 2 (Enterprise V2 Release)
                    </span>
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Automated Ecosystem Integrations</h4>
                  <ul className="text-[11px] text-slate-300 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <span><strong>Biometric & Time-Clock API Sync:</strong> Real-time webhook ingestion from ZKTeco, Kronos, and BambooHR.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <span><strong>Direct NACHA / Swift Banking API:</strong> Direct host-to-host bank API disbursement integration.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <span><strong>Multi-Jurisdiction Tax Engine:</strong> Automatic US 50-state tax withholding and Indian Old vs New Tax regime evaluator.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <span><strong>AI Anomaly Detector:</strong> Automated flagger for suspicious overtime surges or ghost employee patterns.</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise Architecture Document • PayMaster Pro Engineering</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
          >
            Close Documentation
          </button>
        </div>

      </div>
    </div>
  );
};
