import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import type { Complaint } from '@holdon/shared';

/**
 * Generate a branded HoldOn report PDF for a verified complaint (FR-18).
 * Includes: ref ID, category, jurisdiction, description, masked excerpt,
 * SHA-256 hash, QR code to /verify/:hash, timestamp, simulation disclaimer.
 */
export async function generateReportPDF(complaint: Complaint): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors matching DESIGN.md v2
  const bgColor: [number, number, number] = [6, 10, 12];
  const surfaceColor: [number, number, number] = [12, 18, 21];
  const accentColor: [number, number, number] = [52, 211, 153];
  const textColor: [number, number, number] = [243, 246, 247];
  const mutedColor: [number, number, number] = [154, 166, 171];
  const borderColor: [number, number, number] = [31, 42, 47];

  // Background
  doc.setFillColor(...bgColor);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

  // Header bar
  doc.setFillColor(...surfaceColor);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'S');

  // Logo mark
  doc.setFillColor(...accentColor);
  doc.roundedRect(margin + 5, y + 4, 14, 14, 2, 2, 'F');
  doc.setTextColor(4, 19, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('H', margin + 9.5, y + 13);

  // Title
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HoldOn — Complaint Report', margin + 24, y + 10);

  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Tamper-Proof Verification Document', margin + 24, y + 16);

  y += 30;

  // Reference ID section
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.text('REFERENCE ID', margin, y);
  y += 5;
  doc.setTextColor(...accentColor);
  doc.setFontSize(18);
  doc.setFont('courier', 'bold');
  doc.text(complaint.ref, margin, y);
  y += 10;

  // Status pill
  doc.setFillColor(...surfaceColor);
  doc.roundedRect(margin, y - 3, 50, 8, 2, 2, 'F');
  doc.setTextColor(...accentColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${complaint.status}`, margin + 4, y + 2);
  y += 14;

  // Details grid
  const drawField = (label: string, value: string) => {
    doc.setTextColor(...mutedColor);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, y);
    y += 4;
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 3;
  };

  drawField('CATEGORY', complaint.category);
  drawField('JURISDICTION', complaint.district ? `${complaint.district}, ${complaint.state}` : complaint.state);
  drawField('AMOUNT LOST', `₹${Number(complaint.amount_lost).toLocaleString('en-IN')}`);
  drawField('INCIDENT DATE', complaint.incident_at
    ? new Date(complaint.incident_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })
    : 'Not specified');
  drawField('FILED ON', new Date(complaint.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }));

  // Separator
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  // Description
  drawField('INCIDENT DESCRIPTION', complaint.description || (complaint.anonymised_at ? '[Record anonymised by citizen]' : 'No description provided'));

  // Masked excerpt
  if (complaint.masked_excerpt) {
    doc.setFillColor(...surfaceColor);
    const excerptLines = doc.splitTextToSize(complaint.masked_excerpt, contentWidth - 10);
    const excerptHeight = excerptLines.length * 4 + 10;
    doc.roundedRect(margin, y - 2, contentWidth, excerptHeight, 2, 2, 'F');
    doc.setTextColor(...mutedColor);
    doc.setFontSize(7);
    doc.text('MASKED TRANSCRIPT EXCERPT', margin + 5, y + 3);
    doc.setTextColor(...textColor);
    doc.setFontSize(7);
    doc.setFont('courier', 'normal');
    doc.text(excerptLines, margin + 5, y + 8);
    y += excerptHeight + 4;
  }

  // Check if we need a new page
  if (y > 230) {
    doc.addPage();
    doc.setFillColor(...bgColor);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    y = margin;
  }

  // SHA-256 Hash section
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;

  doc.setTextColor(...mutedColor);
  doc.setFontSize(7);
  doc.text('SHA-256 INTEGRITY HASH', margin, y);
  y += 5;

  doc.setFillColor(...surfaceColor);
  doc.roundedRect(margin, y - 3, contentWidth, 10, 2, 2, 'F');
  doc.setTextColor(...accentColor);
  doc.setFontSize(7);
  doc.setFont('courier', 'bold');
  doc.text(complaint.report_hash || 'N/A', margin + 4, y + 3);
  y += 14;

  // QR Code
  if (complaint.report_hash) {
    const verifyUrl = `${window.location.origin}/verify/${complaint.report_hash}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#34D399', light: '#0C1215' },
      });

      doc.setTextColor(...mutedColor);
      doc.setFontSize(7);
      doc.text('SCAN TO VERIFY REPORT INTEGRITY', margin, y);
      y += 4;

      doc.addImage(qrDataUrl, 'PNG', margin, y, 35, 35);

      doc.setTextColor(...mutedColor);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      const urlLines = doc.splitTextToSize(verifyUrl, contentWidth - 42);
      doc.text(urlLines, margin + 40, y + 10);

      y += 42;
    } catch {
      // QR generation failed, skip it
    }
  }

  // Simulation disclaimer
  doc.setDrawColor(...borderColor);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;
  doc.setFillColor(17, 26, 30);
  doc.roundedRect(margin, y - 2, contentWidth, 14, 2, 2, 'F');
  doc.setTextColor(...accentColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Demo Simulation Notice', margin + 4, y + 3);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('This report is generated in the HoldOn sandbox. It is not sent to any government system.', margin + 4, y + 8);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(6);
  doc.text(`Generated ${new Date().toISOString()} — HoldOn v1.0`, margin, footerY);
  doc.text('holdon.demo', pageWidth - margin - 20, footerY);

  // Download
  doc.save(`HoldOn-Report-${complaint.ref}.pdf`);
}
