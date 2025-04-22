import { ReactNode } from "react";
import { X } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const ModalContainer = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md"
}: ModalContainerProps) => {
  // Calculate max width based on size
  const getMaxWidth = () => {
    switch (size) {
      case "sm": return "max-w-md";
      case "md": return "max-w-2xl";
      case "lg": return "max-w-4xl";
      case "xl": return "max-w-6xl";
      default: return "max-w-2xl";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${getMaxWidth()} max-h-[90vh] overflow-y-auto p-0`}>
        <DialogHeader className="p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-heading font-bold">{title}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="p-5">
          {children}
        </div>
        
        {footer && (
          <DialogFooter className="p-5 border-t border-gray-200">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModalContainer;
