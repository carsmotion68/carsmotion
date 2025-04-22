import { useState, useEffect, useRef } from "react";
import { 
  Save, 
  Upload, 
  Download, 
  Trash2, 
  AlertTriangle,
  Info
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getSettings, updateSettings, backupData, restoreData, resetAllData } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { downloadDataAsJson, readJsonFile } from "@/lib/utils";

// Define settings form schema
const settingsFormSchema = z.object({
  companyName: z.string().min(1, "Le nom de l'entreprise est requis"),
  companyAddress: z.string().min(1, "L'adresse est requise"),
  companyPhone: z.string().min(1, "Le numéro de téléphone est requis"),
  companyEmail: z.string().email("L'adresse email est invalide"),
  vatNumber: z.string().optional(),
  bankDetails: z.string().optional(),
  logoUrl: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const Settings = () => {
  const [activeTab, setActiveTab] = useState("company");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const { toast } = useToast();
  
  // File input ref for backup restore
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load settings and backup date
  useEffect(() => {
    const settings = getSettings();
    if (settings?.lastBackupDate) {
      setLastBackupDate(settings.lastBackupDate);
    }
  }, []);
  
  // Settings form
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: getSettings(),
  });
  
  // Handle settings form submission
  const onSubmit = (values: SettingsFormValues) => {
    try {
      updateSettings({
        ...values,
        lastBackupDate: lastBackupDate || undefined
      });
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres ont été mis à jour avec succès.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde des paramètres.",
      });
    }
  };
  
  // Handle data backup
  const handleBackupData = () => {
    try {
      const backupDataObj = backupData();
      downloadDataAsJson("cars_motion_backup.json", backupDataObj);
      
      // Update last backup date
      const now = new Date().toISOString();
      setLastBackupDate(now);
      
      // Update settings with new backup date
      const settings = getSettings();
      updateSettings({
        ...settings,
        lastBackupDate: now
      });
      
      toast({
        title: "Sauvegarde effectuée",
        description: "Les données ont été sauvegardées avec succès.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de sauvegarde",
        description: "Une erreur est survenue lors de la sauvegarde des données.",
      });
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle data restore
  const handleRestoreData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const jsonData = await readJsonFile(file);
      const success = restoreData(jsonData);
      
      if (success) {
        toast({
          title: "Données restaurées",
          description: "Les données ont été restaurées avec succès.",
        });
        
        // Update form values with restored settings
        const restoredSettings = getSettings();
        if (restoredSettings) {
          form.reset(restoredSettings);
          
          // Update last backup date
          if (restoredSettings.lastBackupDate) {
            setLastBackupDate(restoredSettings.lastBackupDate);
          }
        }
        
        // Ask user to refresh the page
        setTimeout(() => {
          const shouldRefresh = window.confirm("Pour appliquer complètement les données restaurées, la page doit être rafraîchie. Voulez-vous rafraîchir maintenant ?");
          if (shouldRefresh) {
            window.location.reload();
          }
        }, 1000);
      } else {
        toast({
          variant: "destructive",
          title: "Erreur de restauration",
          description: "Le format du fichier de sauvegarde est invalide.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de restauration",
        description: "Une erreur est survenue lors de la restauration des données.",
      });
    }
    
    // Clear the file input
    event.target.value = "";
  };
  
  // Handle data reset
  const handleResetData = () => {
    setIsResetDialogOpen(true);
  };
  
  // Confirm data reset
  const confirmResetData = () => {
    try {
      resetAllData();
      
      toast({
        title: "Données réinitialisées",
        description: "Toutes les données ont été réinitialisées avec succès.",
      });
      
      setIsResetDialogOpen(false);
      
      // Refresh the page after reset
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de réinitialisation",
        description: "Une erreur est survenue lors de la réinitialisation des données.",
      });
    }
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-primary">Paramètres</h1>
        <p className="text-gray-600">Configuration de l'application et sauvegarde des données</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="company">Entreprise</TabsTrigger>
          <TabsTrigger value="data">Données</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
              <CardDescription>
                Ces informations seront utilisées dans les factures et les documents générés.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'entreprise</FormLabel>
                          <FormControl>
                            <Input placeholder="CARS MOTION" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="companyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@carsmotion.fr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="01 23 45 67 89" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro TVA</FormLabel>
                          <FormControl>
                            <Input placeholder="FR12 345678910" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Adresse</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="123 Avenue des Véhicules, 75001 Paris" 
                              {...field} 
                              rows={2}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bankDetails"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Coordonnées bancaires</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="IBAN: FR76 1234 5678 9012 3456 7890 123&#10;BIC: ABCDEFGHIJK" 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormDescription>
                            Ces informations apparaîtront sur les factures générées.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>URL du logo</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/logo.png" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            URL d'une image en ligne (optionnel).
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="bg-secondary hover:bg-blue-600">
                    <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sauvegarde et restauration</CardTitle>
              <CardDescription>
                Gérez vos données d'application pour éviter toute perte d'information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-800">Fonctionnement hors-ligne</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Cette application fonctionne entièrement en mode hors-ligne. Toutes les données sont 
                    stockées localement dans votre navigateur. Il est fortement recommandé de sauvegarder 
                    régulièrement vos données pour éviter toute perte d'information.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Sauvegarde</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Exportez toutes vos données dans un fichier JSON que vous pourrez stocker en lieu sûr.
                    {lastBackupDate && (
                      <span className="block mt-1">
                        Dernière sauvegarde: {new Date(lastBackupDate).toLocaleDateString()} à {new Date(lastBackupDate).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                  <Button onClick={handleBackupData} className="w-full">
                    <Download className="mr-2 h-4 w-4" /> Télécharger la sauvegarde
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Restauration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Importez une sauvegarde précédemment réalisée pour restaurer vos données.
                  </p>
                  <Button onClick={triggerFileInput} variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" /> Importer une sauvegarde
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept=".json" 
                    onChange={handleRestoreData}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200 w-full">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-800">Zone de danger</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Cette action effacera toutes les données de l'application. Cette opération est irréversible.
                    </p>
                    <Button variant="destructive" onClick={handleResetData}>
                      <Trash2 className="mr-2 h-4 w-4" /> Réinitialiser toutes les données
                    </Button>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>À propos</CardTitle>
              <CardDescription>
                Informations sur l'application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  <strong>CARS MOTION</strong> - Application de gestion de location de véhicules
                </p>
                <p className="text-sm text-gray-600">
                  Version 1.0.0
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium mb-2">Fonctionnalités:</h3>
                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                    <li>Gestion complète de la flotte de véhicules</li>
                    <li>Système de réservations et de calendrier</li>
                    <li>Génération de factures PDF</li>
                    <li>Journal des opérations et livre de caisse</li>
                    <li>Bilan comptable et rapports financiers</li>
                    <li>Suivi de la maintenance des véhicules</li>
                    <li>Fonctionnement 100% hors-ligne</li>
                    <li>Système de sauvegarde et restauration</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va supprimer définitivement toutes vos données, y compris 
              les véhicules, réservations, factures, transactions et paramètres.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetData} className="bg-destructive hover:bg-red-700">
              Réinitialiser toutes les données
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
