import * as XLSX from 'xlsx';
import { AttendanceRecord, ColumnMapping } from '../types/payroll';

export interface ParseResult {
  headers: string[];
  rawRows: Record<string, any>[];
  detectedMapping: ColumnMapping;
  records: AttendanceRecord[];
  validationErrors: { row: number; empId?: string; field: string; message: string; severity: 'error' | 'warning' }[];
}

export const DEFAULT_COLUMN_KEYWORDS: Record<keyof ColumnMapping, string[]> = {
  empId: ['empid', 'emp_id', 'employeeid', 'employee_id', 'staff_id', 'id', 'empcode', 'emp_code', 'code'],
  name: ['name', 'employeename', 'employee_name', 'staff_name', 'fullname', 'full_name'],
  department: ['department', 'dept', 'division', 'team', 'business_unit', 'unit'],
  daysPresent: ['present', 'dayspresent', 'days_present', 'present_days', 'attended_days', 'working_days_present', 'actual_present'],
  daysAbsent: ['absent', 'daysabsent', 'days_absent', 'absent_days', 'absences'],
  halfDays: ['halfday', 'halfdays', 'half_days', 'half_day', 'hd', 'half_day_count'],
  overtimeHours: ['overtime', 'ot', 'othours', 'ot_hours', 'overtime_hours', 'ot_hrs', 'extra_hours'],
  paidLeaves: ['paidleave', 'paidleaves', 'paid_leaves', 'paid_leave', 'cl', 'sl', 'el', 'leaves_taken', 'approved_leaves'],
  unpaidLeaves: ['unpaidleave', 'unpaidleaves', 'unpaid_leaves', 'unpaid_leave', 'lop', 'loss_of_pay', 'lwp'],
  holidaysWorked: ['holidaysworked', 'holidays_worked', 'holiday_work', 'ph_worked', 'holiday_days_worked'],
  lateArrivals: ['late', 'latearrivals', 'late_arrivals', 'latemarks', 'late_marks', 'lates', 'late_count'],
  baseSalary: ['salary', 'basesalary', 'basic_salary', 'basic', 'base_salary', 'monthly_salary', 'ctc', 'gross_salary'],
};

/**
 * Automatically detects the closest matching header for each internal field
 */
export function autoDetectMapping(headers: string[]): ColumnMapping {
  const normalizedHeaders = headers.map(h => ({
    original: h,
    clean: String(h).toLowerCase().replace(/[^a-z0-9]/g, ''),
  }));

  const mapping: ColumnMapping = {
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
    baseSalary: '',
  };

  (Object.keys(DEFAULT_COLUMN_KEYWORDS) as (keyof ColumnMapping)[]).forEach(fieldKey => {
    const keywords = DEFAULT_COLUMN_KEYWORDS[fieldKey];
    for (const kw of keywords) {
      const cleanKw = kw.replace(/[^a-z0-9]/g, '');
      const match = normalizedHeaders.find(h => h.clean === cleanKw || h.clean.includes(cleanKw));
      if (match) {
        mapping[fieldKey] = match.original;
        break;
      }
    }
  });

  return mapping;
}

/**
 * Parses raw Excel / CSV file buffer or ArrayBuffer
 */
export async function parseAttendanceExcel(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Parse as JSON with headers
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('The uploaded file is empty. Please upload an Excel sheet containing attendance data.');
  }

  // Extract all unique headers across rows
  const headerSet = new Set<string>();
  rawRows.forEach(row => {
    Object.keys(row).forEach(k => headerSet.add(k));
  });
  const headers = Array.from(headerSet);

  const detectedMapping = autoDetectMapping(headers);
  const { records, validationErrors } = mapRowsToAttendance(rawRows, detectedMapping);

  return {
    headers,
    rawRows,
    detectedMapping,
    records,
    validationErrors,
  };
}

/**
 * Maps raw excel rows according to column mapping and runs validation rules
 */
export function mapRowsToAttendance(
  rawRows: Record<string, any>[],
  mapping: ColumnMapping,
  totalMonthDays = 30
): { records: AttendanceRecord[]; validationErrors: ParseResult['validationErrors'] } {
  const records: AttendanceRecord[] = [];
  const validationErrors: ParseResult['validationErrors'] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexed Excel row after header
    const rawEmpId = mapping.empId ? String(row[mapping.empId] || '').trim() : '';
    const rawName = mapping.name ? String(row[mapping.name] || '').trim() : '';
    const rawDept = mapping.department ? String(row[mapping.department] || '').trim() : '';

    if (!rawEmpId) {
      validationErrors.push({
        row: rowNum,
        field: 'Employee ID',
        message: 'Missing Employee ID in row. Row skipped or requires mapping.',
        severity: 'error',
      });
      return;
    }

    const parseNum = (val: any, defaultVal = 0): number => {
      if (val === undefined || val === null || val === '') return defaultVal;
      const parsed = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? defaultVal : parsed;
    };

    const daysPresent = parseNum(mapping.daysPresent ? row[mapping.daysPresent] : 0, 0);
    const daysAbsent = parseNum(mapping.daysAbsent ? row[mapping.daysAbsent] : 0, 0);
    const halfDays = parseNum(mapping.halfDays ? row[mapping.halfDays] : 0, 0);
    const overtimeHours = parseNum(mapping.overtimeHours ? row[mapping.overtimeHours] : 0, 0);
    const paidLeaves = parseNum(mapping.paidLeaves ? row[mapping.paidLeaves] : 0, 0);
    const unpaidLeaves = parseNum(mapping.unpaidLeaves ? row[mapping.unpaidLeaves] : 0, 0);
    const holidaysWorked = parseNum(mapping.holidaysWorked ? row[mapping.holidaysWorked] : 0, 0);
    const lateArrivalsCount = parseNum(mapping.lateArrivals ? row[mapping.lateArrivals] : 0, 0);
    const baseSalary = mapping.baseSalary ? parseNum(row[mapping.baseSalary], 0) : parseNum(row['Basic Salary'] || row['Base Salary'] || row['Salary'], 0);

    // Business Logic Validations
    if (daysPresent < 0) {
      validationErrors.push({
        row: rowNum,
        empId: rawEmpId,
        field: 'Days Present',
        message: `Days present (${daysPresent}) cannot be negative.`,
        severity: 'error',
      });
    }

    if (daysPresent > totalMonthDays) {
      validationErrors.push({
        row: rowNum,
        empId: rawEmpId,
        field: 'Days Present',
        message: `Days present (${daysPresent}) exceeds total days in month (${totalMonthDays}).`,
        severity: 'warning',
      });
    }

    if (daysPresent + paidLeaves + unpaidLeaves + (halfDays * 0.5) > totalMonthDays + 2) {
      validationErrors.push({
        row: rowNum,
        empId: rawEmpId,
        field: 'Attendance Tally',
        message: `Total accounted days (${daysPresent + paidLeaves + unpaidLeaves + halfDays * 0.5}) exceed cycle length (${totalMonthDays}).`,
        severity: 'warning',
      });
    }

    if (overtimeHours > 120) {
      validationErrors.push({
        row: rowNum,
        empId: rawEmpId,
        field: 'Overtime Hours',
        message: `High overtime hours detected (${overtimeHours} hrs). Please verify for labor regulation compliance.`,
        severity: 'warning',
      });
    }

    records.push({
      empId: rawEmpId,
      employeeName: rawName || undefined,
      department: rawDept || undefined,
      totalMonthDays,
      daysPresent,
      daysAbsent,
      halfDays,
      paidLeaves,
      unpaidLeaves,
      overtimeHours,
      holidayOvertimeHours: 0,
      lateArrivalsCount,
      earlyDeparturesCount: 0,
      holidaysWorked,
      baseSalary: baseSalary > 0 ? baseSalary : undefined,
      remarks: row['Remarks'] || row['Notes'] || '',
    });
  });

  return { records, validationErrors };
}

/**
 * Generates and downloads a standardized sample Excel file with prefilled instructions
 */
export function downloadSampleAttendanceTemplate(): void {
  const sampleData = [
    {
      'Employee ID': 'EMP-1001',
      'Employee Name': 'Alexander Wright',
      'Department': 'XML',
      'Basic Salary': 15000,
      'Days Present': 28,
      'Days Absent': 0,
      'Half Days': 0,
      'Paid Leaves': 2,
      'Unpaid Leaves (LOP)': 0,
      'Overtime Hours': 14,
      'Holidays Worked': 1,
      'Late Marks': 0,
      'Remarks': 'Standard Month Full Attendance'
    },
    {
      'Employee ID': 'EMP-1002',
      'Employee Name': 'Sophia Chen',
      'Department': 'ePub',
      'Basic Salary': 15000,
      'Days Present': 26,
      'Days Absent': 1,
      'Half Days': 2,
      'Paid Leaves': 1,
      'Unpaid Leaves (LOP)': 1,
      'Overtime Hours': 18.5,
      'Holidays Worked': 0,
      'Late Marks': 4,
      'Remarks': 'ePub release overtime'
    },
    {
      'Employee ID': 'EMP-1003',
      'Employee Name': 'Marcus Holloway',
      'Department': 'PPT',
      'Basic Salary': 15000,
      'Days Present': 29,
      'Days Absent': 0,
      'Half Days': 0,
      'Paid Leaves': 1,
      'Unpaid Leaves (LOP)': 0,
      'Overtime Hours': 5,
      'Holidays Worked': 0,
      'Late Marks': 1,
      'Remarks': 'PPT master slide templates'
    },
    {
      'Employee ID': 'EMP-1004',
      'Employee Name': 'Amara Patel',
      'Department': 'Word',
      'Basic Salary': 15000,
      'Days Present': 27,
      'Days Absent': 0,
      'Half Days': 0,
      'Paid Leaves': 3,
      'Unpaid Leaves (LOP)': 0,
      'Overtime Hours': 8,
      'Holidays Worked': 0,
      'Late Marks': 2,
      'Remarks': 'Approved annual leave'
    },
    {
      'Employee ID': 'EMP-1005',
      'Employee Name': 'David Rodriguez',
      'Department': 'XML',
      'Basic Salary': 15000,
      'Days Present': 22,
      'Days Absent': 0,
      'Half Days': 0,
      'Paid Leaves': 0,
      'Unpaid Leaves (LOP)': 0,
      'Overtime Hours': 32,
      'Holidays Worked': 2,
      'Late Marks': 0,
      'Remarks': '24/7 Server migration on-call'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Auto-width columns
  const colWidths = [
    { wch: 15 }, // Emp ID
    { wch: 22 }, // Name
    { wch: 22 }, // Dept
    { wch: 14 }, // Basic Salary
    { wch: 14 }, // Present
    { wch: 14 }, // Absent
    { wch: 12 }, // Half Days
    { wch: 14 }, // Paid Leaves
    { wch: 20 }, // Unpaid
    { wch: 16 }, // OT Hours
    { wch: 16 }, // Holidays Worked
    { wch: 14 }, // Late Marks
    { wch: 35 }, // Remarks
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Attendance_Template');
  XLSX.writeFile(wb, 'PayMaster_Attendance_Template.xlsx');
}
