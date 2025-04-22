import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Pencil, 
  Eye, 
  FileText 
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ModalContainer from "@/components/modals/ModalContainer";
import ReservationForm from "@/components/forms/ReservationForm";
import ReservationCalendar from "@/components/ui/ReservationCalendar";
import InvoiceForm from "@/components/forms/InvoiceForm";
import {
  Reservation,
  Vehicle,
  Customer,
  reservationStorage,
  vehicleStorage,
  customerStorage
} from "@/lib/storage";
import { getStatusColor, formatCurrency } from "@/lib/utils";

const Reservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [activeReservations, setActiveReservations] = useState<Reservation[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Load data from storage
  useEffect(() => {
    const loadData = () => {
      const allReservations = reservationStorage.getAll();
      setReservations(allReservations);
      
      const allVehicles = vehicleStorage.getAll();
      setVehicles(allVehicles);
      
      const allCustomers = customerStorage.getAll();
      setCustomers(allCustomers);
      
      // Set active reservations (confirmed and not ended yet)
      const active = allReservations.filter(res => 
        res.status === "confirmed" && 
        new Date(res.endDate) >= new Date()
      );
      setActiveReservations(active);
      
      applyFilters(allReservations, searchQuery, statusFilter, vehicleFilter);
    };
    
    loadData();
  }, []);
  
  // Apply filters and search when query or filters change
  useEffect(() => {
    applyFilters(reservations, searchQuery, statusFilter, vehicleFilter);
  }, [searchQuery, statusFilter, vehicleFilter]);
  
  // Apply filters and search to reservations
  const applyFilters = (
    allReservations: Reservation[], 
    query: string, 
    status: string, 
    vehicleId: string
  ) => {
    let filtered = [...allReservations];
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      
      // Find customers that match the query
      const matchingCustomers = customers.filter(customer => 
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(lowerQuery)
      );
      const customerIds = matchingCustomers.map(c => c.id);
      
      // Find vehicles that match the query
      const matchingVehicles = vehicles.filter(vehicle => 
        `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(lowerQuery) ||
        vehicle.licensePlate.toLowerCase().includes(lowerQuery)
      );
      const vehicleIds = matchingVehicles.map(v => v.id);
      
      filtered = filtered.filter(reservation => 
        customerIds.includes(reservation.customerId) ||
        vehicleIds.includes(reservation.vehicleId)
      );
    }
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(reservation => reservation.status === status);
    }
    
    // Apply vehicle filter
    if (vehicleId !== "all") {
      filtered = filtered.filter(reservation => reservation.vehicleId === vehicleId);
    }
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    setFilteredReservations(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };
  
  // Get paginated reservations
  const getPaginatedReservations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredReservations.slice(startIndex, endIndex);
  };
  
  // Handle reservation operations
  const handleAddReservation = () => {
    setIsAddModalOpen(true);
  };
  
  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsEditModalOpen(true);
  };
  
  const handleViewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsViewModalOpen(true);
  };
  
  const handleCreateInvoice = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsInvoiceModalOpen(true);
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    // Close modals
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setIsInvoiceModalOpen(false);
    
    // Refresh reservation list
    const allReservations = reservationStorage.getAll();
    setReservations(allReservations);
    
    // Update active reservations
    const active = allReservations.filter(res => 
      res.status === "confirmed" && 
      new Date(res.endDate) >= new Date()
    );
    setActiveReservations(active);
  };
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };
  
  // Helper functions
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model}` : "Véhicule inconnu";
  };
  
  const getCustomerInfo = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : "Client inconnu";
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "confirmed":
        return "Confirmé";
      case "completed":
        return "Terminé";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Réservations</h1>
          <p className="text-gray-600">Gérez toutes les réservations de véhicules</p>
        </div>
        <Button onClick={handleAddReservation} className="bg-secondary hover:bg-blue-600">
          <Plus className="mr-2 h-4 w-4" /> Nouvelle réservation
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <div className="lg:col-span-3">
          <ReservationCalendar 
            reservations={reservations} 
            vehicles={vehicles}
          />
        </div>
        
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-heading font-semibold mb-4">Réservations actives</h2>
          
          <div className="space-y-4">
            {activeReservations.length > 0 ? (
              activeReservations.slice(0, 5).map(reservation => {
                const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
                const customer = customers.find(c => c.id === reservation.customerId);
                
                return (
                  <div key={reservation.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : "Véhicule inconnu"}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                        {getStatusLabel(reservation.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <p>
                        {format(new Date(reservation.startDate), 'dd/MM/yyyy', { locale: fr })} - 
                        {format(new Date(reservation.endDate), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                      <p>Client: {customer ? `${customer.firstName} ${customer.lastName}` : "Client inconnu"}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Total: {formatCurrency(reservation.totalAmount)}</span>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="text-secondary hover:text-blue-700 h-8 w-8"
                          onClick={() => handleEditReservation(reservation)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800 h-8 w-8"
                          onClick={() => handleViewReservation(reservation)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800 h-8 w-8"
                          onClick={() => handleCreateInvoice(reservation)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center p-4 text-gray-500">
                Aucune réservation active
              </div>
            )}
            
            {activeReservations.length > 5 && (
              <Button variant="link" className="w-full text-secondary">
                Voir toutes les réservations actives
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-heading font-semibold">Historique des réservations</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les véhicules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les véhicules</SelectItem>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Réf.
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getPaginatedReservations().length > 0 ? (
                getPaginatedReservations().map((reservation) => {
                  // Format dates
                  const startDateFormatted = format(new Date(reservation.startDate), 'dd/MM/yyyy', { locale: fr });
                  const endDateFormatted = format(new Date(reservation.endDate), 'dd/MM/yyyy', { locale: fr });
                  
                  // Generate a reference ID for display
                  const refId = `RS-${reservation.id.substring(0, 5)}`;
                  
                  // Check if reservation is completed or cancelled
                  const isDisabled = reservation.status === "completed" || reservation.status === "cancelled";
                  
                  return (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{refId}</td>
                      <td className="py-3 px-4 text-sm">{getCustomerInfo(reservation.customerId)}</td>
                      <td className="py-3 px-4 text-sm">{getVehicleInfo(reservation.vehicleId)}</td>
                      <td className="py-3 px-4 text-sm">{startDateFormatted} - {endDateFormatted}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(reservation.status)}`}>
                          {getStatusLabel(reservation.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">{formatCurrency(reservation.totalAmount)}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" className={`text-secondary hover:text-blue-700 h-8 w-8 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !isDisabled && handleEditReservation(reservation)}
                            disabled={isDisabled}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800 h-8 w-8"
                            onClick={() => handleViewReservation(reservation)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800 h-8 w-8"
                            onClick={() => handleCreateInvoice(reservation)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    Aucune réservation ne correspond à vos critères de recherche
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredReservations.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredReservations.length)} sur {filteredReservations.length} réservations
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
      
      {/* Add Reservation Modal */}
      <ModalContainer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Nouvelle réservation"
      >
        <ReservationForm onSuccess={handleFormSuccess} />
      </ModalContainer>
      
      {/* Edit Reservation Modal */}
      <ModalContainer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier la réservation"
      >
        {selectedReservation && <ReservationForm reservation={selectedReservation} onSuccess={handleFormSuccess} />}
      </ModalContainer>
      
      {/* View Reservation Modal */}
      <ModalContainer
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Détails de la réservation"
      >
        {selectedReservation && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Véhicule</h3>
                <p>{getVehicleInfo(selectedReservation.vehicleId)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Client</h3>
                <p>{getCustomerInfo(selectedReservation.customerId)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date de début</h3>
                <p>{format(new Date(selectedReservation.startDate), 'PPP', { locale: fr })}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date de fin</h3>
                <p>{format(new Date(selectedReservation.endDate), 'PPP', { locale: fr })}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Montant total</h3>
                <p>{formatCurrency(selectedReservation.totalAmount)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                <p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedReservation.status)}`}>
                    {getStatusLabel(selectedReservation.status)}
                  </span>
                </p>
              </div>
            </div>
            
            {selectedReservation.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 whitespace-pre-wrap">{selectedReservation.notes}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Fermer
              </Button>
              <Button 
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleCreateInvoice(selectedReservation);
                }}
                className="bg-secondary hover:bg-blue-600"
              >
                Créer une facture
              </Button>
            </div>
          </div>
        )}
      </ModalContainer>
      
      {/* Create Invoice Modal */}
      <ModalContainer
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Créer une facture"
      >
        {selectedReservation && <InvoiceForm reservationId={selectedReservation.id} onSuccess={handleFormSuccess} />}
      </ModalContainer>
    </div>
  );
};

export default Reservations;
