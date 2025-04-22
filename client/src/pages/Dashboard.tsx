import { useState, useEffect } from "react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Car,
  CalendarCheck,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/ui/StatCard";

import {
  vehicleStorage,
  reservationStorage,
  invoiceStorage,
  transactionStorage,
  maintenanceStorage,
  Vehicle,
  Reservation,
  Transaction,
} from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    activeReservations: 0,
    monthlyRevenue: 0,
    maintenanceAlerts: 0,
  });

  const [revenueData, setRevenueData] = useState<{name: string, amount: number}[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<Array<Reservation & {vehicle: Vehicle}>>([]);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Get data from storage
    const vehicles = vehicleStorage.getAll();
    const reservations = reservationStorage.getAll();
    const transactions = transactionStorage.getAll();
    const maintenance = maintenanceStorage.getAll();

    // Calculate stats
    const availableVehicles = vehicles.filter(v => v.status === "available").length;
    const activeReservations = reservations.filter(r => 
      r.status === "confirmed" && 
      new Date(r.endDate) >= new Date()
    ).length;
    
    // Calculate monthly revenue (income transactions from current month)
    const now = new Date();
    const currentMonthIncome = transactions
      .filter(t => 
        t.type === "income" && 
        isSameMonth(new Date(t.date), now)
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Count maintenance alerts (vehicles with maintenance status)
    const maintenanceAlerts = vehicles.filter(v => v.status === "maintenance").length;
    
    // Set stats
    setStats({
      totalVehicles: vehicles.length,
      availableVehicles,
      activeReservations,
      monthlyRevenue: currentMonthIncome,
      maintenanceAlerts,
    });

    // Generate revenue data for last 10 months
    const revenueByMonth = Array.from({ length: 10 }).map((_, index) => {
      const month = subMonths(now, 9 - index);
      const monthIncomes = transactions
        .filter(t => 
          t.type === "income" && 
          isSameMonth(new Date(t.date), month)
        )
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: format(month, 'MMM', { locale: fr }),
        amount: monthIncomes,
      };
    });
    setRevenueData(revenueByMonth);

    // Get upcoming reservations with vehicle details
    const upcoming = reservations
      .filter(r => r.status === "confirmed" && new Date(r.endDate) >= new Date())
      .slice(0, 3)
      .map(r => {
        const vehicle = vehicles.find(v => v.id === r.vehicleId);
        return { ...r, vehicle: vehicle as Vehicle };
      });
    setUpcomingReservations(upcoming);

    // Get recent vehicles
    const recent = [...vehicles].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 3);
    setRecentVehicles(recent);

    // Get recent transactions
    const recentTxs = [...transactions].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 3);
    setRecentTransactions(recentTxs);
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-primary">Tableau de bord</h1>
        <p className="text-gray-600">Bienvenue sur l'interface d'administration de CARS MOTION</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Véhicules"
          value={stats.totalVehicles}
          icon={<Car />}
          iconBgColor="bg-blue-100"
          iconColor="text-secondary"
          change={{
            value: `${stats.availableVehicles}`,
            positive: true,
            text: "disponibles"
          }}
        />
        
        <StatCard
          title="Réservations actives"
          value={stats.activeReservations}
          icon={<CalendarCheck />}
          iconBgColor="bg-green-100"
          iconColor="text-success"
          change={{
            value: "",
            positive: true,
            text: "à venir"
          }}
        />
        
        <StatCard
          title="Revenu mensuel"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={<CreditCard />}
          iconBgColor="bg-yellow-100"
          iconColor="text-warning"
          change={{
            value: "",
            positive: true,
            text: "ce mois-ci"
          }}
        />
        
        <StatCard
          title="Maintenance à prévoir"
          value={stats.maintenanceAlerts}
          icon={<AlertTriangle />}
          iconBgColor="bg-red-100"
          iconColor="text-accent"
          change={{
            value: "",
            positive: false,
            text: "Interventions requises"
          }}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-bold">Performances mensuelles</h3>
            <select className="text-sm border border-gray-300 rounded px-2 py-1">
              <option>30 derniers jours</option>
              <option>90 derniers jours</option>
              <option>Cette année</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis 
                  tickFormatter={(value) => `${value}€`} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value) => [`${value}€`, "Revenu"]}
                  labelFormatter={(label) => `Mois: ${label}`}
                />
                <Bar dataKey="amount" fill="#3498DB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-4">Réservations à venir</h3>
            <div className="space-y-3">
              {upcomingReservations.length > 0 ? (
                upcomingReservations.map(reservation => (
                  <div key={reservation.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white mr-3">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-sm">
                        {reservation.vehicle ? `${reservation.vehicle.make} ${reservation.vehicle.model}` : 'Véhicule'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(reservation.startDate).toLocaleDateString()} - {new Date(reservation.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        reservation.status === "confirmed" 
                          ? "bg-green-100 text-success" 
                          : "bg-yellow-100 text-warning"
                      }`}>
                        {reservation.status === "confirmed" ? "Confirmé" : "En attente"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-gray-500">
                  Aucune réservation à venir
                </div>
              )}
              <Link href="/reservations">
                <a className="block text-center text-sm text-secondary hover:underline mt-2">
                  Voir toutes les réservations
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-4">Véhicules récents</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Véhicule</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Statut</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Kilométrage</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVehicles.length > 0 ? (
                    recentVehicles.map(vehicle => (
                      <tr key={vehicle.id} className="border-b border-gray-100">
                        <td className="py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-2">
                              <Car className="h-4 w-4 text-secondary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{vehicle.make} {vehicle.model}</p>
                              <p className="text-xs text-gray-500">{vehicle.year} • {vehicle.fuelType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            vehicle.status === "available" 
                              ? "bg-green-100 text-success" 
                              : vehicle.status === "maintenance"
                                ? "bg-yellow-100 text-warning"
                                : "bg-red-100 text-accent"
                          }`}>
                            {vehicle.status === "available" ? "Disponible" : 
                              vehicle.status === "maintenance" ? "Maintenance" : "Loué"}
                          </span>
                        </td>
                        <td className="py-3 text-sm">{vehicle.mileage.toLocaleString()} km</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-500">
                        Aucun véhicule enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Link href="/fleet">
              <a className="block text-center text-sm text-secondary hover:underline mt-4">
                Voir tous les véhicules
              </a>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading font-bold mb-4">Dernières transactions</h3>
            <div className="space-y-3">
              {recentTransactions.length > 0 ? (
                recentTransactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        transaction.type === "income" 
                          ? "bg-green-100 text-success" 
                          : "bg-red-100 text-accent"
                      }`}>
                        {transaction.type === "income" 
                          ? <ArrowDownRight className="h-5 w-5" /> 
                          : <ArrowUpRight className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-gray-600">{new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className={transaction.type === "income" ? "text-success font-medium" : "text-accent font-medium"}>
                      {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-gray-500">
                  Aucune transaction enregistrée
                </div>
              )}
              <Link href="/journal">
                <a className="block text-center text-sm text-secondary hover:underline mt-2">
                  Voir toutes les transactions
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
