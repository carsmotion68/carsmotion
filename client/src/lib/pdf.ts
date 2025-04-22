import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Invoice, Customer, Reservation, Vehicle, Settings, getSettings } from "./storage";

// Helper function to add text with positioning and styling
function addText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
    fontSize?: number;
    fontStyle?: string;
  } = {}
) {
  const {
    align = 'left',
    maxWidth,
    fontSize = 10,
    fontStyle = 'normal'
  } = options;

  doc.setFontSize(fontSize);
  
  if (fontStyle === 'bold') {
    doc.setFont('helvetica', 'bold');
  } else if (fontStyle === 'italic') {
    doc.setFont('helvetica', 'italic');
  } else {
    doc.setFont('helvetica', 'normal');
  }
  
  if (maxWidth) {
    doc.text(text, x, y, { align, maxWidth });
  } else {
    doc.text(text, x, y, { align });
  }
}

// Generate a PDF invoice
export function generateInvoicePdf(
  invoice: Invoice,
  customer: Customer,
  reservation?: Reservation,
  vehicle?: Vehicle
): jsPDF {
  // Create a new PDF document
  const doc = new jsPDF();
  const settings: Settings = getSettings();
  
  // Set default font
  doc.setFont('helvetica');
  
  // Add company logo if available
  // This would typically be an image but since we're working offline, we'll just add text
  
  // Add company information
  addText(doc, settings.companyName, 15, 20, { fontSize: 18, fontStyle: 'bold' });
  addText(doc, settings.companyAddress, 15, 30);
  addText(doc, `Tél: ${settings.companyPhone}`, 15, 35);
  addText(doc, `Email: ${settings.companyEmail}`, 15, 40);
  if (settings.vatNumber) {
    addText(doc, `TVA: ${settings.vatNumber}`, 15, 45);
  }
  
  // Add invoice title and details
  addText(doc, 'FACTURE', 195, 20, { align: 'right', fontSize: 16, fontStyle: 'bold' });
  addText(doc, `N°: ${invoice.invoiceNumber}`, 195, 30, { align: 'right' });
  addText(doc, `Date: ${format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: fr })}`, 195, 35, { align: 'right' });
  addText(doc, `Échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}`, 195, 40, { align: 'right' });
  
  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 50, 195, 50);
  
  // Add client information
  addText(doc, 'Facturé à:', 15, 60, { fontStyle: 'bold' });
  addText(doc, `${customer.firstName} ${customer.lastName}`, 15, 65);
  if (customer.address) {
    addText(doc, customer.address, 15, 70);
  }
  if (customer.city && customer.postalCode) {
    addText(doc, `${customer.postalCode} ${customer.city}`, 15, 75);
  }
  addText(doc, `Email: ${customer.email}`, 15, 80);
  addText(doc, `Tél: ${customer.phone}`, 15, 85);
  
  // Add invoice details
  addText(doc, 'Détails de la facture', 15, 100, { fontSize: 12, fontStyle: 'bold' });
  
  // Add invoice line items
  const tableColumn = ['Description', 'Période', 'Prix unitaire', 'Jours', 'Total'];
  const tableRows = [];
  
  if (reservation && vehicle) {
    const startDate = format(new Date(reservation.startDate), 'dd/MM/yyyy', { locale: fr });
    const endDate = format(new Date(reservation.endDate), 'dd/MM/yyyy', { locale: fr });
    const period = `${startDate} - ${endDate}`;
    
    // Calculate days
    const days = Math.ceil(
      (new Date(reservation.endDate).getTime() - new Date(reservation.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const dailyRate = (reservation.totalAmount / days).toFixed(2);
    
    tableRows.push([
      `Location ${vehicle.make} ${vehicle.model}\nImmatriculation: ${vehicle.licensePlate}`,
      period,
      `${dailyRate} €`,
      days.toString(),
      `${reservation.totalAmount.toFixed(2)} €`
    ]);
  } else {
    // If no reservation details, just add a generic line
    tableRows.push([
      `Services de location de véhicule`,
      '-',
      '-',
      '-',
      `${invoice.totalAmount.toFixed(2)} €`
    ]);
  }
  
  // Add the table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 105,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [44, 62, 80], // Primary color #2C3E50
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
  });
  
  // Get the final position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Add totals
  const subTotal = invoice.totalAmount - invoice.taxAmount;
  
  addText(doc, 'Sous-total:', 140, finalY, { align: 'right' });
  addText(doc, `${subTotal.toFixed(2)} €`, 195, finalY, { align: 'right' });
  
  addText(doc, 'TVA (20%):', 140, finalY + 6, { align: 'right' });
  addText(doc, `${invoice.taxAmount.toFixed(2)} €`, 195, finalY + 6, { align: 'right' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(140, finalY + 8, 195, finalY + 8);
  
  addText(doc, 'Total:', 140, finalY + 14, { align: 'right', fontStyle: 'bold' });
  addText(doc, `${invoice.totalAmount.toFixed(2)} €`, 195, finalY + 14, { align: 'right', fontStyle: 'bold' });
  
  // Add payment information
  addText(doc, 'Modalités de paiement', 15, finalY + 30, { fontSize: 11, fontStyle: 'bold' });
  addText(doc, 'Veuillez effectuer le paiement dans les 14 jours suivant la réception de cette facture.', 15, finalY + 36);
  
  if (settings.bankDetails) {
    addText(doc, 'Coordonnées bancaires:', 15, finalY + 42);
    const bankLines = settings.bankDetails.split('\n');
    let yPos = finalY + 48;
    
    bankLines.forEach(line => {
      addText(doc, line, 15, yPos);
      yPos += 5;
    });
  }
  
  // Add footer
  const pageHeight = doc.internal.pageSize.height;
  addText(doc, 'Merci pour votre confiance !', 105, pageHeight - 30, { align: 'center' });
  addText(doc, `${settings.companyName} - SIRET: ${settings.vatNumber?.replace('FR', '')} - TVA: ${settings.vatNumber}`, 105, pageHeight - 25, { align: 'center', fontSize: 8 });
  
  return doc;
}

// Export an invoice PDF
export function downloadInvoicePdf(
  invoice: Invoice,
  customer: Customer,
  reservation?: Reservation,
  vehicle?: Vehicle
): void {
  const doc = generateInvoicePdf(invoice, customer, reservation, vehicle);
  doc.save(`facture_${invoice.invoiceNumber}.pdf`);
}
