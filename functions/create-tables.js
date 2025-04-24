// Netlify Function pour créer les tables lors du déploiement
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Fonction principale exécutée par Netlify
exports.handler = async function(event, context) {
  console.log('Création des tables Supabase...');
  
  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Variables d\'environnement manquantes: SUPABASE_URL ou SUPABASE_SERVICE_KEY');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Configuration incomplète' })
    };
  }
  
  // Créer le client Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Vérifier si la table users existe (comme test)
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError && usersError.code === 'PGRST301') {
      console.log('Tables non existantes, exécution du script SQL...');
      
      // Lire le fichier SQL
      const sqlPath = './scripts/schema.sql';
      let sqlContent;
      
      try {
        // Essayer de lire le fichier de schéma SQL
        sqlContent = fs.readFileSync(sqlPath, 'utf8');
      } catch (err) {
        console.error('Erreur lors de la lecture du fichier SQL:', err);
        
        // Si le fichier n'existe pas, utiliser la version intégrée
        sqlContent = `
        -- Extension pgcrypto pour la génération de UUID
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        
        -- Table users
        CREATE TABLE IF NOT EXISTS public.users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          "fullName" TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Table vehicles
        CREATE TABLE IF NOT EXISTS public.vehicles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          year INTEGER NOT NULL,
          "licensePlate" TEXT NOT NULL,
          "fuelType" TEXT NOT NULL,
          mileage INTEGER NOT NULL,
          "purchaseType" TEXT NOT NULL,
          "purchasePrice" DECIMAL NOT NULL,
          "monthlyPayment" DECIMAL,
          "contractDuration" INTEGER,
          "insuranceMonthlyFee" DECIMAL,
          "dailyRate" DECIMAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Table customers
        CREATE TABLE IF NOT EXISTS public.customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "firstName" TEXT NOT NULL,
          "lastName" TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          address TEXT,
          city TEXT,
          "postalCode" TEXT,
          country TEXT,
          "licenseNumber" TEXT,
          "licenseIssueDate" TEXT,
          "licenseExpiryDate" TEXT,
          "depositType" TEXT,
          "depositAmount" DECIMAL,
          "depositReference" TEXT,
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Table reservations
        CREATE TABLE IF NOT EXISTS public.reservations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "vehicleId" UUID NOT NULL,
          "customerId" UUID NOT NULL,
          "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "totalAmount" DECIMAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id),
          FOREIGN KEY ("customerId") REFERENCES public.customers(id)
        );
        
        -- Table invoices
        CREATE TABLE IF NOT EXISTS public.invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "invoiceNumber" TEXT NOT NULL,
          "reservationId" UUID,
          "customerId" UUID NOT NULL,
          "issueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
          "totalAmount" DECIMAL NOT NULL,
          "taxAmount" DECIMAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY ("reservationId") REFERENCES public.reservations(id),
          FOREIGN KEY ("customerId") REFERENCES public.customers(id)
        );
        
        -- Table transactions
        CREATE TABLE IF NOT EXISTS public.transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          amount DECIMAL NOT NULL,
          description TEXT NOT NULL,
          "relatedTo" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Table maintenance_records
        CREATE TABLE IF NOT EXISTS public.maintenance_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "vehicleId" UUID NOT NULL,
          type TEXT NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          mileage INTEGER NOT NULL,
          description TEXT NOT NULL,
          cost DECIMAL NOT NULL,
          provider TEXT,
          "invoiceReference" TEXT,
          notes TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id)
        );
        
        -- Table settings
        CREATE TABLE IF NOT EXISTS public.settings (
          id SERIAL PRIMARY KEY,
          "companyName" TEXT NOT NULL,
          "companyAddress" TEXT NOT NULL,
          "companyPhone" TEXT NOT NULL,
          "companyEmail" TEXT NOT NULL,
          "vatNumber" TEXT,
          "bankDetails" TEXT,
          "logoUrl" TEXT,
          "lastBackupDate" TIMESTAMP WITH TIME ZONE
        );
        
        -- Création de l'utilisateur admin
        INSERT INTO public.users (username, password, "fullName", role)
        VALUES ('AdamNoe', '68824c15044b11c5a901b4ba69e4411eec889102a72c9f339b8abf9fc98b0e52.0f5d3c1e5cd0d1a39d4a38e38c6ec94b', 'Adam Noe', 'admin')
        ON CONFLICT (username) DO NOTHING;
        `;
      }
      
      // Exécuter le script SQL via la fonction RPC
      // Note: cela nécessite une fonction SQL côté Supabase, 
      // sinon cette tentative échouera et les tables devront être créées manuellement
      try {
        const { error: sqlError } = await supabase.rpc('execute_sql', { sql: sqlContent });
        
        if (sqlError) {
          console.error('Erreur lors de l\'exécution du SQL via RPC:', sqlError);
          return {
            statusCode: 500,
            body: JSON.stringify({
              error: 'Erreur lors de la création des tables',
              details: sqlError,
              message: 'Veuillez créer les tables manuellement en utilisant le script SQL'
            })
          };
        }
        
        console.log('Tables créées avec succès via RPC!');
      } catch (rpcError) {
        console.error('Erreur lors de l\'appel RPC (fonction probablement manquante):', rpcError);
        
        return {
          statusCode: 202, // Accepted but not fully processed
          body: JSON.stringify({
            warning: 'La création automatique des tables a échoué',
            message: 'Veuillez créer les tables manuellement en utilisant le script SQL fourni'
          })
        };
      }
    } else {
      console.log('Tables déjà existantes, vérification de l\'utilisateur admin...');
      
      // Créer l'utilisateur admin si nécessaire
      const { error } = await supabase.from('users')
        .insert([{
          username: 'AdamNoe',
          password: '68824c15044b11c5a901b4ba69e4411eec889102a72c9f339b8abf9fc98b0e52.0f5d3c1e5cd0d1a39d4a38e38c6ec94b',
          fullName: 'Adam Noe',
          role: 'admin'
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') { // Code unique violation
          console.log('User AdamNoe already exists');
        } else {
          console.error('Erreur lors de la création du user:', error);
        }
      } else {
        console.log('User AdamNoe créé avec succès');
      }
    }
    
    // Succès
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Configuration de la base de données terminée',
        tables_exist: !usersError
      })
    };
  } catch (error) {
    console.error('Erreur générale:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur générale', details: error })
    };
  }
};