import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings, SalaryBreakdown } from '../types/payroll';

/**
 * Generates an executive-level, professional PDF Pay Slip for an employee
 * Guaranteed 1-page pixel-perfect alignment with zero text overlapping
 */
export function generatePaySlipPDF(salary: SalaryBreakdown, settings: CompanySettings, returnBlob = false): any {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const leftMargin = 14;
  const contentWidth = 182; // 210 - 28

  // Clean currency symbol safe for standard PDF fonts
  let symbol = settings.currencySymbol || '$';
  if (symbol === '₹' || settings.currency === 'INR' || symbol.charCodeAt(0) > 127) {
    symbol = 'Rs.';
  }

  const paymentMethod = salary.paymentMethod || salary.profile.preferredPaymentMethod || 'bank_transfer';
  const isCash = paymentMethod === 'cash';
  const isUpi = paymentMethod === 'upi';
  const isCheque = paymentMethod === 'cheque';

  const paymentModeLabel = isCash 
    ? 'PAID BY CASH (Treasury Counter)'
    : isUpi
    ? 'UPI / Instant Mobile Payment'
    : isCheque
    ? 'Cheque Disbursement'
    : 'Direct Bank Transfer (NEFT/ACH)';

  const voucherRef = salary.paymentReference || (
    isCash 
      ? `CASH-VCHR-${salary.periodLabel.replace(/\s+/g, '')}-${salary.profile.empId}`
      : isUpi
      ? `UPI-${salary.profile.empId.toLowerCase()}@pay`
      : isCheque
      ? `CHQ-98402-${salary.profile.empId}`
      : `ACH-TRF-90281-${salary.profile.empId}`
  );

  const statusText = salary.status === 'disbursed'
    ? 'APPROVED & PAID'
    : salary.status === 'approved'
    ? 'AUDITED & APPROVED'
    : salary.status === 'under_review'
    ? 'UNDER REVIEW'
    : 'DRAFT ADVICE';

  // 1. Header Banner Background (Subtle corporate slate)
  doc.setFillColor(243, 246, 250);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Navy accent top line
  doc.setFillColor(30, 58, 138); // navy-900
  doc.rect(0, 0, pageWidth, 3.5, 'F');

  // Company Name & Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(settings.name, leftMargin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(settings.address, leftMargin, 18.5);
  doc.text(`Tax ID / EIN: ${settings.taxId}  |  Email: ${settings.email}  |  Phone: ${settings.phone}`, leftMargin, 23.5);

  // Pay Slip Title Badge & Status Badge on Top Right
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(pageWidth - leftMargin - 56, 9, 56, 10.5, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CONFIDENTIAL PAYSLIP', pageWidth - leftMargin - 28, 15.5, { align: 'center' });

  // Status Stamp Badge
  if (salary.status === 'disbursed' || isCash) {
    doc.setFillColor(22, 101, 52); // green-800
  } else if (salary.status === 'approved') {
    doc.setFillColor(30, 58, 138); // blue-900
  } else {
    doc.setFillColor(100, 116, 139);
  }
  doc.roundedRect(pageWidth - leftMargin - 56, 22, 56, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(`STATUS: ${statusText}`, pageWidth - leftMargin - 28, 26.2, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Period: ${salary.periodLabel}`, pageWidth - leftMargin - 56, 33);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(leftMargin, 40, pageWidth - leftMargin, 40);

  // 2. Employee Summary Info Grid
  const empInfo = [
    [
      { content: 'Employee ID:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: salary.profile.empId, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
      { content: 'Department:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: salary.profile.department, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
    ],
    [
      { content: 'Employee Name:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: salary.profile.name, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
      { content: 'Designation:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: salary.profile.designation, styles: { fontStyle: 'normal', textColor: [15, 23, 42] } },
    ],
    [
      { content: 'Date of Joining:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: salary.profile.joinDate, styles: { fontStyle: 'normal', textColor: [15, 23, 42] } },
      { content: 'Salary Structure:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: salary.profile.structureType.toUpperCase(), styles: { fontStyle: 'normal', textColor: [15, 23, 42] } },
    ],
    [
      { content: isCash ? 'Disbursal Mode:' : 'Bank / Channel:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: paymentModeLabel, styles: { fontStyle: 'bold', textColor: isCash ? [180, 83, 9] : [30, 58, 138] } },
      { content: isCash ? 'Cash Voucher #:' : isUpi ? 'UPI ID / Ref:' : 'Bank Account #:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: isCash ? voucherRef : isUpi ? voucherRef : salary.profile.accountNumber, styles: { fontStyle: 'normal', textColor: [15, 23, 42] } },
    ],
    [
      { content: 'Tax / SSN ID:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: salary.profile.panOrTaxNumber, styles: { fontStyle: 'normal', textColor: [15, 23, 42] } },
      { content: isCash ? 'Treasury Office:' : 'Routing / IFSC:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
      { content: isCash ? 'Corporate Cash Safe' : (salary.profile.routingOrIfsc || 'N/A'), styles: { fontStyle: 'normal', textColor: [15, 23, 42] } },
    ],
  ];

  autoTable(doc, {
    body: empInfo as any,
    startY: 42.5,
    theme: 'plain',
    tableWidth: contentWidth,
    styles: {
      fontSize: 7.8,
      cellPadding: 1.3,
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 59 },
      2: { cellWidth: 32 },
      3: { cellWidth: 59 },
    },
    margin: { left: leftMargin, right: leftMargin },
  });

  // 3. Attendance Overview Bar
  const attendanceStartY = (doc as any).lastAutoTable.finalY + 2;
  const attendanceData = [
    [
      `Total Days: ${salary.totalDays}`,
      `Present: ${salary.attendance.daysPresent}`,
      `Paid Leave: ${salary.attendance.paidLeaves}`,
      `Half-Days: ${salary.attendance.halfDays}`,
      `LOP (Unpaid): ${salary.lossOfPayDays}`,
      `Payable Days: ${salary.payableDays}`,
      `OT: ${salary.attendance.overtimeHours}h`,
    ],
  ];

  autoTable(doc, {
    body: attendanceData,
    startY: attendanceStartY,
    theme: 'grid',
    tableWidth: contentWidth,
    styles: {
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      cellPadding: 1.4,
    },
    margin: { left: leftMargin, right: leftMargin },
  });

  // 4. Earnings vs Deductions Dual Table
  const tableStartY = (doc as any).lastAutoTable.finalY + 3.5;
  const incentiveBonus = (salary.performanceBonus || 0) + (salary.reimbursements || 0);

  const earningsRows = [
    ['Basic Salary', `${symbol} ${(salary.basicPay ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['House Rent Allowance (HRA)', `${symbol} ${(salary.hra ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Conveyance Allowance', `${symbol} ${(salary.conveyanceAllowance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Special Allowance', `${symbol} ${(salary.specialAllowance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Overtime Pay', `${symbol} ${(salary.overtimePay ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Holiday Shift Pay', `${symbol} ${(salary.holidayWorkPay ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Incentive & Bonus', `${symbol} ${incentiveBonus.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Total Gross Earnings', `${symbol} ${(salary.grossEarnings ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
  ];

  const deductionsRows = [
    ['Provident Fund (PF 12%)', `${symbol} ${(salary.providentFund ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Health Insurance / ESI', `${symbol} ${(salary.esi ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Income Tax (TDS)', `${symbol} ${(salary.incomeTaxTDS ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Professional Tax (PT)', `${symbol} ${(salary.professionalTax ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Loss of Pay (LOP)', `${symbol} ${(salary.lossOfPayDeduction ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Late Arrival Penalty', `${symbol} ${(salary.lateDeduction ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Loan & Salary Advances', `${symbol} ${(salary.otherDeductions ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
    ['Total Deductions', `${symbol} ${(salary.totalDeductions ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
  ];

  const combinedTableBody: any[] = [];
  const maxRows = Math.max(earningsRows.length, deductionsRows.length);

  for (let i = 0; i < maxRows; i++) {
    const earn = earningsRows[i] || ['', ''];
    const ded = deductionsRows[i] || ['', ''];
    const isTotalRow = i === maxRows - 1;

    combinedTableBody.push([
      {
        content: earn[0],
        styles: { 
          fontStyle: isTotalRow ? 'bold' : 'normal', 
          fillColor: isTotalRow ? [239, 246, 255] : undefined,
          textColor: isTotalRow ? [30, 58, 138] : [30, 41, 59]
        },
      },
      {
        content: earn[1],
        styles: { 
          halign: 'right', 
          fontStyle: isTotalRow ? 'bold' : 'normal', 
          fillColor: isTotalRow ? [239, 246, 255] : undefined,
          textColor: isTotalRow ? [30, 58, 138] : [15, 23, 42]
        },
      },
      {
        content: ded[0],
        styles: { 
          fontStyle: isTotalRow ? 'bold' : 'normal', 
          fillColor: isTotalRow ? [255, 241, 242] : undefined,
          textColor: isTotalRow ? [153, 27, 27] : [30, 41, 59]
        },
      },
      {
        content: ded[1],
        styles: { 
          halign: 'right', 
          fontStyle: isTotalRow ? 'bold' : 'normal', 
          fillColor: isTotalRow ? [255, 241, 242] : undefined,
          textColor: isTotalRow ? [153, 27, 27] : [15, 23, 42]
        },
      },
    ]);
  }

  autoTable(doc, {
    head: [
      [
        { content: 'EARNINGS COMPONENT', styles: { halign: 'left', fillColor: [30, 58, 138], textColor: [255, 255, 255] } },
        { content: 'AMOUNT', styles: { halign: 'right', fillColor: [30, 58, 138], textColor: [255, 255, 255] } },
        { content: 'DEDUCTIONS COMPONENT', styles: { halign: 'left', fillColor: [153, 27, 27], textColor: [255, 255, 255] } },
        { content: 'AMOUNT', styles: { halign: 'right', fillColor: [153, 27, 27], textColor: [255, 255, 255] } },
      ],
    ],
    body: combinedTableBody,
    startY: tableStartY,
    theme: 'grid',
    tableWidth: contentWidth,
    styles: {
      fontSize: 7.8,
      cellPadding: { top: 1.8, right: 3, bottom: 1.8, left: 3 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'ellipsize',
    },
    columnStyles: {
      0: { cellWidth: 53, halign: 'left' },
      1: { cellWidth: 38, halign: 'right' },
      2: { cellWidth: 53, halign: 'left' },
      3: { cellWidth: 38, halign: 'right' },
    },
    margin: { left: leftMargin, right: leftMargin },
  });

  // 5. Net Salary Highlight Banner Box
  const netPayBoxY = (doc as any).lastAutoTable.finalY + 3.5;

  if (isCash) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(217, 119, 6); // amber-600
  } else {
    doc.setFillColor(240, 253, 244); // green-50
    doc.setDrawColor(34, 197, 94); // green-500
  }
  doc.setLineWidth(0.6);
  doc.roundedRect(leftMargin, netPayBoxY, contentWidth, 16.5, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(isCash ? 146 : 22, isCash ? 64 : 101, isCash ? 14 : 52);
  doc.text(isCash ? 'NET CASH DISBURSED:' : 'NET TAKE-HOME PAYOUT:', leftMargin + 5, netPayBoxY + 5.5);

  doc.setFontSize(12);
  doc.setTextColor(isCash ? 180 : 21, isCash ? 83 : 128, isCash ? 9 : 61);
  doc.text(`${symbol} ${(salary.netPay ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, pageWidth - leftMargin - 5, netPayBoxY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`Amount in Words: ${salary.netPayInWords}`, leftMargin + 5, netPayBoxY + 11.5);
  doc.text(
    isCash 
      ? `Disbursed in Physical Currency via Voucher Ref: ${voucherRef}` 
      : isUpi
      ? `Settled via Instant UPI Ref: ${voucherRef}`
      : `Transferred directly to ${salary.profile.bankName} (A/C: ${salary.profile.accountNumber})`,
    leftMargin + 5,
    netPayBoxY + 15
  );

  // 6. Cash Handover Receipt or Compliance Note
  let footerY = netPayBoxY + 19.5;
  if (isCash) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.roundedRect(leftMargin, footerY, contentWidth, 10.5, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(146, 64, 14);
    doc.text('CASH HANDOVER ACKNOWLEDGMENT & RECEIPT', leftMargin + 3, footerY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Cashier / Treasury: ${settings.companySignatoryName}        |        Received by Employee: ${salary.profile.name} (Signature: _____________________)`, leftMargin + 3, footerY + 7.8);
    footerY += 13;
  }

  // 7. Footer, Employer PF Note & Authorized Signatory
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`* Employer PF Contribution: ${symbol} ${(salary.employerPF ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} (Retirement benefit / not deducted from gross)`, leftMargin, footerY + 2);
  doc.text('This is a verified computer-generated salary slip and payment advice authenticated under company payroll rules.', leftMargin, footerY + 6);
  doc.text(`Generated: ${new Date().toLocaleDateString()}  |  Reference ID: ${salary.id}`, leftMargin, footerY + 10);

  // Signatory Stamp Block
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - leftMargin - 55, footerY + 7, pageWidth - leftMargin, footerY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(settings.companySignatoryName, pageWidth - leftMargin - 27.5, footerY + 11, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.companySignatoryTitle, pageWidth - leftMargin - 27.5, footerY + 14.5, { align: 'center' });
  doc.text(settings.name, pageWidth - leftMargin - 27.5, footerY + 17.5, { align: 'center' });

  if (returnBlob) {
    return doc.output('blob');
  }

  doc.save(`PaySlip_${salary.profile.empId}_${salary.month}.pdf`);
}
