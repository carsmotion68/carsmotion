import { useState, useEffect } from "react";
import { 
  format, 
  startOfYear, 
  endOfYear, 
  eachMonthOfInterval, 
  isSameMonth,
  startOfMonth,
  endOfMonth,
  getYear,
  subYears
} from "date-fns";
import { fr } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Download,
  Calendar as CalendarIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { transactionStorage, Transaction } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";

type MonthlyData = {
  month: string;
  name: string;
  income: number;
  expense: number;
  balance: number;
};

type CategoryData = {
  name: string;
  value: number;
  percentage: number;
};

const COLORS = ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#34495E', '#D35400', '#16A085', '#7F8C8D'];

const Accounting = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState("overview");
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearTotals, setYearTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [years, setYears] = useState<string[]>([]);
  
  // Load transactions and calculate data
  useEffect(() => {
    // Get all available years from transactions
    const allTransactions = transactionStorage.getAll();
    
    if (allTransactions.length > 0) {
      const transactionYears = [...new Set(
        allTransactions.map(t => getYear(new Date(t.date)).toString())
      )].sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending
      
      // Make sure current year is included
      const currentYear = new Date().getFullYear().toString();
      if (!transactionYears.includes(currentYear)) {
        transactionYears.unshift(currentYear);
      }
      
      setYears(transactionYears);
    } else {
      // Default to last 5 years if no transactions
      const currentYear = new Date().getFullYear();
      setYears(
        Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())
      );
    }
    
    calculateYearlyData();
  }, [selectedYear]);
  
  // Calculate data for the selected year
  const calculateYearlyData = () => {
    const allTransactions = transactionStorage.getAll();
    
    // Filter transactions for selected year
    const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
    const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
    
    const yearTransactions = allTransactions.filter(t => {
      const date = new Date(t.date);
      return date >= yearStart && date <= yearEnd;
    });
    
    // Calculate monthly data
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    const monthData = months.map(month => {
      const monthName = format(month, 'MMMM', { locale: fr });
      const monthKey = format(month, 'yyyy-MM');
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = yearTransactions.filter(t => {
        const date = new Date(t.date);
        return date >= monthStart && date <= monthEnd;
      });
      
      const income = monthTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: monthKey,
        name: monthName,
        income,
        expense,
        balance: income - expense
      };
    });
    
    setMonthlyData(monthData);
    
    // Calculate year totals
    const totalIncome = monthData.reduce((sum, month) => sum + month.income, 0);
    const totalExpense = monthData.reduce((sum, month) => sum + month.expense, 0);
    
    setYearTotals({
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense
    });
    
    // Calculate income categories
    const incomeByCategory = yearTransactions
      .filter(t => t.type === "income")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const incomeCategoryData = Object.entries(incomeByCategory).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalIncome) * 100
    }));
    
    setIncomeCategories(incomeCategoryData.sort((a, b) => b.value - a.value));
    
    // Calculate expense categories
    const expenseByCategory = yearTransactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    
    const expenseCategoryData = Object.entries(expenseByCategory).map(([name, value]) => ({
      name,
      value,
      percentage: (value / totalExpense) * 100
    }));
    
    setExpenseCategories(expenseCategoryData.sort((a, b) => b.value - a.value));
  };
  
  // Export data to CSV
  const exportToCsv = () => {
    const headers = ["Mois", "Recettes", "Dépenses", "Solde"];
    const rows = monthlyData.map(month => [
      month.name,
      month.income.toFixed(2),
      month.expense.toFixed(2),
      month.balance.toFixed(2)
    ]);
    
    // Add yearly totals
    rows.push([]);
    rows.push(["Total", yearTotals.income.toFixed(2), yearTotals.expense.toFixed(2), yearTotals.balance.toFixed(2)]);
    
    // Add category breakdown
    rows.push([]);
    rows.push(["Recettes par catégorie"]);
    rows.push(["Catégorie", "Montant", "Pourcentage"]);
    incomeCategories.forEach(cat => {
      rows.push([cat.name, cat.value.toFixed(2), `${cat.percentage.toFixed(2)}%`]);
    });
    
    rows.push([]);
    rows.push(["Dépenses par catégorie"]);
    rows.push(["Catégorie", "Montant", "Pourcentage"]);
    expenseCategories.forEach(cat => {
      rows.push([cat.name, cat.value.toFixed(2), `${cat.percentage.toFixed(2)}%`]);
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `bilan-comptable-${selectedYear}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
          <p className="font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
          <p className="font-bold">{payload[0].name}</p>
          <p>{formatCurrency(payload[0].value)}</p>
          <p>{`${payload[0].payload.percentage.toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary">Bilan comptable</h1>
          <p className="text-gray-600">Synthèse financière mensuelle et annuelle</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={selectedYear} />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportToCsv} variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" /> Exporter CSV
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Recettes annuelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(yearTotals.income)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Dépenses annuelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(yearTotals.expense)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Résultat annuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${yearTotals.balance >= 0 ? 'text-success' : 'text-accent'}`}>
              {formatCurrency(yearTotals.balance)}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="income">Recettes</TabsTrigger>
          <TabsTrigger value="expenses">Dépenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Évolution mensuelle</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar name="Recettes" dataKey="income" fill="#2ECC71" />
                  <Bar name="Dépenses" dataKey="expense" fill="#E74C3C" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Résultat mensuel</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar name="Résultat" dataKey="balance" fill="#3498DB" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Détails mensuels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-left font-medium text-gray-700">Mois</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-700">Recettes</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-700">Dépenses</th>
                        <th className="py-3 px-4 text-right font-medium text-gray-700">Résultat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((month, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4">{month.name}</td>
                          <td className="py-3 px-4 text-right text-success">
                            {formatCurrency(month.income)}
                          </td>
                          <td className="py-3 px-4 text-right text-accent">
                            {formatCurrency(month.expense)}
                          </td>
                          <td className={`py-3 px-4 text-right ${month.balance >= 0 ? 'text-success' : 'text-accent'}`}>
                            {formatCurrency(month.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t-2 border-gray-200 font-bold">
                        <td className="py-3 px-4">Total</td>
                        <td className="py-3 px-4 text-right text-success">
                          {formatCurrency(yearTotals.income)}
                        </td>
                        <td className="py-3 px-4 text-right text-accent">
                          {formatCurrency(yearTotals.expense)}
                        </td>
                        <td className={`py-3 px-4 text-right ${yearTotals.balance >= 0 ? 'text-success' : 'text-accent'}`}>
                          {formatCurrency(yearTotals.balance)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des recettes</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  {incomeCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {incomeCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des dépenses</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  {expenseCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseCategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {expenseCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      Aucune donnée disponible
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="income" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Évolution des recettes</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar name="Recettes" dataKey="income" fill="#2ECC71" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {incomeCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeCategories}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                      >
                        {incomeCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Détail des recettes par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Catégorie</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-700">Montant</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-700">Pourcentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeCategories.map((category, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            {category.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-success font-medium">
                          {formatCurrency(category.value)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {category.percentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="border-t-2 border-gray-200 font-bold">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right text-success">
                        {formatCurrency(yearTotals.income)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Évolution des dépenses</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar name="Dépenses" dataKey="expense" fill="#E74C3C" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {expenseCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategories}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                      >
                        {expenseCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Aucune donnée disponible
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Détail des dépenses par catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Catégorie</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-700">Montant</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-700">Pourcentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseCategories.map((category, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            {category.name}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-accent font-medium">
                          {formatCurrency(category.value)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {category.percentage.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr className="border-t-2 border-gray-200 font-bold">
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-4 text-right text-accent">
                        {formatCurrency(yearTotals.expense)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Accounting;
