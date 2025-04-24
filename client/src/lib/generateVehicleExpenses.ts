import { vehicleStorage, transactionStorage, Vehicle, Transaction } from "@/lib/storage";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Génère les dépenses mensuelles pour tous les véhicules (mensualités et assurances)
 * Cette fonction doit être appelée au début de chaque mois
 * @param date - Date pour laquelle générer les dépenses (par défaut, date actuelle)
 * @returns Le nombre de transactions générées
 */
export function generateMonthlyVehicleExpenses(date = new Date()): number {
  // Formater le mois actuel pour vérifier si des transactions existent déjà
  const currentMonth = format(date, 'yyyy-MM');
  // Formatage plus lisible pour les descriptions
  const readableMonth = format(date, 'MMMM yyyy', { locale: fr });
  
  // Récupérer tous les véhicules
  const vehicles = vehicleStorage.getAll();
  
  // Récupérer toutes les transactions
  const allTransactions = transactionStorage.getAll();
  
  let generatedCount = 0;
  
  // Pour chaque véhicule, vérifier s'il a des mensualités ou des frais d'assurance
  for (const vehicle of vehicles) {
    // 1. Gestion des mensualités
    if (vehicle.monthlyPayment && vehicle.monthlyPayment > 0) {
      // Vérifier si une transaction pour ce mois et ce véhicule existe déjà
      const existingPaymentTransaction = allTransactions.find(t => 
        t.type === 'expense' && 
        t.category === 'Mensualités véhicules' && 
        t.relatedTo === vehicle.id &&
        format(new Date(t.date), 'yyyy-MM') === currentMonth
      );
      
      // Si aucune transaction n'existe, en créer une nouvelle
      if (!existingPaymentTransaction) {
        transactionStorage.create({
          date: new Date(date).toISOString(),
          type: 'expense',
          category: 'Mensualités véhicules',
          amount: vehicle.monthlyPayment,
          description: `Mensualité ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}) - ${readableMonth}`,
          relatedTo: vehicle.id,
          createdAt: new Date().toISOString()
        });
        
        generatedCount++;
      }
    }
    
    // 2. Gestion des assurances
    if (vehicle.insuranceMonthlyFee && vehicle.insuranceMonthlyFee > 0) {
      // Vérifier si une transaction pour ce mois et ce véhicule existe déjà
      const existingInsuranceTransaction = allTransactions.find(t => 
        t.type === 'expense' && 
        t.category === 'Assurances véhicules' && 
        t.relatedTo === vehicle.id &&
        format(new Date(t.date), 'yyyy-MM') === currentMonth
      );
      
      // Si aucune transaction n'existe, en créer une nouvelle
      if (!existingInsuranceTransaction) {
        transactionStorage.create({
          date: new Date(date).toISOString(),
          type: 'expense',
          category: 'Assurances véhicules',
          amount: vehicle.insuranceMonthlyFee,
          description: `Assurance ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate}) - ${readableMonth}`,
          relatedTo: vehicle.id,
          createdAt: new Date().toISOString()
        });
        
        generatedCount++;
      }
    }
  }
  
  return generatedCount;
}

/**
 * Génère une transaction de dépense pour un enregistrement de maintenance
 * @param maintenanceId - ID de l'enregistrement de maintenance
 * @param vehicleId - ID du véhicule
 * @param description - Description de la maintenance
 * @param cost - Coût de la maintenance
 * @param date - Date de la maintenance
 * @returns La transaction créée
 */
export function generateMaintenanceExpense(
  maintenanceId: string,
  vehicleId: string,
  description: string,
  cost: number,
  date: string
): Transaction {
  // Récupérer les informations du véhicule
  const vehicle = vehicleStorage.getById(vehicleId);
  
  // Créer la transaction
  const transaction = transactionStorage.create({
    date: date,
    type: 'expense',
    category: 'Entretien véhicules',
    amount: cost,
    description: `${description} - ${vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})` : 'Véhicule inconnu'}`,
    relatedTo: maintenanceId,
    createdAt: new Date().toISOString()
  });
  
  return transaction;
}