import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy', { locale: fr });
}

export function parseDate(dateString: string): Date | null {
  // Try to parse from dd/MM/yyyy format
  const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
  if (isValid(parsedDate)) {
    return parsedDate;
  }
  
  // If the above fails, try ISO format
  const isoDate = new Date(dateString);
  return isValid(isoDate) ? isoDate : null;
}

export function calculateDuration(startDate: Date | string, endDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Calculate the difference in milliseconds
  const differenceMs = end.getTime() - start.getTime();
  
  // Convert milliseconds to days
  const days = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
  
  return days;
}

export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function generateInvoiceNumber(): string {
  const prefix = "FACT";
  const year = new Date().getFullYear();
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${randomPart}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

// Get status color based on status string
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    // Vehicle statuses
    'available': 'bg-green-100 text-success',
    'rented': 'bg-red-100 text-accent',
    'maintenance': 'bg-yellow-100 text-warning',
    
    // Reservation statuses
    'pending': 'bg-yellow-100 text-warning',
    'confirmed': 'bg-green-100 text-success',
    'completed': 'bg-gray-100 text-gray-600',
    'cancelled': 'bg-gray-100 text-gray-600',
    
    // Invoice statuses
    'paid': 'bg-green-100 text-success',
    'unpaid': 'bg-yellow-100 text-warning',
    
    // Default
    'default': 'bg-gray-100 text-gray-600'
  };
  
  return statusMap[status.toLowerCase()] || statusMap.default;
}

// Function to download data as a JSON file for backup
export function downloadDataAsJson(filename: string, data: any): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Function to read a JSON file for restore
export async function readJsonFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}
