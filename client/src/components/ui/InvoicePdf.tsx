import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Invoice, Customer, Reservation, Vehicle, getSettings } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail } from "lucide-react";
import { downloadInvoicePdf } from "@/lib/pdf";

interface InvoicePdfPreviewProps {
  invoice: Invoice;
  customer: Customer;
  reservation?: Reservation;
  vehicle?: Vehicle;
}

const InvoicePdfPreview = ({ invoice, customer, reservation, vehicle }: InvoicePdfPreviewProps) => {
  const settings = getSettings();
  
  // Calculate days and daily rate if reservation exists
  const days = reservation ? Math.ceil(
    (new Date(reservation.endDate).getTime() - new Date(reservation.startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) : 0;
  
  const dailyRate = days > 0 ? (invoice.totalAmount - invoice.taxAmount) / days : 0;
  
  // Calculate tax and subtotal
  const subTotal = invoice.totalAmount - invoice.taxAmount;
  
  // Handle download
  const handleDownload = () => {
    downloadInvoicePdf(invoice, customer, reservation, vehicle);
  };
  
  // Handle print
  const handlePrint = () => {
    window.print();
  };
  
  // Handle email sending (this is a stub since we're offline)
  const handleEmail = () => {
    alert(`Cette fonction enverrait un email avec la facture à ${customer.email}`);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-heading font-semibold">Aperçu de la facture</h2>
      </div>
      
      <div className="p-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-heading font-bold text-primary mb-1">{settings.companyName}</h1>
              <p className="text-sm">{settings.companyAddress}</p>
              <p className="text-sm">Tel: {settings.companyPhone}</p>
              <p className="text-sm">Email: {settings.companyEmail}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-heading font-bold mb-1">FACTURE</h2>
              <p className="text-sm"><span className="font-medium">N°:</span> {invoice.invoiceNumber}</p>
              <p className="text-sm"><span className="font-medium">Date:</span> {format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: fr })}</p>
              <p className="text-sm"><span className="font-medium">Échéance:</span> {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}</p>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="border-b border-gray-200 pb-2 mb-2">
              <h3 className="font-heading font-semibold">Facturé à</h3>
            </div>
            <p className="text-sm">{customer.firstName} {customer.lastName}</p>
            {customer.address && <p className="text-sm">{customer.address}</p>}
            {customer.postalCode && customer.city && <p className="text-sm">{customer.postalCode} {customer.city}</p>}
            <p className="text-sm">Email: {customer.email}</p>
            <p className="text-sm">Tel: {customer.phone}</p>
          </div>
          
          <div className="mb-8">
            <div className="border-b border-gray-200 pb-2 mb-4">
              <h3 className="font-heading font-semibold">Détails de la facture</h3>
            </div>
            
            <table className="min-w-full mb-4">
              <thead>
                <tr className="text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                  <th className="pb-2 font-heading">Description</th>
                  <th className="pb-2 font-heading">Période</th>
                  <th className="pb-2 text-right font-heading">Prix unitaire</th>
                  <th className="pb-2 text-center font-heading">Jours</th>
                  <th className="pb-2 text-right font-heading">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-sm border-b border-gray-200">
                  <td className="py-3">
                    <p className="font-medium">
                      {vehicle ? `Location ${vehicle.make} ${vehicle.model}` : 'Services de location de véhicule'}
                    </p>
                    {vehicle && <p className="text-xs text-gray-600">Immatriculation: {vehicle.licensePlate}</p>}
                  </td>
                  <td className="py-3">
                    {reservation ? `${format(new Date(reservation.startDate), 'dd/MM/yyyy', { locale: fr })} - ${format(new Date(reservation.endDate), 'dd/MM/yyyy', { locale: fr })}` : '-'}
                  </td>
                  <td className="py-3 text-right">{dailyRate > 0 ? `${dailyRate.toFixed(2)} €` : '-'}</td>
                  <td className="py-3 text-center">{days > 0 ? days : '-'}</td>
                  <td className="py-3 text-right font-medium">{subTotal.toFixed(2)} €</td>
                </tr>
              </tbody>
            </table>
            
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 text-sm">
                  <span>Sous-total</span>
                  <span className="font-medium">{subTotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                  <span>TVA (20%)</span>
                  <span className="font-medium">{invoice.taxAmount.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between py-2 text-base font-bold">
                  <span>Total</span>
                  <span>{invoice.totalAmount.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="border-b border-gray-200 pb-2 mb-2">
              <h3 className="font-heading font-semibold">Modalités de paiement</h3>
            </div>
            <p className="text-sm mb-2">Veuillez effectuer le paiement dans les 14 jours suivant la réception de cette facture.</p>
            {settings.bankDetails && (
              <p className="text-sm">
                <span className="font-medium">Coordonnées bancaires:</span><br />
                {settings.bankDetails.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </p>
            )}
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Merci pour votre confiance !</p>
            <p>{settings.companyName} - SIRET: {settings.vatNumber?.replace('FR', '')} - TVA: {settings.vatNumber}</p>
          </div>
        </div>
        
        <div className="flex justify-center mt-6 space-x-4">
          <Button onClick={handleDownload} className="bg-secondary hover:bg-blue-600">
            <Download className="mr-2 h-4 w-4" /> Télécharger PDF
          </Button>
          <Button onClick={handlePrint} variant="secondary" className="bg-gray-600 hover:bg-gray-700 text-white">
            <Printer className="mr-2 h-4 w-4" /> Imprimer
          </Button>
          <Button onClick={handleEmail} variant="outline">
            <Mail className="mr-2 h-4 w-4" /> Envoyer par email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePdfPreview;
