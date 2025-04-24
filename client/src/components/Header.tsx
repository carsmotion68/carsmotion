import { useAuth } from "@/hooks/useAuth";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import logo from "@/assets/logo.png";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const { user } = useAuth();

  // Get initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 flex justify-between items-center">
      <div className="flex items-center">
        <Button 
          variant="ghost"
          size="icon"
          className="md:hidden mr-2" 
          onClick={toggleSidebar}
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <div className="hidden md:flex items-center">
          <img src={logo} alt="CARS MOTION" className="h-11" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-600 relative hover:bg-gray-100">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm font-semibold">3</span>
          </Button>
        </div>
        
        <div className="flex items-center">
          <Avatar className="h-10 w-10 bg-secondary text-white shadow-sm">
            <AvatarFallback className="font-semibold">{user ? getInitials(user.fullName) : "U"}</AvatarFallback>
          </Avatar>
          <div className="ml-2">
            <p className="text-sm font-semibold">{user?.fullName}</p>
            <p className="text-xs text-gray-600">Administrateur</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
