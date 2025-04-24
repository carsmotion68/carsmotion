// Script pour migrer les données vers Supabase
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Les variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies.');
  process.exit(1);
}

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour créer les tables dans Supabase
async function createTables() {
  try {
    console.log('Création des tables dans Supabase...');

    // Création de la table users
    const { error: usersError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          fullName TEXT NOT NULL,
          role TEXT DEFAULT 'user',
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (usersError) {
      console.error('Erreur lors de la création de la table users:', usersError);
    } else {
      console.log('Table users créée avec succès');
    }

    // Création de la table vehicles
    const { error: vehiclesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS vehicles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          year INTEGER NOT NULL,
          licensePlate TEXT NOT NULL,
          fuelType TEXT NOT NULL,
          mileage INTEGER NOT NULL,
          purchaseType TEXT NOT NULL,
          purchasePrice DECIMAL NOT NULL,
          monthlyPayment DECIMAL,
          contractDuration INTEGER,
          insuranceMonthlyFee DECIMAL,
          dailyRate DECIMAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (vehiclesError) {
      console.error('Erreur lors de la création de la table vehicles:', vehiclesError);
    } else {
      console.log('Table vehicles créée avec succès');
    }

    // Création de la table customers
    const { error: customersError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          firstName TEXT NOT NULL,
          lastName TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          address TEXT,
          city TEXT,
          postalCode TEXT,
          country TEXT,
          licenseNumber TEXT,
          licenseIssueDate TEXT,
          licenseExpiryDate TEXT,
          depositType TEXT,
          depositAmount DECIMAL,
          depositReference TEXT,
          notes TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (customersError) {
      console.error('Erreur lors de la création de la table customers:', customersError);
    } else {
      console.log('Table customers créée avec succès');
    }

    // Création de la table reservations
    const { error: reservationsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS reservations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicleId UUID NOT NULL REFERENCES vehicles(id),
          customerId UUID NOT NULL REFERENCES customers(id),
          startDate TIMESTAMP WITH TIME ZONE NOT NULL,
          endDate TIMESTAMP WITH TIME ZONE NOT NULL,
          totalAmount DECIMAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (reservationsError) {
      console.error('Erreur lors de la création de la table reservations:', reservationsError);
    } else {
      console.log('Table reservations créée avec succès');
    }

    // Création de la table invoices
    const { error: invoicesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          invoiceNumber TEXT NOT NULL,
          reservationId UUID REFERENCES reservations(id),
          customerId UUID NOT NULL REFERENCES customers(id),
          issueDate TIMESTAMP WITH TIME ZONE NOT NULL,
          dueDate TIMESTAMP WITH TIME ZONE NOT NULL,
          totalAmount DECIMAL NOT NULL,
          taxAmount DECIMAL NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (invoicesError) {
      console.error('Erreur lors de la création de la table invoices:', invoicesError);
    } else {
      console.log('Table invoices créée avec succès');
    }

    // Création de la table transactions
    const { error: transactionsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          amount DECIMAL NOT NULL,
          description TEXT NOT NULL,
          relatedTo TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (transactionsError) {
      console.error('Erreur lors de la création de la table transactions:', transactionsError);
    } else {
      console.log('Table transactions créée avec succès');
    }

    // Création de la table maintenance_records
    const { error: maintenanceError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS maintenance_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          vehicleId UUID NOT NULL REFERENCES vehicles(id),
          type TEXT NOT NULL,
          date TIMESTAMP WITH TIME ZONE NOT NULL,
          mileage INTEGER NOT NULL,
          description TEXT NOT NULL,
          cost DECIMAL NOT NULL,
          provider TEXT,
          invoiceReference TEXT,
          notes TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (maintenanceError) {
      console.error('Erreur lors de la création de la table maintenance_records:', maintenanceError);
    } else {
      console.log('Table maintenance_records créée avec succès');
    }

    // Création de la table settings
    const { error: settingsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS settings (
          id SERIAL PRIMARY KEY,
          companyName TEXT NOT NULL,
          companyAddress TEXT NOT NULL,
          companyPhone TEXT NOT NULL,
          companyEmail TEXT NOT NULL,
          vatNumber TEXT,
          bankDetails TEXT,
          logoUrl TEXT,
          lastBackupDate TIMESTAMP WITH TIME ZONE
        );
      `
    });

    if (settingsError) {
      console.error('Erreur lors de la création de la table settings:', settingsError);
    } else {
      console.log('Table settings créée avec succès');
    }

    console.log('Toutes les tables ont été créées avec succès dans Supabase!');
    
  } catch (error) {
    console.error('Erreur lors de la création des tables:', error);
  }
}

// Fonction principale pour exécuter la migration
async function migrateToSupabase() {
  try {
    // 1. Créer les tables dans Supabase
    await createTables();

    console.log('Migration terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de la migration vers Supabase:', error);
  }
}

// Exécuter la migration
migrateToSupabase();