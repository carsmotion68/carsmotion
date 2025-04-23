import { useState, useEffect } from 'react';
import { 
  Vehicle, 
  Customer, 
  Reservation, 
  Invoice, 
  Transaction, 
  MaintenanceRecord,
  vehicleStorage, 
  customerStorage, 
  reservationStorage, 
  invoiceStorage, 
  transactionStorage, 
  maintenanceStorage 
} from '@/lib/storage';

// Intervalle en millisecondes pour vérifier les mises à jour
const REFRESH_INTERVAL = 3000;

/**
 * Hook personnalisé pour récupérer des données en temps réel avec actualisation automatique
 * @param storageKey - Type de données à surveiller, 'all' pour surveiller toutes les données
 */
export function useRealtimeData<T>(
  storageKey: 'vehicles' | 'customers' | 'reservations' | 'invoices' | 'transactions' | 'maintenance' | 'all'
): {
  data: {
    vehicles: Vehicle[];
    customers: Customer[];
    reservations: Reservation[];
    invoices: Invoice[];
    transactions: Transaction[];
    maintenance: MaintenanceRecord[];
  };
  refreshData: () => void;
  isLoading: boolean;
} {
  const [data, setData] = useState<{
    vehicles: Vehicle[];
    customers: Customer[];
    reservations: Reservation[];
    invoices: Invoice[];
    transactions: Transaction[];
    maintenance: MaintenanceRecord[];
  }>({
    vehicles: [],
    customers: [],
    reservations: [],
    invoices: [],
    transactions: [],
    maintenance: [],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const refreshData = () => {
    // Marquer le début du chargement
    setIsLoading(true);
    
    // Récupérer les données actuelles
    const vehicles = vehicleStorage.getAll();
    const customers = customerStorage.getAll();
    const reservations = reservationStorage.getAll();
    const invoices = invoiceStorage.getAll();
    const transactions = transactionStorage.getAll();
    const maintenance = maintenanceStorage.getAll();
    
    // Mettre à jour l'état
    setData({
      vehicles,
      customers,
      reservations,
      invoices,
      transactions,
      maintenance,
    });
    
    // Marquer la fin du chargement
    setIsLoading(false);
    setLastUpdate(Date.now());
  };

  // Effet pour charger les données au montage du composant
  useEffect(() => {
    refreshData();
  }, []);

  // Effet pour rafraîchir les données à intervalle régulier
  useEffect(() => {
    // Pas besoin de rafraîchissement continu si on surveille une modification spécifique
    if (storageKey === 'all') {
      const intervalId = setInterval(() => {
        refreshData();
      }, REFRESH_INTERVAL);
      
      return () => clearInterval(intervalId);
    }
  }, [storageKey]);

  return { data, refreshData, isLoading };
}

/**
 * Fonction utilitaire pour obtenir les données associées à un élément
 * (par exemple, obtenir le véhicule et le client associés à une réservation)
 */
export function getRelatedData(data: {
  vehicles: Vehicle[];
  customers: Customer[];
  reservations: Reservation[];
  invoices: Invoice[];
  transactions: Transaction[];
  maintenance: MaintenanceRecord[];
}) {
  return {
    getVehicle: (vehicleId: string): Vehicle | undefined => {
      return data.vehicles.find((v) => v.id === vehicleId);
    },
    
    getCustomer: (customerId: string): Customer | undefined => {
      return data.customers.find((c) => c.id === customerId);
    },
    
    getReservation: (reservationId: string): Reservation | undefined => {
      return data.reservations.find((r) => r.id === reservationId);
    },
    
    getInvoice: (invoiceId: string): Invoice | undefined => {
      return data.invoices.find((i) => i.id === invoiceId);
    },
    
    getReservationsByVehicle: (vehicleId: string): Reservation[] => {
      return data.reservations.filter((r) => r.vehicleId === vehicleId);
    },
    
    getInvoicesByCustomer: (customerId: string): Invoice[] => {
      return data.invoices.filter((i) => i.customerId === customerId);
    },
    
    getMaintenanceByVehicle: (vehicleId: string): MaintenanceRecord[] => {
      return data.maintenance.filter((m) => m.vehicleId === vehicleId);
    },
    
    getActiveReservations: (): Reservation[] => {
      const now = new Date();
      return data.reservations.filter(
        (r) => r.status === 'confirmed' && new Date(r.endDate) >= now
      );
    },
    
    getUnpaidInvoices: (): Invoice[] => {
      return data.invoices.filter((i) => i.status === 'unpaid');
    },
    
    // Utilitaire pour les métadonnées de réservation avec détails du véhicule et du client
    getReservationDetails: (reservationId: string) => {
      const reservation = data.reservations.find((r) => r.id === reservationId);
      if (!reservation) return null;
      
      const vehicle = data.vehicles.find((v) => v.id === reservation.vehicleId);
      const customer = data.customers.find((c) => c.id === reservation.customerId);
      
      return {
        reservation,
        vehicle,
        customer,
      };
    },
    
    // Utilitaire pour les métadonnées de facture avec détails de la réservation, du véhicule et du client
    getInvoiceDetails: (invoiceId: string) => {
      const invoice = data.invoices.find((i) => i.id === invoiceId);
      if (!invoice) return null;
      
      const customer = data.customers.find((c) => c.id === invoice.customerId);
      let reservation: Reservation | undefined;
      let vehicle: Vehicle | undefined;
      
      if (invoice.reservationId) {
        reservation = data.reservations.find((r) => r.id === invoice.reservationId);
        if (reservation) {
          vehicle = data.vehicles.find((v) => v.id === reservation?.vehicleId);
        }
      }
      
      return {
        invoice,
        customer,
        reservation,
        vehicle,
      };
    }
  };
}