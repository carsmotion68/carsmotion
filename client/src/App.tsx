import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/Dashboard";
import Fleet from "@/pages/Fleet";
import Reservations from "@/pages/Reservations";
import Invoices from "@/pages/Invoices";
import Journal from "@/pages/Journal";
import CashBook from "@/pages/CashBook";
import Accounting from "@/pages/Accounting";
import Maintenance from "@/pages/Maintenance";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { queryClient } from "@/lib/queryClient";

function AppContent() {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Initialize application data if first time
    const isInitialized = localStorage.getItem("carsmotion_initialized");
    
    if (!isInitialized) {
      // Set default company settings
      localStorage.setItem("carsmotion_settings", JSON.stringify({
        companyName: "CARS MOTION",
        companyAddress: "123 Avenue des Véhicules, 75001 Paris, France",
        companyPhone: "01 23 45 67 89",
        companyEmail: "contact@carsmotion.fr",
        vatNumber: "FR12 123456789",
        bankDetails: "IBAN: FR76 1234 5678 9012 3456 7890 123\nBIC: ABCDEFGHIJK"
      }));
      
      // Initialize empty data stores
      localStorage.setItem("carsmotion_vehicles", JSON.stringify([]));
      localStorage.setItem("carsmotion_customers", JSON.stringify([]));
      localStorage.setItem("carsmotion_reservations", JSON.stringify([]));
      localStorage.setItem("carsmotion_invoices", JSON.stringify([]));
      localStorage.setItem("carsmotion_transactions", JSON.stringify([]));
      localStorage.setItem("carsmotion_maintenance", JSON.stringify([]));
      
      localStorage.setItem("carsmotion_initialized", "true");
    }
  }, []);

  const MainLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex h-screen bg-[#f8f9fa]">
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-64'}`}>
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="flex-1 p-5 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/" component={() => (
        <MainLayout>
          <Dashboard />
        </MainLayout>
      )} />
      
      <ProtectedRoute path="/fleet" component={() => (
        <MainLayout>
          <Fleet />
        </MainLayout>
      )} />
      
      <ProtectedRoute path="/reservations" component={() => (
        <MainLayout>
          <Reservations />
        </MainLayout>
      )} />
      
      <ProtectedRoute path="/invoices" component={() => (
        <MainLayout>
          <Invoices />
        </MainLayout>
      )} />
      
      <ProtectedRoute path="/journal" component={() => (
        <MainLayout>
          <Journal />
        </MainLayout>
      )} />
      
      <ProtectedRoute path="/cashbook" component={() => (
        <MainLayout>
          <CashBook />
        </MainLayout>
      )} />
      
      <ProtectedRoute path="/accounting" component={() => (
        <MainLayout>
          <Accounting />
        </MainLayout>
      )} />
      
      <ProtectedRoute path="/maintenance" component={() => (
        <MainLayout>
          <Maintenance />
        </MainLayout>
      )} />
      
      <ProtectedRoute path="/settings" component={() => (
        <MainLayout>
          <Settings />
        </MainLayout>
      )} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
