import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import { Customer, customerStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { cn, generateUniqueId } from "@/lib/utils";

// Define the form schema
const customerFormSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseIssueDate: z.date().optional(),
  licenseExpiryDate: z.date().optional(),
  depositType: z.enum(["vehicle", "cash", "creditCard", "bankTransfer", "check"]).optional(),
  depositAmount: z.number().optional(),
  depositReference: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => {
  // Si une date d'expiration de permis est fournie, elle doit être postérieure à aujourd'hui
  if (data.licenseExpiryDate) {
    return data.licenseExpiryDate > new Date();
  }
  return true;
}, {
  message: "La date d'expiration du permis doit être dans le futur",
  path: ["licenseExpiryDate"],
}).refine(data => {
  // Si les deux dates sont fournies, la date d'expiration doit être postérieure à la date d'émission
  if (data.licenseIssueDate && data.licenseExpiryDate) {
    return data.licenseExpiryDate > data.licenseIssueDate;
  }
  return true;
}, {
  message: "La date d'expiration doit être postérieure à la date d'émission",
  path: ["licenseExpiryDate"],
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSuccess: (customerId?: string) => void;
}

const CustomerForm = ({ customer, onSuccess }: CustomerFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Set default values
  const defaultValues: Partial<CustomerFormValues> = {
    firstName: customer?.firstName || "",
    lastName: customer?.lastName || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    city: customer?.city || "",
    postalCode: customer?.postalCode || "",
    country: customer?.country || "France",
    licenseNumber: customer?.licenseNumber || "",
    licenseIssueDate: customer?.licenseIssueDate ? new Date(customer.licenseIssueDate) : undefined,
    licenseExpiryDate: customer?.licenseExpiryDate ? new Date(customer.licenseExpiryDate) : undefined,
    depositType: customer?.depositType || undefined,
    depositAmount: customer?.depositAmount || 0,
    depositReference: customer?.depositReference || "",
    notes: customer?.notes || "",
  };
  
  // Initialize form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  });
  
  // Watch for deposit type to conditionally show other fields
  const depositType = form.watch("depositType");
  
  // Handle form submission
  const onSubmit = async (values: CustomerFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare data with dates converted to ISO strings
      const customerData = {
        ...values,
        licenseIssueDate: values.licenseIssueDate ? values.licenseIssueDate.toISOString() : undefined,
        licenseExpiryDate: values.licenseExpiryDate ? values.licenseExpiryDate.toISOString() : undefined,
      };
      
      if (customer) {
        // Update existing customer
        customerStorage.update(customer.id, customerData);
        
        toast({
          title: "Client mis à jour",
          description: `Les informations de ${values.firstName} ${values.lastName} ont été mises à jour.`,
        });
        
        onSuccess(customer.id);
      } else {
        // Create new customer
        const newCustomer = customerStorage.create({
          ...customerData,
          createdAt: new Date().toISOString(),
        });
        
        toast({
          title: "Client créé",
          description: `${values.firstName} ${values.lastName} a été ajouté avec succès.`,
        });
        
        onSuccess(newCustomer.id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du client.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informations personnelles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Adresse</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Adresse</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code postal</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pays</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Permis de conduire</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de permis</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="col-span-1">
              {/* Placeholder pour l'alignement */}
            </div>
            
            <FormField
              control={form.control}
              name="licenseIssueDate"
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
              name="licenseExpiryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date d'expiration</FormLabel>
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
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Caution</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="depositType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de caution</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="vehicle">Véhicule</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="creditCard">Carte bancaire</SelectItem>
                      <SelectItem value="bankTransfer">Virement</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant de la caution (€)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="depositReference"
              render={({ field }) => (
                <FormItem className={depositType ? "col-span-2" : "hidden"}>
                  <FormLabel>
                    {depositType === 'vehicle' && "Description du véhicule en caution"}
                    {depositType === 'cash' && "Référence du reçu"}
                    {depositType === 'creditCard' && "Numéro de carte (4 derniers chiffres)"}
                    {depositType === 'bankTransfer' && "Référence du virement"}
                    {depositType === 'check' && "Numéro du chèque"}
                    {!depositType && "Référence"}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  rows={3} 
                  placeholder="Notes additionnelles sur le client" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : customer ? "Mettre à jour" : "Créer le client"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CustomerForm;