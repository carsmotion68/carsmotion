import { useAuth } from "@/hooks/useAuth";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
      <Button 
        variant="ghost"
        size="icon"
        className="md:hidden" 
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <div className="flex items-center space-x-4 ml-auto">
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-600 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">3</span>
          </Button>
        </div>
        
        <div className="flex items-center">
          <Avatar className="h-10 w-10 bg-secondary text-white">
            <AvatarFallback>{user ? getInitials(user.fullName) : "U"}</AvatarFallback>
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
