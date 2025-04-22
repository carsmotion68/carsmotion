import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Pencil, 
  Eye, 
  Trash2,
  Drill, 
  AlertTriangle
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import MaintenanceForm from "@/components/forms/MaintenanceForm";
import { 
  maintenanceStorage, 
  vehicleStorage,
  MaintenanceRecord,
  Vehicle 
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

// Define maintenance alert thresholds (in days and kilometers)
const MAINTENANCE_THRESHOLDS = {
  service: {
    days: 180, // 6 months
    km: 10000
  },
  inspection: {
    days: 365, // 1 year
    km: 15000
  }
};

const Maintenance = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<MaintenanceRecord[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<{
    vehicle: Vehicle;
    service: boolean;
    inspection: boolean;
  }[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  
  // Load data
  useEffect(() => {
    const loadData = () => {
      const allRecords = maintenanceStorage.getAll();
      const allVehicles = vehicleStorage.getAll();
      
      setMaintenanceRecords(allRecords);
      setVehicles(allVehicles);
      
      // Check for maintenance alerts
      const alerts = [];
      
      for (const vehicle of allVehicles) {
        // Get maintenance records for this vehicle
        const vehicleRecords = allRecords.filter(r => r.vehicleId === vehicle.id);
        
        // Get last service and inspection
        const lastService = vehicleRecords
          .filter(r => r.type === "service")
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        const lastInspection = vehicleRecords
          .filter(r => r.type === "inspection")
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        
        // Check if service is needed
        let serviceNeeded = false;
        if (!lastService) {
          serviceNeeded = true;
        } else {
          const serviceDate = new Date(lastService.date);
          const nextServiceDate = addDays(serviceDate, MAINTENANCE_THRESHOLDS.service.days);
          const nextServiceKm = lastService.mileage + MAINTENANCE_THRESHOLDS.service.km;
          
          if (isBefore(nextServiceDate, new Date()) || vehicle.mileage >= nextServiceKm) {
            serviceNeeded = true;
          }
        }
        
        // Check if inspection is needed
        let inspectionNeeded = false;
        if (!lastInspection) {
          inspectionNeeded = true;
        } else {
          const inspectionDate = new Date(lastInspection.date);
          const nextInspectionDate = addDays(inspectionDate, MAINTENANCE_THRESHOLDS.inspection.days);
          const nextInspectionKm = lastInspection.mileage + MAINTENANCE_THRESHOLDS.inspection.km;
          
          if (isBefore(nextInspectionDate, new Date()) || vehicle.mileage >= nextInspectionKm) {
            inspectionNeeded = true;
          }
        }
        
        if (serviceNeeded || inspectionNeeded) {
          alerts.push({
            vehicle,
            service: serviceNeeded,
            inspection: inspectionNeeded
          });
        }
      }
      
      setMaintenanceAlerts(alerts);
      
      applyFilters(allRecords, searchQuery, typeFilter, vehicleFilter);
    };
    
    loadData();
  }, []);
  
  // Apply filters and search when query or filters change
  useEffect(() => {
    applyFilters(maintenanceRecords, searchQuery, typeFilter, vehicleFilter);
  }, [searchQuery, typeFilter, vehicleFilter]);
  
  // Apply filters and search to maintenance records
  const applyFilters = (
    allRecords: MaintenanceRecord[], 
    query: string, 
    type: string, 
    vehicleId: string
  ) => {
    let filtered = [...allRecords];
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(record => 
        record.description.toLowerCase().includes(lowerQuery) ||
        record.provider?.toLowerCase().includes(lowerQuery) ||
        record.invoiceReference?.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply type filter
    if (type !== "all") {
      filtered = filtered.filter(record => record.type === type);
    }
    
    // Apply vehicle filter
    if (vehicleId !== "all") {
      filtered = filtered.filter(record => record.vehicleId === vehicleId);
    }
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredRecords(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };
  
  // Get paginated records
  const getPaginatedRecords = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRecords.slice(startIndex, endIndex);
  };
  
  // Handle record operations
  const handleAddRecord = () => {
    setIsAddModalOpen(true);
  };
  
  const handleEditRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };
  
  const handleViewRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };
  
  const handleDeleteRecord = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteRecord = () => {
    if (selectedRecord) {
      maintenanceStorage.delete(selectedRecord.id);
      
      toast({
        title: "Enregistrement supprimé",
        description: "L'intervention a été supprimée avec succès."
      });
      
      // Refresh records
      const allRecords = maintenanceStorage.getAll();
      setMaintenanceRecords(allRecords);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    // Close modals
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    
    // Refresh records
    const allRecords = maintenanceStorage.getAll();
    setMaintenanceRecords(allRecords);
  };
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };
  
  // Helper functions
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : "Véhicule inconnu";
  };
  
  const getMaintenanceTypeLabel = (type: string) => {
    switch (type) {
      case "service":
        return "Entretien";
      case "repair":
        return "Réparation";
      case "inspection":
        return "Contrôle";
      default:
        return type;
    }
  };
  
  const getMaintenanceTypeClass = (type: string) => {
    switch (type) {
      case "service":
        return "bg-blue-100 text-blue-800";
      case "repair":
        return "bg-red-100 text-red-800";
      case "inspection":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Maintenance</h1>
          <p className="text-gray-600">Suivi des entretiens et réparations de véhicules</p>
        </div>
        <Button onClick={handleAddRecord} className="bg-secondary hover:bg-blue-600">
          <Plus className="mr-2 h-4 w-4" /> Ajouter une intervention
        </Button>
      </div>
      
      {maintenanceAlerts.length > 0 && (
        <div className="mb-6">
          <Card className="border-warning bg-yellow-50">
            <CardContent className="p-5">
              <div className="flex items-start space-x-4">
                <div className="rounded-full bg-yellow-100 p-2">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-heading font-semibold mb-2">Alertes de maintenance</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Des interventions sont à prévoir pour {maintenanceAlerts.length} véhicule(s)
                  </p>
                  <div className="space-y-3">
                    {maintenanceAlerts.map((alert, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">
                              {alert.vehicle.make} {alert.vehicle.model} ({alert.vehicle.licensePlate})
                            </p>
                            <div className="mt-1 space-x-2">
                              {alert.service && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                  Entretien à prévoir
                                </Badge>
                              )}
                              {alert.inspection && (
                                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                                  Contrôle à prévoir
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Kilométrage actuel: {alert.vehicle.mileage.toLocaleString()} km
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-heading font-semibold">Historique de maintenance</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="service">Entretien</SelectItem>
                  <SelectItem value="repair">Réparation</SelectItem>
                  <SelectItem value="inspection">Contrôle</SelectItem>
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
                  Date
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kilométrage
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coût
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getPaginatedRecords().length > 0 ? (
                getPaginatedRecords().map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm">{format(new Date(record.date), 'dd/MM/yyyy', { locale: fr })}</td>
                    <td className="py-4 px-4 text-sm">{getVehicleInfo(record.vehicleId)}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getMaintenanceTypeClass(record.type)}`}>
                        {getMaintenanceTypeLabel(record.type)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm">{record.description}</td>
                    <td className="py-4 px-4 text-sm">{record.mileage.toLocaleString()} km</td>
                    <td className="py-4 px-4 font-medium">{formatCurrency(record.cost)}</td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="text-secondary hover:text-blue-700 h-8 w-8"
                          onClick={() => handleEditRecord(record)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-800 h-8 w-8"
                          onClick={() => handleViewRecord(record)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-accent hover:text-red-700 h-8 w-8"
                          onClick={() => handleDeleteRecord(record)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    Aucune intervention ne correspond à vos critères de recherche
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredRecords.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredRecords.length)} sur {filteredRecords.length} interventions
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
      
      {/* Add Maintenance Record Modal */}
      <ModalContainer
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter une intervention"
      >
        <MaintenanceForm onSuccess={handleFormSuccess} />
      </ModalContainer>
      
      {/* Edit Maintenance Record Modal */}
      <ModalContainer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier l'intervention"
      >
        {selectedRecord && <MaintenanceForm record={selectedRecord} onSuccess={handleFormSuccess} />}
      </ModalContainer>
      
      {/* View Maintenance Record Modal */}
      <ModalContainer
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Détails de l'intervention"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Véhicule</h3>
                <p>{getVehicleInfo(selectedRecord.vehicleId)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Type</h3>
                <p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getMaintenanceTypeClass(selectedRecord.type)}`}>
                    {getMaintenanceTypeLabel(selectedRecord.type)}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p>{format(new Date(selectedRecord.date), 'PPP', { locale: fr })}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Kilométrage</h3>
                <p>{selectedRecord.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Coût</h3>
                <p>{formatCurrency(selectedRecord.cost)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Prestataire</h3>
                <p>{selectedRecord.provider || "-"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Référence facture</h3>
                <p>{selectedRecord.invoiceReference || "-"}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1 whitespace-pre-wrap">{selectedRecord.description}</p>
            </div>
            
            {selectedRecord.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 whitespace-pre-wrap">{selectedRecord.notes}</p>
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
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette intervention ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'intervention sera définitivement supprimée des registres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRecord} className="bg-accent hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Maintenance;
