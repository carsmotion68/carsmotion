import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Configurer Neon pour utiliser WebSocket
neonConfig.webSocketConstructor = ws;

// Configuration de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Vérification des variables d'environnement Supabase
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies.",
  );
}

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration de la connexion PostgreSQL directe pour Drizzle ORM
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Créer un pool de connexions avec @neondatabase/serverless
const pool = new Pool({ connectionString });

// Initialisation de Drizzle avec notre client PostgreSQL et notre schéma
export const db = drizzle(pool, { schema });
