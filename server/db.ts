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

// Obtenir la chaîne de connexion de la base de données
// Nous avons deux options de connexion possibles (base de données directe ou pooler)
let connectionString = process.env.DATABASE_URL;

// Si l'URL n'est pas spécifiée ou est l'ancienne URL, utiliser l'URL du pooler codée en dur
if (!connectionString || connectionString.includes('db.kuepctbdkdmujaltwzpu.supabase.co:5432')) {
  // Format pooler: postgres://postgres.PROJECT_REF:PASSWORD@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
  connectionString = 'postgres://postgres.kuepctbdkdmujaltwzpu:Ahasiaup208!@aws-0-eu-west-3.pooler.supabase.com:6543/postgres';
  console.log('Utilisation de l\'URL du pooler Supabase (hardcodée)');
}

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
    ssl: { rejectUnauthorized: false }, // Pour les connexions sécurisées
    // Augmenter les délais pour éviter les déconnexions
    statement_timeout: 10000, // 10 secondes
    query_timeout: 10000, // 10 secondes
    connectionTimeoutMillis: 10000, // 10 secondes
    idle_in_transaction_session_timeout: 10000 // 10 secondes
  });
  console.log('Connexion à la base de données établie avec succès');
} catch (error) {
  console.error('Erreur lors de la connexion à la base de données:', error);
  throw error;
}

// Initialisation de Drizzle avec notre client PostgreSQL et notre schéma
export const db = drizzle(pool, { schema });