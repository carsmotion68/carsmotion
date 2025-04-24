const { createClient } = require('@supabase/supabase-js');

// Initialisation du client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  // Autoriser les requêtes CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Gérer les requêtes OPTIONS pour le CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS enabled' })
    };
  }

  // Traiter l'authentification selon la route
  const path = event.path.replace(/\/\.netlify\/functions\/auth\/?/, '');
  const body = JSON.parse(event.body || '{}');

  try {
    // Route de login
    if (path === 'login' && event.httpMethod === 'POST') {
      const { username, password } = body;
      
      // Récupérer l'utilisateur depuis Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error || !data) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Utilisateur non trouvé' })
        };
      }
      
      // Comparer le mot de passe (à remplacer par une vérification sécurisée)
      // Ici nous utiliserons une fonction de vérification basique
      const isPasswordValid = await comparePassword(password, data.password);
      
      if (!isPasswordValid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Mot de passe incorrect' })
        };
      }
      
      // Retourner l'utilisateur sans le mot de passe
      const { password: pwd, ...userWithoutPassword } = data;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userWithoutPassword)
      };
    }
    
    // Route de récupération de l'utilisateur courant
    if (path === 'user' && event.httpMethod === 'GET') {
      // Cette route nécessiterait normalement une vérification de token JWT
      // Mais pour simplifier, on va simuler cette partie
      const userId = event.headers.authorization;
      
      if (!userId) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Non autorisé' })
        };
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: 'Utilisateur non trouvé' })
        };
      }
      
      const { password, ...userWithoutPassword } = data;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userWithoutPassword)
      };
    }

    // Route par défaut si aucune des routes ci-dessus ne correspond
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Route non trouvée' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Erreur serveur', error: error.message })
    };
  }
};

// Fonction pour comparer les mots de passe (à remplacer par une implémentation sécurisée)
async function comparePassword(plainPassword, hashedPassword) {
  // Ceci est une implémentation simple, à remplacer par bcrypt ou argon2
  // Dans une vraie application, il faudrait utiliser une bibliothèque de cryptage
  const [hashed, salt] = hashedPassword.split('.');
  // Logique de validation du mot de passe à implémenter
  // Pour l'exemple, on retourne true si le mot de passe contient une partie du sel
  return plainPassword.includes(salt.substring(0, 3));
}