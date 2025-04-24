import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

// Icons
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  FileText,
  BookOpen,
  BarChart3,
  DollarSign,
  Drill,
  Settings,
  LogOut
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar = ({ isOpen, closeSidebar }: SidebarProps) => {
  const [location] = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    { path: "/", label: "Tableau de bord", icon: <LayoutDashboard className="mr-2 h-5 w-5" /> },
    { path: "/fleet", label: "Gestion de la flotte", icon: <Car className="mr-2 h-5 w-5" /> },
    { path: "/reservations", label: "Réservations", icon: <CalendarCheck className="mr-2 h-5 w-5" /> },
    { path: "/invoices", label: "Factures", icon: <FileText className="mr-2 h-5 w-5" /> },
    { path: "/journal", label: "Journal des opérations", icon: <BookOpen className="mr-2 h-5 w-5" /> },
    { path: "/cashbook", label: "Livre de caisse", icon: <DollarSign className="mr-2 h-5 w-5" /> },
    { path: "/accounting", label: "Bilan comptable", icon: <BarChart3 className="mr-2 h-5 w-5" /> },
    { path: "/maintenance", label: "Maintenance", icon: <Drill className="mr-2 h-5 w-5" /> },
    { path: "/settings", label: "Paramètres", icon: <Settings className="mr-2 h-5 w-5" /> },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div 
      className={cn(
        "cars-sidebar w-64 bg-primary text-white shadow-lg z-20",
        isOpen ? "show" : ""
      )}
    >
      <div className="p-5 border-b border-gray-700 flex flex-col items-center">
        <img src={logo} alt="CARS MOTION" className="h-12 mb-2" />
        <p className="text-xs text-gray-400">Plateforme d'administration</p>
      </div>
      
      <div className="py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={cn(
                  "block py-2.5 px-5 text-white hover:bg-secondary hover:text-white transition duration-200 flex items-center",
                  location === item.path && "bg-secondary font-semibold"
                )}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    closeSidebar();
                  }
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mt-auto p-5 border-t border-gray-700">
        <button 
          onClick={handleLogout}
          className="w-full bg-secondary hover:bg-secondary/90 text-white py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
        >
          <LogOut className="mr-2 h-5 w-5" /> Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
