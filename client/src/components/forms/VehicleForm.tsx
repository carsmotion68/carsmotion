import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Vehicle, vehicleStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

// Define form schema with validation
const vehicleFormSchema = z.object({
  make: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modèle est requis"),
  year: z.coerce.number().min(1950, "L'année doit être supérieure à 1950").max(new Date().getFullYear() + 1, "L'année ne peut pas être dans le futur lointain"),
  licensePlate: z.string().min(1, "L'immatriculation est requise"),
  fuelType: z.string().min(1, "Le type de carburant est requis"),
  mileage: z.coerce.number().min(0, "Le kilométrage doit être positif"),
  purchaseType: z.string().min(1, "Le type d'achat est requis"),
  purchasePrice: z.coerce.number().min(0, "Le prix d'achat doit être positif"),
  monthlyPayment: z.coerce.number().min(0, "La mensualité doit être positive").optional(),
  contractDuration: z.coerce.number().min(0, "La durée du contrat doit être positive").optional(),
  dailyRate: z.coerce.number().min(0, "Le prix journalier doit être positif"),
  status: z.enum(["available", "rented", "maintenance"]),
  notes: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSuccess: () => void;
}

const VehicleForm = ({ vehicle, onSuccess }: VehicleFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Set default values
  const defaultValues: Partial<VehicleFormValues> = {
    make: vehicle?.make || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    licensePlate: vehicle?.licensePlate || "",
    fuelType: vehicle?.fuelType || "",
    mileage: vehicle?.mileage || 0,
    purchaseType: vehicle?.purchaseType || "",
    purchasePrice: vehicle?.purchasePrice || 0,
    monthlyPayment: vehicle?.monthlyPayment || 0,
    contractDuration: vehicle?.contractDuration || 0,
    dailyRate: vehicle?.dailyRate || 0,
    status: vehicle?.status || "available",
    notes: vehicle?.notes || "",
  };
  
  // Initialize form
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues,
  });
  
  // Handle form submission
  const onSubmit = async (values: VehicleFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (vehicle) {
        // Update existing vehicle
        vehicleStorage.update(vehicle.id, {
          ...values,
          mileage: Number(values.mileage),
          purchasePrice: Number(values.purchasePrice),
          monthlyPayment: values.monthlyPayment ? Number(values.monthlyPayment) : undefined,
          contractDuration: values.contractDuration ? Number(values.contractDuration) : undefined,
          dailyRate: Number(values.dailyRate),
        });
        
        toast({
          title: "Véhicule mis à jour",
          description: `${values.make} ${values.model} a été mis à jour avec succès.`,
        });
      } else {
        // Create new vehicle
        vehicleStorage.create({
          ...values,
          mileage: Number(values.mileage),
          purchasePrice: Number(values.purchasePrice),
          monthlyPayment: values.monthlyPayment ? Number(values.monthlyPayment) : undefined,
          contractDuration: values.contractDuration ? Number(values.contractDuration) : undefined,
          dailyRate: Number(values.dailyRate),
          createdAt: new Date().toISOString(),
        });
        
        toast({
          title: "Véhicule ajouté",
          description: `${values.make} ${values.model} a été ajouté à la flotte.`,
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du véhicule.",
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
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marque</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Renault" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modèle</FormLabel>
                <FormControl>
                  <Input placeholder="ex: Clio" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Année</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="licensePlate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Immatriculation</FormLabel>
                <FormControl>
                  <Input placeholder="ex: AA-123-BB" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="fuelType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de carburant</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Essence">Essence</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Électrique">Électrique</SelectItem>
                    <SelectItem value="Hybride">Hybride</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="purchaseType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type d'achat</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Achat comptant">Achat comptant</SelectItem>
                    <SelectItem value="Crédit">Crédit</SelectItem>
                    <SelectItem value="Leasing">Leasing</SelectItem>
                    <SelectItem value="Location longue durée">Location longue durée</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="purchasePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix d'achat (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="monthlyPayment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensualité (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contractDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée contrat (mois)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="dailyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prix journalier location (€)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
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
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="rented">Loué</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
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
              <FormLabel>Notes supplémentaires</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
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
            {isSubmitting ? "Enregistrement..." : vehicle ? "Mettre à jour" : "Ajouter le véhicule"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VehicleForm;
