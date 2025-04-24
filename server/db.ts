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
const connectionString = process.env.DATABASE_URL;

// Vérification des variables d'environnement Supabase
if (!supabaseUrl || !supabaseKey) {
  console.error('Variables Supabase manquantes:', { 
    supabaseUrl: !!supabaseUrl, 
    supabaseKey: !!supabaseKey 
  });
  throw new Error(
    "Les variables d'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définies.",
  );
}

console.log('Connexion à Supabase URL:', supabaseUrl);

// Création du client Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration de la connexion PostgreSQL directe pour Drizzle ORM
if (!connectionString) {
  console.error('Variable DATABASE_URL manquante');
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Log de connexion (sans afficher le mot de passe)
console.log('Connexion à PostgreSQL avec:', connectionString.replace(/:[^:]*@/, ':***@'));

// Créer un pool de connexions avec @neondatabase/serverless
let pool: Pool;
try {
  pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false } // Pour les connexions sécurisées
  });
  console.log('Connexion à la base de données établie avec succès');
} catch (error) {
  console.error('Erreur lors de la connexion à la base de données:', error);
  throw error;
}

// Initialisation de Drizzle avec notre client PostgreSQL et notre schéma
export const db = drizzle(pool, { schema });