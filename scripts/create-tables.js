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

// Création d'une connexion PostgreSQL directe
const pool = new Pool({ connectionString: databaseUrl });

// Fonction pour exécuter du SQL personnalisé
async function executeSql(sql) {
  try {
    const client = await pool.connect();
    try {
      await client.query(sql);
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      client.release();
    }
  } catch (error) {
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
    const { error: customersError } = await supabase.from('customers').insert([]).select().limit(0);
    if (customersError && !customersError.message.includes('does not exist')) {
      console.error('Erreur lors de la vérification de la table customers:', customersError);
    } else if (customersError && customersError.message.includes('does not exist')) {
      const { error } = await supabase.query(`
        CREATE TABLE public.customers (
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
      if (error) {
        console.error('Erreur lors de la création de la table customers:', error);
      } else {
        console.log('Table customers créée avec succès');
      }
    } else {
      console.log('Table customers existe déjà');
    }

    // Création de la table reservations
    const { error: reservationsError } = await supabase.from('reservations').insert([]).select().limit(0);
    if (reservationsError && !reservationsError.message.includes('does not exist')) {
      console.error('Erreur lors de la vérification de la table reservations:', reservationsError);
    } else if (reservationsError && reservationsError.message.includes('does not exist')) {
      const { error } = await supabase.query(`
        CREATE TABLE public.reservations (
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
      if (error) {
        console.error('Erreur lors de la création de la table reservations:', error);
      } else {
        console.log('Table reservations créée avec succès');
      }
    } else {
      console.log('Table reservations existe déjà');
    }

    // Création de la table invoices
    const { error: invoicesError } = await supabase.from('invoices').insert([]).select().limit(0);
    if (invoicesError && !invoicesError.message.includes('does not exist')) {
      console.error('Erreur lors de la vérification de la table invoices:', invoicesError);
    } else if (invoicesError && invoicesError.message.includes('does not exist')) {
      const { error } = await supabase.query(`
        CREATE TABLE public.invoices (
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
      if (error) {
        console.error('Erreur lors de la création de la table invoices:', error);
      } else {
        console.log('Table invoices créée avec succès');
      }
    } else {
      console.log('Table invoices existe déjà');
    }

    // Création de la table transactions
    const { error: transactionsError } = await supabase.from('transactions').insert([]).select().limit(0);
    if (transactionsError && !transactionsError.message.includes('does not exist')) {
      console.error('Erreur lors de la vérification de la table transactions:', transactionsError);
    } else if (transactionsError && transactionsError.message.includes('does not exist')) {
      const { error } = await supabase.query(`
        CREATE TABLE public.transactions (
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
      if (error) {
        console.error('Erreur lors de la création de la table transactions:', error);
      } else {
        console.log('Table transactions créée avec succès');
      }
    } else {
      console.log('Table transactions existe déjà');
    }

    // Création de la table maintenance_records
    const { error: maintenanceError } = await supabase.from('maintenance_records').insert([]).select().limit(0);
    if (maintenanceError && !maintenanceError.message.includes('does not exist')) {
      console.error('Erreur lors de la vérification de la table maintenance_records:', maintenanceError);
    } else if (maintenanceError && maintenanceError.message.includes('does not exist')) {
      const { error } = await supabase.query(`
        CREATE TABLE public.maintenance_records (
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
      if (error) {
        console.error('Erreur lors de la création de la table maintenance_records:', error);
      } else {
        console.log('Table maintenance_records créée avec succès');
      }
    } else {
      console.log('Table maintenance_records existe déjà');
    }

    // Création de la table settings
    const { error: settingsError } = await supabase.from('settings').insert([]).select().limit(0);
    if (settingsError && !settingsError.message.includes('does not exist')) {
      console.error('Erreur lors de la vérification de la table settings:', settingsError);
    } else if (settingsError && settingsError.message.includes('does not exist')) {
      const { error } = await supabase.query(`
        CREATE TABLE public.settings (
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
      if (error) {
        console.error('Erreur lors de la création de la table settings:', error);
      } else {
        console.log('Table settings créée avec succès');
      }
    } else {
      console.log('Table settings existe déjà');
    }

    console.log('Toutes les tables ont été configurées avec succès!');
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
  }
}

// Exécution
createTables();