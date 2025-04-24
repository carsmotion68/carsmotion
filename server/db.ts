import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

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
// On utilise l'URL de connexion fournie par Supabase dans DATABASE_URL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configuration du client PostgreSQL pour Drizzle ORM
const client = postgres(connectionString, {
  max: 10, // Nombre maximum de connexions
  idle_timeout: 20, // Temps d'inactivité avant de fermer une connexion
  connect_timeout: 10, // Temps d'attente pour établir une connexion
});

// Initialisation de Drizzle avec notre client PostgreSQL et notre schéma
export const db = drizzle(client, { schema });
