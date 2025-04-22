import { useState, useEffect } from "react";
import { 
  Car, 
  Plus, 
  Search, 
  Pencil, 
  Eye, 
  Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ModalContainer from "@/components/modals/ModalContainer";
import VehicleForm from "@/components/forms/VehicleForm";
import { vehicleStorage, Vehicle } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const Fleet = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [makeFilter, setMakeFilter] = useState("all");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("all");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  
  // Get all vehicle makes for filter
  const uniqueMakes = [...new Set(vehicles.map(vehicle => vehicle.make))];
  
  // Get all fuel types for filter
  const uniqueFuelTypes = [...new Set(vehicles.map(vehicle => vehicle.fuelType))];
  
  // Load vehicles from storage
  useEffect(() => {
    const loadVehicles = () => {
      const allVehicles = vehicleStorage.getAll();
      setVehicles(allVehicles);
      applyFilters(allVehicles, searchQuery, statusFilter, makeFilter, fuelTypeFilter);
    };
    
    loadVehicles();
  }, []);
  
  // Apply filters and search when query or filters change
  useEffect(() => {
    applyFilters(vehicles, searchQuery, statusFilter, makeFilter, fuelTypeFilter);
  }, [searchQuery, statusFilter, makeFilter, fuelTypeFilter]);
  
  // Apply filters and search to vehicles
  const applyFilters = (
    allVehicles: Vehicle[], 
    query: string, 
    status: string, 
    make: string, 
    fuelType: string
  ) => {
    let filtered = [...allVehicles];
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.make.toLowerCase().includes(lowerQuery) ||
        vehicle.model.toLowerCase().includes(lowerQuery) ||
        vehicle.licensePlate.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(vehicle => vehicle.status === status);
    }
    
    // Apply make filter
    if (make !== "all") {
      filtered = filtered.filter(vehicle => vehicle.make === make);
    }
    
    // Apply fuel type filter
    if (fuelType !== "all") {
      filtered = filtered.filter(vehicle => vehicle.fuelType === fuelType);
    }
    
    setFilteredVehicles(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };
  
  // Get paginated vehicles
  const getPaginatedVehicles = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVehicles.slice(startIndex, endIndex);
  };
  
  // Handle vehicle operations
  const handleAddVehicle = () => {
    setIsAddModalOpen(true);
  };
  
  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsEditModalOpen(true);
  };
  
  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewModalOpen(true);
  };
  
  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteVehicle = () => {
    if (selectedVehicle) {
      vehicleStorage.delete(selectedVehicle.id);
      
      toast({
        title: "Véhicule supprimé",
        description: `${selectedVehicle.make} ${selectedVehicle.model} a été supprimé avec succès.`,
      });
      
      // Refresh vehicle list
      setVehicles(vehicleStorage.getAll());
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    // Close modals
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    
    // Refresh vehicle list
    setVehicles(vehicleStorage.getAll());
  };
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "rented":
        return "Loué";
      case "maintenance":
        return "Maintenance";
      default:
        return status;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-success";
      case "rented":
        return "bg-red-100 text-accent";
      case "maintenance":
        return "bg-yellow-100 text-warning";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Gestion de la flotte</h1>
          <p className="text-gray-600">Gérez tous vos véhicules disponibles</p>
        </div>
        <Button onClick={handleAddVehicle} className="bg-secondary hover:bg-blue-600">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un véhicule
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-grow">
              <Input
                type="text"
                placeholder="Rechercher un véhicule..."
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
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="rented">Loué</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={makeFilter} onValueChange={setMakeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Toutes les marques" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les marques</SelectItem>
                  {uniqueMakes.map(make => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={fuelTypeFilter} onValueChange={setFuelTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {uniqueFuelTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Immatriculation
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kilométrage
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix journalier
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getPaginatedVehicles().length > 0 ? (
                getPaginatedVehicles().map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center mr-3">
                          <Car className="text-secondary h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-gray-500">{vehicle.year} • {vehicle.fuelType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm">{vehicle.licensePlate}</td>
                    <td className="py-4 px-4 text-sm">{vehicle.mileage.toLocaleString()} km</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(vehicle.status)}`}>
                        {getStatusLabel(vehicle.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium">{formatCurrency(vehicle.dailyRate)}</td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="text-secondary hover:text-blue-700 h-8 w-8"
                          onClick={() => handleEditVehicle(vehicle)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800 h-8 w-8"
                          onClick={() => handleViewVehicle(vehicle)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-accent hover:text-red-700 h-8 w-8"
                          onClick={() => handleDeleteVehicle(vehicle)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Aucun véhicule ne correspond à vos critères de recherche
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredVehicles.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredVehicles.length)} sur {filteredVehicles.length} véhicules
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
      
      {/* Add Vehicle Modal */}
      <ModalContainer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un véhicule"
      >
        <VehicleForm onSuccess={handleFormSuccess} />
      </ModalContainer>
      
      {/* Edit Vehicle Modal */}
      <ModalContainer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier un véhicule"
      >
        {selectedVehicle && <VehicleForm vehicle={selectedVehicle} onSuccess={handleFormSuccess} />}
      </ModalContainer>
      
      {/* View Vehicle Modal */}
      <ModalContainer
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Détails du véhicule"
      >
        {selectedVehicle && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Marque</h3>
                <p>{selectedVehicle.make}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Modèle</h3>
                <p>{selectedVehicle.model}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Année</h3>
                <p>{selectedVehicle.year}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Immatriculation</h3>
                <p>{selectedVehicle.licensePlate}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type de carburant</h3>
                <p>{selectedVehicle.fuelType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Kilométrage</h3>
                <p>{selectedVehicle.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type d'achat</h3>
                <p>{selectedVehicle.purchaseType}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Prix d'achat</h3>
                <p>{formatCurrency(selectedVehicle.purchasePrice)}</p>
              </div>
              {selectedVehicle.monthlyPayment && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Mensualité</h3>
                  <p>{formatCurrency(selectedVehicle.monthlyPayment)}</p>
                </div>
              )}
              {selectedVehicle.contractDuration && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Durée contrat</h3>
                  <p>{selectedVehicle.contractDuration} mois</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Prix journalier location</h3>
                <p>{formatCurrency(selectedVehicle.dailyRate)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                <p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusClass(selectedVehicle.status)}`}>
                    {getStatusLabel(selectedVehicle.status)}
                  </span>
                </p>
              </div>
            </div>
            
            {selectedVehicle.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 whitespace-pre-wrap">{selectedVehicle.notes}</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </ModalContainer>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce véhicule ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à ce véhicule ({selectedVehicle?.make} {selectedVehicle?.model}) seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVehicle} className="bg-accent hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Fleet;
