// Fonction Netlify pour créer les tables dans Supabase
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

exports.handler = async (event, context) => {
  // Autoriser les requêtes CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Gérer les requêtes OPTIONS pour le CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }

  // Vérifier que c'est une requête POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Méthode non autorisée. Utilisez POST.' })
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!supabaseUrl || !supabaseKey || !databaseUrl) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Variables d\'environnement manquantes',
        details: {
          supabaseUrl: !!supabaseUrl,
          supabaseKey: !!supabaseKey,
          databaseUrl: !!databaseUrl
        }
      })
    };
  }

  // Initialiser le client Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fonction pour exécuter du SQL
  async function executeSql(sql) {
    const pool = new Pool({ 
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      // Augmentation des délais pour les longues requêtes
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
  }

  // Logs pour le débogage
  const logs = [];
  function log(message) {
    logs.push(message);
    console.log(message);
  }

  // Création des tables
  try {
    log('Création des tables dans Supabase...');

    // Table users
    log('--- Création de la table users ---');
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
      log(`Erreur: ${usersResult.error.message}`);
    } else {
      log('Succès: Table users créée ou déjà existante');
      
      // Création d'un utilisateur administrateur initial
      const adminResult = await executeSql(`
        INSERT INTO public.users (username, password, "fullName", role)
        VALUES ('AdamNoe', '68824c15044b11c5a901b4ba69e4411eec889102a72c9f339b8abf9fc98b0e52.0f5d3c1e5cd0d1a39d4a38e38c6ec94b', 'Adam Noe', 'admin')
        ON CONFLICT (username) DO NOTHING;
      `);
      
      if (adminResult.error) {
        log(`Erreur lors de la création de l'utilisateur admin: ${adminResult.error.message}`);
      } else {
        log('Utilisateur admin créé ou déjà existant');
      }
    }

    // Table vehicles
    log('--- Création de la table vehicles ---');
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
      log(`Erreur: ${vehiclesResult.error.message}`);
    } else {
      log('Succès: Table vehicles créée ou déjà existante');
    }

    // Table customers
    log('--- Création de la table customers ---');
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
      log(`Erreur: ${customersResult.error.message}`);
    } else {
      log('Succès: Table customers créée ou déjà existante');
    }

    // Table reservations
    log('--- Création de la table reservations ---');
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
      log(`Erreur: ${reservationsResult.error.message}`);
    } else {
      log('Succès: Table reservations créée ou déjà existante');
    }

    // Table invoices
    log('--- Création de la table invoices ---');
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
      log(`Erreur: ${invoicesResult.error.message}`);
    } else {
      log('Succès: Table invoices créée ou déjà existante');
    }

    // Table transactions
    log('--- Création de la table transactions ---');
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
      log(`Erreur: ${transactionsResult.error.message}`);
    } else {
      log('Succès: Table transactions créée ou déjà existante');
    }

    // Table maintenance_records
    log('--- Création de la table maintenance_records ---');
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
      log(`Erreur: ${maintenanceResult.error.message}`);
    } else {
      log('Succès: Table maintenance_records créée ou déjà existante');
    }

    // Table settings
    log('--- Création de la table settings ---');
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
      log(`Erreur: ${settingsResult.error.message}`);
    } else {
      log('Succès: Table settings créée ou déjà existante');
    }

    log('✓ Toutes les tables ont été configurées!');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Tables créées avec succès',
        logs
      })
    };
  } catch (error) {
    console.error('Erreur générale:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Erreur lors de la création des tables',
        error: error.message,
        logs
      })
    };
  }
};