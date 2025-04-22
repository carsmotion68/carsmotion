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
import { vehicleStorage, Transaction, transactionStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Define income and expense categories
const INCOME_CATEGORIES = ["Locations", "Caution", "Vente véhicule", "Subvention", "Autre recette"];
const EXPENSE_CATEGORIES = ["Entretien", "Carburant", "Assurance", "Taxes", "Achat véhicule", "Leasing", "Salaires", "Fournitures", "Loyer", "Autre dépense"];

// Define form schema
const transactionFormSchema = z.object({
  date: z.date({ required_error: "La date est requise" }),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "La catégorie est requise"),
  amount: z.coerce.number().positive("Le montant doit être positif"),
  description: z.string().min(1, "La description est requise"),
  relatedTo: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  transaction?: Transaction;
  type?: "income" | "expense";
  onSuccess: () => void;
}

const TransactionForm = ({ transaction, type = "income", onSuccess }: TransactionFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicles, setVehicles] = useState(vehicleStorage.getAll());
  const { toast } = useToast();
  
  // Set categories based on type
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  
  // Set default values
  const defaultValues: Partial<TransactionFormValues> = {
    date: transaction?.date ? new Date(transaction.date) : new Date(),
    type: transaction?.type || type,
    category: transaction?.category || "",
    amount: transaction?.amount || 0,
    description: transaction?.description || "",
    relatedTo: transaction?.relatedTo || "",
  };
  
  // Initialize form
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  });
  
  // Update categories when type changes
  const currentType = form.watch("type");
  
  // Handle form submission
  const onSubmit = async (values: TransactionFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (transaction) {
        // Update existing transaction
        transactionStorage.update(transaction.id, {
          ...values,
          date: values.date.toISOString(),
        });
        
        toast({
          title: `${values.type === "income" ? "Recette" : "Dépense"} mise à jour`,
          description: "La transaction a été mise à jour avec succès.",
        });
      } else {
        // Create new transaction
        transactionStorage.create({
          ...values,
          date: values.date.toISOString(),
          createdAt: new Date().toISOString(),
        });
        
        toast({
          title: `${values.type === "income" ? "Recette" : "Dépense"} ajoutée`,
          description: "La transaction a été ajoutée avec succès.",
        });
      }
      
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement de la transaction.",
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
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">Recette</SelectItem>
                    <SelectItem value="expense">Dépense</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(currentType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Montant (€)</FormLabel>
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
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Description de la transaction" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="relatedTo"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Lié au véhicule (optionnel)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un véhicule" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Aucun véhicule</SelectItem>
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
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className={currentType === "income" ? "bg-success hover:bg-green-600" : "bg-accent hover:bg-red-600"}
          >
            {isSubmitting 
              ? "Enregistrement..." 
              : transaction 
                ? "Mettre à jour" 
                : currentType === "income" ? "Ajouter la recette" : "Ajouter la dépense"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TransactionForm;
