// Client-side storage implementation
// All data is stored in localStorage for offline functionality

// Generic type for our store items
type StoreItem = {
  id: string | number;
  [key: string]: any;
};

// Generic CRUD operations for localStorage
export class LocalStorageService<T extends StoreItem> {
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  // Get all items
  getAll(): T[] {
    const items = localStorage.getItem(this.storageKey);
    return items ? JSON.parse(items) : [];
  }

  // Get a single item by id
  getById(id: string | number): T | undefined {
    const items = this.getAll();
    return items.find(item => item.id == id);
  }

  // Create a new item
  create(item: Omit<T, 'id'>): T {
    const items = this.getAll();
    
    // Generate new ID if one isn't provided
    const newItem = {
      ...item,
      id: item.id || Date.now().toString(),
    } as T;
    
    localStorage.setItem(this.storageKey, JSON.stringify([...items, newItem]));
    return newItem;
  }

  // Update an existing item
  update(id: string | number, item: Partial<T>): T | undefined {
    const items = this.getAll();
    const index = items.findIndex(i => i.id == id);
    
    if (index === -1) return undefined;
    
    const updatedItem = { ...items[index], ...item };
    items[index] = updatedItem;
    
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    return updatedItem;
  }

  // Delete an item
  delete(id: string | number): boolean {
    const items = this.getAll();
    const filteredItems = items.filter(item => item.id != id);
    
    if (filteredItems.length === items.length) return false;
    
    localStorage.setItem(this.storageKey, JSON.stringify(filteredItems));
    return true;
  }

  // Query items based on a filter function
  query(filterFn: (item: T) => boolean): T[] {
    const items = this.getAll();
    return items.filter(filterFn);
  }
}

// Types for our different stores
export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  fuelType: string;
  mileage: number;
  purchaseType: string;
  purchasePrice: number;
  monthlyPayment?: number;
  contractDuration?: number;
  dailyRate: number;
  status: 'available' | 'rented' | 'maintenance';
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  licenseNumber?: string; // Numéro de permis de conduire
  licenseIssueDate?: string; // Date d'émission du permis
  licenseExpiryDate?: string; // Date d'expiration du permis
  depositType?: 'vehicle' | 'cash' | 'creditCard' | 'bankTransfer' | 'check'; // Type de caution
  depositAmount?: number; // Montant de la caution
  depositReference?: string; // Référence de la caution (n° CB, n° chèque, etc.)
  notes?: string; // Notes supplémentaires sur le client
  createdAt: string;
}

export interface Reservation {
  id: string;
  vehicleId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  reservationId?: string;
  customerId: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  taxAmount: number;
  status: 'unpaid' | 'paid' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  relatedTo?: string;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  date: string;
  mileage: number;
  description: string;
  cost: number;
  provider?: string;
  invoiceReference?: string;
  notes?: string;
  createdAt: string;
}

export interface Settings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  vatNumber?: string;
  bankDetails?: string;
  logoUrl?: string;
  lastBackupDate?: string;
}

// Create storage services for each entity
export const vehicleStorage = new LocalStorageService<Vehicle>('carsmotion_vehicles');
export const customerStorage = new LocalStorageService<Customer>('carsmotion_customers');
export const reservationStorage = new LocalStorageService<Reservation>('carsmotion_reservations');
export const invoiceStorage = new LocalStorageService<Invoice>('carsmotion_invoices');
export const transactionStorage = new LocalStorageService<Transaction>('carsmotion_transactions');
export const maintenanceStorage = new LocalStorageService<MaintenanceRecord>('carsmotion_maintenance');

// Settings is a special case since there's only one record
export const getSettings = (): Settings => {
  const settings = localStorage.getItem('carsmotion_settings');
  return settings ? JSON.parse(settings) : null;
};

export const updateSettings = (settings: Settings): Settings => {
  localStorage.setItem('carsmotion_settings', JSON.stringify(settings));
  return settings;
};

// Backup/restore functionality
export const backupData = (): Record<string, any> => {
  const backup = {
    vehicles: vehicleStorage.getAll(),
    customers: customerStorage.getAll(),
    reservations: reservationStorage.getAll(),
    invoices: invoiceStorage.getAll(),
    transactions: transactionStorage.getAll(),
    maintenance: maintenanceStorage.getAll(),
    settings: getSettings(),
    backupDate: new Date().toISOString()
  };
  
  return backup;
};

export const restoreData = (data: Record<string, any>): boolean => {
  try {
    if (data.vehicles) localStorage.setItem('carsmotion_vehicles', JSON.stringify(data.vehicles));
    if (data.customers) localStorage.setItem('carsmotion_customers', JSON.stringify(data.customers));
    if (data.reservations) localStorage.setItem('carsmotion_reservations', JSON.stringify(data.reservations));
    if (data.invoices) localStorage.setItem('carsmotion_invoices', JSON.stringify(data.invoices));
    if (data.transactions) localStorage.setItem('carsmotion_transactions', JSON.stringify(data.transactions));
    if (data.maintenance) localStorage.setItem('carsmotion_maintenance', JSON.stringify(data.maintenance));
    if (data.settings) localStorage.setItem('carsmotion_settings', JSON.stringify(data.settings));
    
    // Update last backup date
    const settings = getSettings();
    updateSettings({
      ...settings,
      lastBackupDate: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error restoring data:', error);
    return false;
  }
};

// Reset all data (for testing or clearing app)
export const resetAllData = (): boolean => {
  try {
    localStorage.setItem('carsmotion_vehicles', JSON.stringify([]));
    localStorage.setItem('carsmotion_customers', JSON.stringify([]));
    localStorage.setItem('carsmotion_reservations', JSON.stringify([]));
    localStorage.setItem('carsmotion_invoices', JSON.stringify([]));
    localStorage.setItem('carsmotion_transactions', JSON.stringify([]));
    localStorage.setItem('carsmotion_maintenance', JSON.stringify([]));
    
    // Don't reset settings, just update the backup date
    const settings = getSettings();
    if (settings) {
      updateSettings({
        ...settings,
        lastBackupDate: new Date().toISOString()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error resetting data:', error);
    return false;
  }
};
