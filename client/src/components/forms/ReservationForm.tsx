import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, differenceInDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Vehicle, Customer, Reservation, vehicleStorage, customerStorage, reservationStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import CustomerForm from "./CustomerForm";

// Define the form schema
const reservationFormSchema = z.object({
  vehicleId: z.string().min(1, "Veuillez sélectionner un véhicule"),
  customerId: z.string().min(1, "Veuillez sélectionner un client"),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date({ required_error: "La date de fin est requise" }),
  totalAmount: z.number().min(0, "Le montant total doit être positif"),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
  notes: z.string().optional(),
}).refine(data => {
  return data.endDate > data.startDate;
}, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endDate"],
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

interface ReservationFormProps {
  reservation?: Reservation;
  onSuccess: () => void;
}

const ReservationForm = ({ reservation, onSuccess }: ReservationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const { toast } = useToast();
  
  // Fetch vehicles and customers
  useEffect(() => {
    const allVehicles = vehicleStorage.getAll();
    // Filter out rented vehicles or include the current one if editing
    const available = allVehicles.filter(v => v.status === "available" || (reservation && v.id === reservation.vehicleId));
    setAvailableVehicles(available);
    
    if (reservation?.vehicleId) {
      const vehicle = allVehicles.find(v => v.id === reservation.vehicleId);
      if (vehicle) setSelectedVehicle(vehicle);
    }
    
    setCustomers(customerStorage.getAll());
  }, [reservation]);
  
  // Set default values
  const defaultValues: Partial<ReservationFormValues> = {
    vehicleId: reservation?.vehicleId || "",
    customerId: reservation?.customerId || "",
    startDate: reservation?.startDate ? new Date(reservation.startDate) : new Date(),
    endDate: reservation?.endDate ? new Date(reservation.endDate) : addDays(new Date(), 1),
    totalAmount: reservation?.totalAmount || 0,
    status: reservation?.status || "pending",
    notes: reservation?.notes || "",
  };
  
  // Initialize form
  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues,
  });
  
  // Watch for changes to update total amount
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const vehicleId = form.watch("vehicleId");
  
  // Update total amount when dates or vehicle changes
  useEffect(() => {
    if (startDate && endDate && vehicleId) {
      const vehicle = availableVehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        const days = differenceInDays(endDate, startDate) + 1; // Include both start and end days
        const total = days * vehicle.dailyRate;
        form.setValue("totalAmount", total);
        setSelectedVehicle(vehicle);
      }
    }
  }, [startDate, endDate, vehicleId, availableVehicles, form]);
  
  // Handle form submission
  const onSubmit = async (values: ReservationFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (reservation) {
        // Update existing reservation
        reservationStorage.update(reservation.id, {
          ...values,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
        });
        
        toast({
          title: "Réservation mise à jour",
          description: "La réservation a été mise à jour avec succès.",
        });
      } else {
        // Create new reservation
        reservationStorage.create({
          ...values,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
          createdAt: new Date().toISOString(),
        });
        
        // Update vehicle status to rented if reservation is confirmed
        if (values.status === "confirmed") {
          vehicleStorage.update(values.vehicleId, {
            status: "rented"
          });
        }
        
        toast({
          title: "Réservation créée",
          description: "La nouvelle réservation a été créée avec succès.",
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la réservation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Véhicule</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un véhicule" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Client</FormLabel>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowNewCustomerForm(true)}
                    className="h-8 text-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Nouveau client
                  </Button>
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.length > 0 ? (
                      customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.firstName} {customer.lastName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-customers">Aucun client disponible</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de début</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de fin</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: fr })
                        ) : (
                          <span>Sélectionner une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => 
                        date < startDate || 
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="totalAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant total (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                {selectedVehicle && (
                  <p className="text-xs text-muted-foreground">
                    Prix journalier: {formatCurrency(selectedVehicle.dailyRate)} × 
                    {differenceInDays(endDate, startDate) + 1} jours
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmé</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Notes ou instructions particulières" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : reservation ? "Mettre à jour" : "Créer la réservation"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ReservationForm;
