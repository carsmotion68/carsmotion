import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { transactionStorage, Transaction } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";

type DailyBalance = {
  date: Date;
  income: number;
  expense: number;
  balance: number;
  cumulativeBalance: number;
  transactions: Transaction[];
};

const CashBook = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [dailyBalances, setDailyBalances] = useState<DailyBalance[]>([]);
  const [monthlyBalance, setMonthlyBalance] = useState({ 
    income: 0, 
    expense: 0, 
    balance: 0,
    previousBalance: 0, 
    totalBalance: 0 
  });
  
  // Load transactions
  useEffect(() => {
    calculateDailyBalances();
  }, [selectedMonth]);

  // Calculate daily balances for the selected month
  const calculateDailyBalances = () => {
    const allTransactions = transactionStorage.getAll();
    
    // Get month range
    const monthDate = new Date(selectedMonth);
    const startDate = startOfMonth(monthDate);
    const endDate = endOfMonth(monthDate);
    const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Calculate previous months balance
    const previousBalance = allTransactions
      .filter(t => new Date(t.date) < startDate)
      .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0);
    
    // Calculate daily balances
    let runningBalance = previousBalance;
    const days: DailyBalance[] = [];
    
    daysInMonth.forEach(date => {
      const dayTransactions = allTransactions.filter(t => {
        const transDate = new Date(t.date);
        return transDate.getDate() === date.getDate() && 
               transDate.getMonth() === date.getMonth() && 
               transDate.getFullYear() === date.getFullYear();
      });
      
      const dayIncome = dayTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayExpense = dayTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayBalance = dayIncome - dayExpense;
      runningBalance += dayBalance;
      
      days.push({
        date,
        income: dayIncome,
        expense: dayExpense,
        balance: dayBalance,
        cumulativeBalance: runningBalance,
        transactions: dayTransactions
      });
    });
    
    setDailyBalances(days);
    
    // Calculate monthly totals
    const monthIncome = days.reduce((sum, day) => sum + day.income, 0);
    const monthExpense = days.reduce((sum, day) => sum + day.expense, 0);
    const monthBalance = monthIncome - monthExpense;
    
    setMonthlyBalance({
      income: monthIncome,
      expense: monthExpense,
      balance: monthBalance,
      previousBalance: previousBalance,
      totalBalance: previousBalance + monthBalance
    });
  };
  
  // Handle month navigation
  const prevMonth = () => {
    const current = new Date(selectedMonth);
    current.setMonth(current.getMonth() - 1);
    setSelectedMonth(format(current, 'yyyy-MM'));
  };
  
  const nextMonth = () => {
    const current = new Date(selectedMonth);
    current.setMonth(current.getMonth() + 1);
    setSelectedMonth(format(current, 'yyyy-MM'));
  };
  
  // Export cash book to CSV
  const exportToCsv = () => {
    const headers = ["Date", "Recettes", "Dépenses", "Solde du jour", "Solde cumulé"];
    const rows = dailyBalances.map(day => [
      format(day.date, 'dd/MM/yyyy'),
      day.income.toFixed(2),
      day.expense.toFixed(2),
      day.balance.toFixed(2),
      day.cumulativeBalance.toFixed(2)
    ]);
    
    // Add monthly summary
    rows.push([]);
    rows.push(["Solde début de mois", monthlyBalance.previousBalance.toFixed(2), "", "", ""]);
    rows.push(["Total recettes", monthlyBalance.income.toFixed(2), "", "", ""]);
    rows.push(["Total dépenses", monthlyBalance.expense.toFixed(2), "", "", ""]);
    rows.push(["Solde du mois", monthlyBalance.balance.toFixed(2), "", "", ""]);
    rows.push(["Solde fin de mois", monthlyBalance.totalBalance.toFixed(2), "", "", ""]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `livre-caisse-${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Livre de caisse</h1>
          <p className="text-gray-600">Suivi des soldes journaliers et mensuels</p>
        </div>
        <Button onClick={exportToCsv} variant="outline" className="flex items-center">
          <Download className="mr-2 h-4 w-4" /> Exporter CSV
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-heading font-semibold">
              Livre de caisse
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4 opacity-50" />
                <Select
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                >
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue placeholder={format(new Date(selectedMonth), 'MMMM yyyy', { locale: fr })} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {Array.from({ length: 12 }).map((_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const value = format(date, 'yyyy-MM');
                      return (
                        <SelectItem key={value} value={value}>
                          {format(date, 'MMMM yyyy', { locale: fr })}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-left font-medium text-gray-700">Date</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Recettes</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Dépenses</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Solde du jour</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-700">Solde cumulé</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyBalances.map((day, index) => (
                    <tr 
                      key={index} 
                      className={`border-b border-gray-100 ${isToday(day.date) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        {format(day.date, 'dd/MM/yyyy', { locale: fr })}
                        {isToday(day.date) && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Aujourd'hui
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-success font-medium">
                        {day.income > 0 ? formatCurrency(day.income) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right text-accent font-medium">
                        {day.expense > 0 ? formatCurrency(day.expense) : '-'}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${day.balance >= 0 ? 'text-success' : 'text-accent'}`}>
                        {formatCurrency(day.balance)}
                      </td>
                      <td className={`py-3 px-4 text-right font-medium ${day.cumulativeBalance >= 0 ? 'text-success' : 'text-accent'}`}>
                        {formatCurrency(day.cumulativeBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-3 px-4 font-medium">Solde début de mois</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className={`py-3 px-4 text-right font-medium ${monthlyBalance.previousBalance >= 0 ? 'text-success' : 'text-accent'}`}>
                      {formatCurrency(monthlyBalance.previousBalance)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Total recettes</td>
                    <td className="py-3 px-4 text-right text-success font-medium">
                      {formatCurrency(monthlyBalance.income)}
                    </td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Total dépenses</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-right text-accent font-medium">
                      {formatCurrency(monthlyBalance.expense)}
                    </td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Solde du mois</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className={`py-3 px-4 text-right font-medium ${monthlyBalance.balance >= 0 ? 'text-success' : 'text-accent'}`}>
                      {formatCurrency(monthlyBalance.balance)}
                    </td>
                    <td className="py-3 px-4"></td>
                  </tr>
                  <tr className="border-t border-gray-200 font-bold">
                    <td className="py-3 px-4">Solde fin de mois</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className={`py-3 px-4 text-right ${monthlyBalance.totalBalance >= 0 ? 'text-success' : 'text-accent'}`}>
                      {formatCurrency(monthlyBalance.totalBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-heading font-semibold">Détails du mois</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Solde de début</h3>
              <p className={`text-2xl font-bold ${monthlyBalance.previousBalance >= 0 ? 'text-success' : 'text-accent'}`}>
                {formatCurrency(monthlyBalance.previousBalance)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Recettes</h3>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(monthlyBalance.income)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Dépenses</h3>
              <p className="text-2xl font-bold text-accent">
                {formatCurrency(monthlyBalance.expense)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Solde du mois</h3>
              <p className={`text-2xl font-bold ${monthlyBalance.balance >= 0 ? 'text-success' : 'text-accent'}`}>
                {formatCurrency(monthlyBalance.balance)}
              </p>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Solde de fin</h3>
              <p className={`text-3xl font-bold ${monthlyBalance.totalBalance >= 0 ? 'text-success' : 'text-accent'}`}>
                {formatCurrency(monthlyBalance.totalBalance)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashBook;
