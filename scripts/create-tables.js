// Script pour créer les tables dans Supabase à l'aide du client Supabase
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { Pool } from '@neondatabase/serverless';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies.');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('La variable d\'environnement DATABASE_URL doit être définie.');
  process.exit(1);
}

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Note: nous créons des pools individuels dans la fonction executeSql pour chaque requête

// Fonction pour exécuter du SQL personnalisé
async function executeSql(sql) {
  try {
    // Créer un pool avec les paramètres optimisés
    const pool = new Pool({ 
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }, // Pour les connexions sécurisées
      // Augmenter les délais pour les longues requêtes
      statement_timeout: 10000, // 10 secondes
      query_timeout: 10000, // 10 secondes
      connectionTimeoutMillis: 10000, // 10 secondes
      idle_in_transaction_session_timeout: 10000 // 10 secondes
    });
    
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(sql);
        return { result };
      } catch (error) {
        return { error };
      } finally {
        client.release();
      }
    } catch (error) {
      return { error };
    } finally {
      await pool.end();
    }
  } catch (error) {
    console.error('Erreur lors de la connexion à la base de données:', error);
    return { error };
  }
}

// Création des tables
async function createTables() {
  try {
    console.log('Création des tables via connexion directe à PostgreSQL...');

    // Création de la table users
    const usersResult = await executeSql(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    if (usersResult.error) {
      console.error('Erreur lors de la création de la table users:', usersResult.error);
    } else {
      console.log('Table users créée ou déjà existante');
    }

    // Création de la table vehicles
    const vehiclesResult = await executeSql(`
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
    `);
    
    if (vehiclesResult.error) {
      console.error('Erreur lors de la création de la table vehicles:', vehiclesResult.error);
    } else {
      console.log('Table vehicles créée ou déjà existante');
    }

    // Création de la table customers
    const customersResult = await executeSql(`
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
    `);
    
    if (customersResult.error) {
      console.error('Erreur lors de la création de la table customers:', customersResult.error);
    } else {
      console.log('Table customers créée ou déjà existante');
    }

    // Création de la table reservations
    const reservationsResult = await executeSql(`
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
    `);
    
    if (reservationsResult.error) {
      console.error('Erreur lors de la création de la table reservations:', reservationsResult.error);
    } else {
      console.log('Table reservations créée ou déjà existante');
    }

    // Création de la table invoices
    const invoicesResult = await executeSql(`
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
    `);
    
    if (invoicesResult.error) {
      console.error('Erreur lors de la création de la table invoices:', invoicesResult.error);
    } else {
      console.log('Table invoices créée ou déjà existante');
    }

    // Création de la table transactions
    const transactionsResult = await executeSql(`
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
    `);
    
    if (transactionsResult.error) {
      console.error('Erreur lors de la création de la table transactions:', transactionsResult.error);
    } else {
      console.log('Table transactions créée ou déjà existante');
    }

    // Création de la table maintenance_records
    const maintenanceResult = await executeSql(`
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
    `);
    
    if (maintenanceResult.error) {
      console.error('Erreur lors de la création de la table maintenance_records:', maintenanceResult.error);
    } else {
      console.log('Table maintenance_records créée ou déjà existante');
    }

    // Création de la table settings
    const settingsResult = await executeSql(`
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
    `);
    
    if (settingsResult.error) {
      console.error('Erreur lors de la création de la table settings:', settingsResult.error);
    } else {
      console.log('Table settings créée ou déjà existante');
    }

    console.log('Toutes les tables ont été configurées avec succès!');
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
  }
}

// Exécution
createTables();