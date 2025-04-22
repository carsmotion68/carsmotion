import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
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
import { CalendarIcon } from "lucide-react";
import { 
  Invoice, 
  Customer, 
  Reservation, 
  customerStorage, 
  reservationStorage, 
  invoiceStorage,
  vehicleStorage
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { cn, generateInvoiceNumber } from "@/lib/utils";

// Define the form schema
const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Le numéro de facture est requis"),
  reservationId: z.string().optional(),
  customerId: z.string().min(1, "Veuillez sélectionner un client"),
  issueDate: z.date({ required_error: "La date d'émission est requise" }),
  dueDate: z.date({ required_error: "La date d'échéance est requise" }),
  totalAmount: z.number().min(0, "Le montant total doit être positif"),
  taxAmount: z.number().min(0, "Le montant de TVA doit être positif"),
  status: z.enum(["unpaid", "paid", "cancelled"]),
  notes: z.string().optional(),
}).refine(data => {
  return data.dueDate >= data.issueDate;
}, {
  message: "La date d'échéance doit être postérieure ou égale à la date d'émission",
  path: ["dueDate"],
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  reservationId?: string;
  onSuccess: () => void;
}

const InvoiceForm = ({ invoice, reservationId, onSuccess }: InvoiceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const { toast } = useToast();
  
  // Fetch customers and reservations
  useEffect(() => {
    setCustomers(customerStorage.getAll());
    
    // Get all reservations that are confirmed or completed
    const allReservations = reservationStorage.getAll().filter(
      r => r.status === "confirmed" || r.status === "completed"
    );
    setReservations(allReservations);
    
    // If editing an invoice with a reservation, or creating from a reservation
    const resId = invoice?.reservationId || reservationId;
    if (resId) {
      const reservation = allReservations.find(r => r.id === resId);
      if (reservation) {
        setSelectedReservation(reservation);
        
        // If creating a new invoice, set the customer ID from the reservation
        if (!invoice) {
          form.setValue("customerId", reservation.customerId);
          form.setValue("totalAmount", reservation.totalAmount);
          // Calculate tax (20%)
          const taxAmount = reservation.totalAmount * 0.2;
          form.setValue("taxAmount", Math.round(taxAmount * 100) / 100);
        }
      }
    }
  }, [invoice, reservationId]);
  
  // Generate a new invoice number or use existing
  const newInvoiceNumber = invoice?.invoiceNumber || generateInvoiceNumber();
  
  // Set default values
  const defaultValues: Partial<InvoiceFormValues> = {
    invoiceNumber: newInvoiceNumber,
    reservationId: invoice?.reservationId || reservationId || "",
    customerId: invoice?.customerId || "",
    issueDate: invoice?.issueDate ? new Date(invoice.issueDate) : new Date(),
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate) : addDays(new Date(), 14),
    totalAmount: invoice?.totalAmount || 0,
    taxAmount: invoice?.taxAmount || 0,
    status: invoice?.status || "unpaid",
    notes: invoice?.notes || "",
  };
  
  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
  });
  
  // Watch for reservation changes to update customer and amount
  const currentReservationId = form.watch("reservationId");
  
  useEffect(() => {
    if (currentReservationId) {
      const reservation = reservations.find(r => r.id === currentReservationId);
      if (reservation) {
        setSelectedReservation(reservation);
        form.setValue("customerId", reservation.customerId);
        form.setValue("totalAmount", reservation.totalAmount);
        // Calculate tax (20%)
        const taxAmount = reservation.totalAmount * 0.2;
        form.setValue("taxAmount", Math.round(taxAmount * 100) / 100);
      }
    }
  }, [currentReservationId, reservations, form]);
  
  // Watch for total amount changes to update tax
  const totalAmount = form.watch("totalAmount");
  
  useEffect(() => {
    if (totalAmount > 0) {
      // Calculate tax (20%)
      const taxAmount = totalAmount * 0.2;
      form.setValue("taxAmount", Math.round(taxAmount * 100) / 100);
    }
  }, [totalAmount, form]);
  
  // Handle form submission
  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (invoice) {
        // Update existing invoice
        invoiceStorage.update(invoice.id, {
          ...values,
          issueDate: values.issueDate.toISOString(),
          dueDate: values.dueDate.toISOString(),
        });
        
        toast({
          title: "Facture mise à jour",
          description: `La facture ${values.invoiceNumber} a été mise à jour avec succès.`,
        });
      } else {
        // Create new invoice
        invoiceStorage.create({
          ...values,
          issueDate: values.issueDate.toISOString(),
          dueDate: values.dueDate.toISOString(),
          createdAt: new Date().toISOString(),
        });
        
        toast({
          title: "Facture créée",
          description: `La facture ${values.invoiceNumber} a été créée avec succès.`,
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la facture.",
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
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numéro de facture</FormLabel>
                <FormControl>
                  <Input {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="reservationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Réservation associée (optionnel)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une réservation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Aucune réservation</SelectItem>
                    {reservations.map((reservation) => {
                      const vehicle = vehicleStorage.getById(reservation.vehicleId);
                      const customer = customerStorage.getById(reservation.customerId);
                      return (
                        <SelectItem key={reservation.id} value={reservation.id}>
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule'} - 
                          {customer ? `${customer.firstName} ${customer.lastName}` : 'Client'}
                        </SelectItem>
                      );
                    })}
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
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.firstName} {customer.lastName}
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
                    <SelectItem value="unpaid">Non payée</SelectItem>
                    <SelectItem value="paid">Payée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date d'émission</FormLabel>
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
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date d'échéance</FormLabel>
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
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="taxAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant TVA (€)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  TVA calculée automatiquement (20%)
                </p>
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
            {isSubmitting ? "Enregistrement..." : invoice ? "Mettre à jour" : "Créer la facture"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default InvoiceForm;
