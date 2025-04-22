import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Eye, 
  Download, 
  Printer 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ModalContainer from "@/components/modals/ModalContainer";
import InvoiceForm from "@/components/forms/InvoiceForm";
import InvoicePdfPreview from "@/components/ui/InvoicePdf";
import {
  Invoice,
  Customer,
  Reservation,
  Vehicle,
  invoiceStorage,
  customerStorage,
  reservationStorage,
  vehicleStorage
} from "@/lib/storage";
import { downloadInvoicePdf } from "@/lib/pdf";
import { getStatusColor, formatCurrency } from "@/lib/utils";

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Load data from storage
  useEffect(() => {
    const loadData = () => {
      const allInvoices = invoiceStorage.getAll();
      setInvoices(allInvoices);
      
      const allCustomers = customerStorage.getAll();
      setCustomers(allCustomers);
      
      const allReservations = reservationStorage.getAll();
      setReservations(allReservations);
      
      const allVehicles = vehicleStorage.getAll();
      setVehicles(allVehicles);
      
      applyFilters(allInvoices, searchQuery, statusFilter, startDate, endDate);
    };
    
    loadData();
  }, []);
  
  // Apply filters and search when query or filters change
  useEffect(() => {
    applyFilters(invoices, searchQuery, statusFilter, startDate, endDate);
  }, [searchQuery, statusFilter, startDate, endDate]);
  
  // Apply filters and search to invoices
  const applyFilters = (
    allInvoices: Invoice[], 
    query: string, 
    status: string, 
    start: string,
    end: string
  ) => {
    let filtered = [...allInvoices];
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      
      // Find customers that match the query
      const matchingCustomers = customers.filter(customer => 
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(lowerQuery)
      );
      const customerIds = matchingCustomers.map(c => c.id);
      
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(lowerQuery) ||
        customerIds.includes(invoice.customerId)
      );
    }
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(invoice => invoice.status === status);
    }
    
    // Apply date range filter
    if (start) {
      const startDateObj = new Date(start);
      filtered = filtered.filter(invoice => 
        new Date(invoice.issueDate) >= startDateObj
      );
    }
    
    if (end) {
      const endDateObj = new Date(end);
      endDateObj.setHours(23, 59, 59, 999); // End of the day
      filtered = filtered.filter(invoice => 
        new Date(invoice.issueDate) <= endDateObj
      );
    }
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    
    setFilteredInvoices(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };
  
  // Get paginated invoices
  const getPaginatedInvoices = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredInvoices.slice(startIndex, endIndex);
  };
  
  // Handle invoice operations
  const handleCreateInvoice = () => {
    setIsAddModalOpen(true);
  };
  
  const handleViewInvoice = (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId) || null;
    let reservation = null;
    let vehicle = null;
    
    if (invoice.reservationId) {
      reservation = reservations.find(r => r.id === invoice.reservationId) || null;
      if (reservation) {
        vehicle = vehicles.find(v => v.id === reservation.vehicleId) || null;
      }
    }
    
    setSelectedInvoice(invoice);
    setSelectedCustomer(customer);
    setSelectedReservation(reservation);
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(true);
  };
  
  const handleDownloadInvoice = (invoice: Invoice) => {
    const customer = customers.find(c => c.id === invoice.customerId);
    if (!customer) return;
    
    let reservation = null;
    let vehicle = null;
    
    if (invoice.reservationId) {
      reservation = reservations.find(r => r.id === invoice.reservationId) || null;
      if (reservation) {
        vehicle = vehicles.find(v => v.id === reservation.vehicleId) || null;
      }
    }
    
    downloadInvoicePdf(invoice, customer, reservation || undefined, vehicle || undefined);
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    // Close modals
    setIsAddModalOpen(false);
    setIsViewModalOpen(false);
    
    // Refresh invoice list
    const allInvoices = invoiceStorage.getAll();
    setInvoices(allInvoices);
  };
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };
  
  // Helper functions
  const getCustomerInfo = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : "Client inconnu";
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "unpaid":
        return "Non payée";
      case "paid":
        return "Payée";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Factures</h1>
          <p className="text-gray-600">Gérez et générez les factures clients</p>
        </div>
        <Button onClick={handleCreateInvoice} className="bg-secondary hover:bg-blue-600">
          <Plus className="mr-2 h-4 w-4" /> Créer une facture
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Rechercher une facture..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="unpaid">Non payée</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
                placeholder="Date de début"
              />
              
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[180px]"
                placeholder="Date de fin"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Facture
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getPaginatedInvoices().length > 0 ? (
                getPaginatedInvoices().map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm">{invoice.invoiceNumber}</td>
                    <td className="py-4 px-4 text-sm">{getCustomerInfo(invoice.customerId)}</td>
                    <td className="py-4 px-4 text-sm">{format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: fr })}</td>
                    <td className="py-4 px-4 font-medium">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="text-secondary hover:text-blue-700 h-8 w-8"
                          onClick={() => handleViewInvoice(invoice)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-secondary hover:text-blue-700 h-8 w-8"
                          onClick={() => handleDownloadInvoice(invoice)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-secondary hover:text-blue-700 h-8 w-8"
                          onClick={() => {
                            const customer = customers.find(c => c.id === invoice.customerId);
                            if (!customer) return;
                            
                            let reservation = null;
                            let vehicle = null;
                            
                            if (invoice.reservationId) {
                              reservation = reservations.find(r => r.id === invoice.reservationId) || null;
                              if (reservation) {
                                vehicle = vehicles.find(v => v.id === reservation.vehicleId) || null;
                              }
                            }
                            
                            // Open invoice in new window for printing
                            const doc = downloadInvoicePdf(invoice, customer, reservation || undefined, vehicle || undefined);
                            doc.autoPrint();
                            doc.output("dataurlnewwindow");
                          }}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Aucune facture ne correspond à vos critères de recherche
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredInvoices.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} sur {filteredInvoices.length} factures
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                // Logic to show current page and adjacent pages
                let pageToShow = currentPage;
                if (i === 0) pageToShow = Math.max(1, currentPage - 1);
                if (i === 1) pageToShow = currentPage;
                if (i === 2) pageToShow = Math.min(totalPages, currentPage + 1);
                
                // Don't show duplicates or pages out of range
                if (pageToShow < 1 || pageToShow > totalPages) return null;
                if (i > 0 && pageToShow === parseInt(Array.from({ length: i }, (_, j) => j).pop()?.toString() || "0")) return null;
                
                return (
                  <Button
                    key={pageToShow}
                    variant={currentPage === pageToShow ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageToShow)}
                    className={currentPage === pageToShow ? "bg-secondary" : ""}
                  >
                    {pageToShow}
                  </Button>
                );
              })}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Invoice Preview area is shown when an invoice is selected */}
      {selectedInvoice && selectedCustomer && isViewModalOpen && (
        <InvoicePdfPreview 
          invoice={selectedInvoice}
          customer={selectedCustomer}
          reservation={selectedReservation || undefined}
          vehicle={selectedVehicle || undefined}
        />
      )}
      
      {/* Add Invoice Modal */}
      <ModalContainer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Créer une facture"
        size="lg"
      >
        <InvoiceForm onSuccess={handleFormSuccess} />
      </ModalContainer>
      
      {/* View Invoice Modal */}
      <ModalContainer
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Aperçu de la facture"
        size="lg"
      >
        {selectedInvoice && selectedCustomer && (
          <InvoicePdfPreview 
            invoice={selectedInvoice}
            customer={selectedCustomer}
            reservation={selectedReservation || undefined}
            vehicle={selectedVehicle || undefined}
          />
        )}
      </ModalContainer>
    </div>
  );
};

export default Invoices;
