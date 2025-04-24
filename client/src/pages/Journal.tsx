import { useState, useEffect } from "react";
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Pencil,
  Trash2,
  Car
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatCard from "@/components/ui/StatCard";
import ModalContainer from "@/components/modals/ModalContainer";
import TransactionForm from "@/components/forms/TransactionForm";
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
import { transactionStorage, Transaction } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { generateMonthlyVehicleExpenses } from "@/lib/generateVehicleExpenses";

const Journal = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));
  
  const [stats, setStats] = useState({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyResult: 0
  });
  
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  
  // Get all categories for filter
  const [categories, setCategories] = useState<string[]>([]);
  
  // Load transactions from storage
  useEffect(() => {
    const loadTransactions = () => {
      const allTransactions = transactionStorage.getAll();
      setTransactions(allTransactions);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(allTransactions.map(t => t.category)));
      setCategories(uniqueCategories);
      
      // Calculate statistics
      calculateStats(allTransactions);
      
      applyFilters(allTransactions, searchQuery, typeFilter, categoryFilter, monthFilter);
    };
    
    loadTransactions();
  }, []);
  
  // Apply filters and search when query or filters change
  useEffect(() => {
    applyFilters(transactions, searchQuery, typeFilter, categoryFilter, monthFilter);
  }, [searchQuery, typeFilter, categoryFilter, monthFilter]);
  
  // Calculate financial statistics
  const calculateStats = (allTransactions: Transaction[]) => {
    // Current balance (sum of all transactions)
    const currentBalance = allTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
    
    // Get current month transactions
    const currentMonth = monthFilter || format(new Date(), 'yyyy-MM');
    const monthTransactions = allTransactions.filter(t => {
      const transMonth = format(new Date(t.date), 'yyyy-MM');
      return transMonth === currentMonth;
    });
    
    // Monthly income
    const monthlyIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Monthly expenses
    const monthlyExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Monthly result
    const monthlyResult = monthlyIncome - monthlyExpenses;
    
    setStats({
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlyResult
    });
  };
  
  // Apply filters and search to transactions
  const applyFilters = (
    allTransactions: Transaction[], 
    query: string, 
    type: string, 
    category: string,
    month: string
  ) => {
    let filtered = [...allTransactions];
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(lowerQuery) ||
        transaction.category.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply type filter
    if (type !== "all") {
      filtered = filtered.filter(transaction => transaction.type === type);
    }
    
    // Apply category filter
    if (category !== "all") {
      filtered = filtered.filter(transaction => transaction.category === category);
    }
    
    // Apply month filter
    if (month) {
      filtered = filtered.filter(transaction => {
        const transMonth = format(new Date(transaction.date), 'yyyy-MM');
        return transMonth === month;
      });
    }
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredTransactions(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };
  
  // Get paginated transactions
  const getPaginatedTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  };
  
  // Handle transaction operations
  const handleAddIncome = () => {
    setIsAddIncomeModalOpen(true);
  };
  
  const handleAddExpense = () => {
    setIsAddExpenseModalOpen(true);
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };
  
  const handleDeleteTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteTransaction = () => {
    if (selectedTransaction) {
      transactionStorage.delete(selectedTransaction.id);
      
      toast({
        title: "Transaction supprimée",
        description: "La transaction a été supprimée avec succès.",
      });
      
      // Refresh transaction list
      const allTransactions = transactionStorage.getAll();
      setTransactions(allTransactions);
      calculateStats(allTransactions);
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Handle form success
  const handleFormSuccess = () => {
    // Close modals
    setIsAddIncomeModalOpen(false);
    setIsAddExpenseModalOpen(false);
    setIsEditModalOpen(false);
    
    // Refresh transaction list
    const allTransactions = transactionStorage.getAll();
    setTransactions(allTransactions);
    calculateStats(allTransactions);
    
    // Extract unique categories
    const uniqueCategories = Array.from(new Set(allTransactions.map(t => t.category)));
    setCategories(uniqueCategories);
  };
  
  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };
  
  // Générer les dépenses mensuelles des véhicules
  const handleGenerateVehicleExpenses = () => {
    // Utiliser la date correspondant au mois sélectionné
    const selectedDate = new Date();
    if (monthFilter) {
      const [year, month] = monthFilter.split('-');
      selectedDate.setFullYear(parseInt(year));
      selectedDate.setMonth(parseInt(month) - 1);
    }
    
    const count = generateMonthlyVehicleExpenses(selectedDate);
    
    if (count > 0) {
      toast({
        title: "Dépenses générées",
        description: `${count} transactions de dépenses ont été générées avec succès.`,
      });
      
      // Actualiser les données
      const allTransactions = transactionStorage.getAll();
      setTransactions(allTransactions);
      calculateStats(allTransactions);
      
      // Extraire les catégories uniques
      const uniqueCategories = Array.from(new Set(allTransactions.map(t => t.category)));
      setCategories(uniqueCategories);
    } else {
      toast({
        title: "Aucune nouvelle dépense",
        description: "Toutes les dépenses pour ce mois ont déjà été générées ou aucun véhicule n'a de paiements mensuels.",
      });
    }
  };

  // Calculate running balance for each transaction in the view
  const getTransactionsWithBalance = () => {
    let runningBalance = stats.currentBalance;
    const transactionsWithBalance = getPaginatedTransactions().map(transaction => {
      if (transaction.type === 'expense') {
        runningBalance += transaction.amount;
      } else {
        runningBalance -= transaction.amount;
      }
      return { ...transaction, balance: runningBalance };
    });
    
    // Reverse the balance calculation to show it in descending date order
    let finalBalance = stats.currentBalance;
    return transactionsWithBalance.map(transaction => {
      return { ...transaction, balance: finalBalance };
    });
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Journal des opérations</h1>
          <p className="text-gray-600">Suivez toutes les recettes et dépenses</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleAddIncome} className="bg-success hover:bg-green-600">
            <ArrowDownLeft className="mr-2 h-4 w-4" /> Recette
          </Button>
          <Button onClick={handleAddExpense} className="bg-accent hover:bg-red-600">
            <ArrowUpRight className="mr-2 h-4 w-4" /> Dépense
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Solde courant"
          value={formatCurrency(stats.currentBalance)}
          icon={<Wallet />}
          iconBgColor="bg-blue-100"
          iconColor="text-secondary"
        />
        
        <StatCard
          title="Recettes (mois)"
          value={formatCurrency(stats.monthlyIncome)}
          icon={<TrendingUp />}
          iconBgColor="bg-green-100"
          iconColor="text-success"
          valueColor="text-success"
        />
        
        <StatCard
          title="Dépenses (mois)"
          value={formatCurrency(stats.monthlyExpenses)}
          icon={<TrendingDown />}
          iconBgColor="bg-red-100"
          iconColor="text-accent"
          valueColor="text-accent"
        />
        
        <StatCard
          title="Résultat (mois)"
          value={formatCurrency(stats.monthlyResult)}
          icon={<Calculator />}
          iconBgColor="bg-blue-100"
          iconColor="text-secondary"
          valueColor={stats.monthlyResult >= 0 ? "text-success" : "text-accent"}
        />
      </div>
      
      <div className="mb-4 flex justify-end">
        <Button 
          onClick={handleGenerateVehicleExpenses} 
          variant="outline" 
          className="text-secondary border-secondary hover:bg-secondary/10"
        >
          <Car className="mr-2 h-4 w-4" /> Générer les dépenses mensuelles des véhicules
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-lg font-heading font-semibold">Opérations</h2>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="income">Recettes</SelectItem>
                  <SelectItem value="expense">Dépenses</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-[180px]"
              />
              
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
                  Libellé
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Solde
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getTransactionsWithBalance().length > 0 ? (
                getTransactionsWithBalance().map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: fr })}</td>
                    <td className="py-3 px-4 text-sm">{transaction.description}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transaction.category === 'Locations' ? 'bg-green-100 text-success' :
                        transaction.category === 'Entretien' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.category === 'Carburant' ? 'bg-blue-100 text-blue-800' :
                        transaction.category === 'Assurance' ? 'bg-purple-100 text-purple-800' :
                        transaction.category === 'Taxes' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-medium ${transaction.type === 'income' ? 'text-success' : 'text-accent'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4 text-sm">{formatCurrency(transaction.balance)}</td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" className="text-secondary hover:text-blue-700 h-8 w-8"
                          onClick={() => handleEditTransaction(transaction)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-accent hover:text-red-700 h-8 w-8"
                          onClick={() => handleDeleteTransaction(transaction)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500">
                    Aucune opération ne correspond à vos critères de recherche
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {filteredTransactions.length > 0 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} sur {filteredTransactions.length} opérations
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
      
      {/* Add Income Modal */}
      <ModalContainer
        isOpen={isAddIncomeModalOpen}
        onClose={() => setIsAddIncomeModalOpen(false)}
        title="Ajouter une recette"
      >
        <TransactionForm type="income" onSuccess={handleFormSuccess} />
      </ModalContainer>
      
      {/* Add Expense Modal */}
      <ModalContainer
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        title="Ajouter une dépense"
      >
        <TransactionForm type="expense" onSuccess={handleFormSuccess} />
      </ModalContainer>
      
      {/* Edit Transaction Modal */}
      <ModalContainer
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Modifier ${selectedTransaction?.type === 'income' ? 'la recette' : 'la dépense'}`}
      >
        {selectedTransaction && (
          <TransactionForm transaction={selectedTransaction} onSuccess={handleFormSuccess} />
        )}
      </ModalContainer>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette opération ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La transaction sera définitivement supprimée du journal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTransaction} className="bg-accent hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Journal;
