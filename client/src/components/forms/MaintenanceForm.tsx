import { useState, useEffect } from "react";
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
import { 
  maintenanceStorage, 
  vehicleStorage,
  MaintenanceRecord,
  Vehicle 
} from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { generateMaintenanceExpense } from "@/lib/generateVehicleExpenses";

// Define maintenance types
const MAINTENANCE_TYPES = [
  { value: "service", label: "Entretien" },
  { value: "repair", label: "Réparation" },
  { value: "inspection", label: "Contrôle technique" }
];

// Define form schema
const maintenanceFormSchema = z.object({
  vehicleId: z.string().min(1, "Veuillez sélectionner un véhicule"),
  type: z.string().min(1, "Veuillez sélectionner un type d'intervention"),
  date: z.date({ required_error: "La date est requise" }),
  mileage: z.coerce.number().min(0, "Le kilométrage doit être positif"),
  description: z.string().min(1, "La description est requise"),
  cost: z.coerce.number().min(0, "Le coût doit être positif"),
  provider: z.string().optional(),
  invoiceReference: z.string().optional(),
  notes: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceFormProps {
  record?: MaintenanceRecord;
  onSuccess: () => void;
}

const MaintenanceForm = ({ record, onSuccess }: MaintenanceFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();
  
  // Load vehicles
  useEffect(() => {
    const allVehicles = vehicleStorage.getAll();
    setVehicles(allVehicles);
    
    // If editing a record, select the current vehicle
    if (record) {
      const vehicle = allVehicles.find(v => v.id === record.vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  }, [record]);
  
  // Set default values
  const defaultValues: Partial<MaintenanceFormValues> = {
    vehicleId: record?.vehicleId || "",
    type: record?.type || "",
    date: record?.date ? new Date(record.date) : new Date(),
    mileage: record?.mileage || selectedVehicle?.mileage || 0,
    description: record?.description || "",
    cost: record?.cost || 0,
    provider: record?.provider || "",
    invoiceReference: record?.invoiceReference || "",
    notes: record?.notes || "",
  };
  
  // Initialize form
  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues,
  });
  
  // Watch vehicle selection to update mileage
  const vehicleId = form.watch("vehicleId");
  
  useEffect(() => {
    if (vehicleId && !record) {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (vehicle) {
        setSelectedVehicle(vehicle);
        form.setValue("mileage", vehicle.mileage);
      }
    }
  }, [vehicleId, vehicles, form, record]);
  
  // Handle form submission
  const onSubmit = async (values: MaintenanceFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (record) {
        // Update existing record
        maintenanceStorage.update(record.id, {
          ...values,
          date: values.date.toISOString(),
        });
        
        toast({
          title: "Intervention mise à jour",
          description: "L'intervention de maintenance a été mise à jour avec succès.",
        });
      } else {
        // Create new record avec génération de la transaction
        const newRecord = maintenanceStorage.create({
          ...values,
          date: values.date.toISOString(),
          createdAt: new Date().toISOString(),
        });
        
        // Générer une transaction de dépense pour cette maintenance
        generateMaintenanceExpense(
          newRecord.id, 
          values.vehicleId,
          values.description,
          values.cost,
          values.date.toISOString()
        );
        
        // Update vehicle mileage if the new maintenance record has a higher mileage
        if (selectedVehicle && values.mileage > selectedVehicle.mileage) {
          vehicleStorage.update(selectedVehicle.id, {
            mileage: values.mileage
          });
          
          toast({
            title: "Kilométrage mis à jour",
            description: `Le kilométrage du véhicule a été mis à jour à ${values.mileage} km.`,
          });
        }
        
        toast({
          title: "Intervention ajoutée",
          description: "L'intervention de maintenance a été ajoutée avec succès et la dépense a été enregistrée dans le journal.",
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de l'intervention.",
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
                    {vehicles.map(vehicle => (
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type d'intervention</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
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
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kilométrage</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                {selectedVehicle && (
                  <p className="text-xs text-muted-foreground">
                    Kilométrage actuel du véhicule: {selectedVehicle.mileage.toLocaleString()} km
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coût (€)</FormLabel>
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
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prestataire</FormLabel>
                <FormControl>
                  <Input placeholder="Garage, concessionnaire..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="invoiceReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Référence facture</FormLabel>
                <FormControl>
                  <Input placeholder="Numéro ou référence de facture" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={2}
                    placeholder="Description de l'intervention"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Notes supplémentaires</FormLabel>
                <FormControl>
                  <Textarea 
                    rows={3}
                    placeholder="Notes ou observations supplémentaires"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? "Enregistrement..." 
              : record 
                ? "Mettre à jour" 
                : "Ajouter l'intervention"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaintenanceForm;
