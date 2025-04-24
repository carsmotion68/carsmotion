// Script pour créer les tables via l'API REST Supabase
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables d\'environnement SUPABASE_URL et SUPABASE_SERVICE_KEY nécessaires');
  process.exit(1);
}

console.log('Connexion à Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUsers() {
  console.log('Création de la table users...');
  
  const { error } = await supabase.from('users')
    .insert([{
      username: 'AdamNoe',
      password: '68824c15044b11c5a901b4ba69e4411eec889102a72c9f339b8abf9fc98b0e52.0f5d3c1e5cd0d1a39d4a38e38c6ec94b',
      fullName: 'Adam Noe',
      role: 'admin'
    }])
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') { // Code unique violation
      console.log('User AdamNoe already exists');
    } else {
      console.error('Erreur lors de la création du user:', error);
    }
  } else {
    console.log('User AdamNoe créé avec succès');
  }
}

async function createTables() {
  try {
    // Vérifier si la table users existe (comme test)
    console.log('Vérification de la présence des tables...');
    
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError && usersError.code === 'PGRST301') {
      console.log('Table users n\'existe pas. Veuillez créer les tables manuellement via SQL.');
      console.log('Utilisez le SQL fourni dans le fichier schema.sql');
    } else {
      console.log('Table users existe déjà.');
      
      // Essayer de créer l'utilisateur
      await createUsers();
      
      // Vérifier les autres tables
      const { data: vehiclesTable, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id')
        .limit(1);
      
      if (vehiclesError && vehiclesError.code === 'PGRST301') {
        console.log('Table vehicles n\'existe pas.');
      } else {
        console.log('Table vehicles existe déjà.');
      }
      
      // Vous pouvez ajouter d'autres vérifications ici
      
      console.log('Vérification des tables terminée.');
    }
    
  } catch (error) {
    console.error('Erreur générale:', error);
  }
}

// Exécution
createTables();