import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Configuration de Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'dummy-key-for-development';

// Vérification en mode production uniquement
if (process.env.NODE_ENV === 'production' && (!supabaseUrl || !supabaseKey)) {
  throw new Error(
    "Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies en production.",
  );
}

// Création du client Supabase (utilisation de createClient avec des valeurs par défaut en développement)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration de la connexion PostgreSQL directe pour Drizzle ORM
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Client PostgreSQL pour Drizzle ORM
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
