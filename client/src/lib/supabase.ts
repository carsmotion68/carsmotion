import { createClient } from '@supabase/supabase-js'

// Supabase URLs et clé d'API qui seront fournis par les variables d'environnement
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Vérification de la présence des variables d'environnement
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Les variables d\'environnement Supabase ne sont pas définies');
}

// Création du client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);