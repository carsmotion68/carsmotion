import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
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

function App() {
  const [location] = useLocation();
  const { isAuthenticated, loading } = useAuth();
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      {!isAuthenticated ? (
        <Login />
      ) : (
        <div className="flex h-screen bg-[#f8f9fa]">
          <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
          
          <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-64'}`}>
            <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="flex-1 p-5 overflow-auto">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/fleet" component={Fleet} />
                <Route path="/reservations" component={Reservations} />
                <Route path="/invoices" component={Invoices} />
                <Route path="/journal" component={Journal} />
                <Route path="/cashbook" component={CashBook} />
                <Route path="/accounting" component={Accounting} />
                <Route path="/maintenance" component={Maintenance} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}

export default App;
