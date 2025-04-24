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

// Fonction pour comparer les mots de passe de manière sécurisée
async function comparePassword(plainPassword, hashedPassword) {
  try {
    // Le format du mot de passe hashé est "hashed.salt"
    const [hashed, salt] = hashedPassword.split('.');
    
    if (!hashed || !salt) {
      console.error('Format de mot de passe hashé invalide');
      return false;
    }
    
    // Utilisation de crypto pour créer un hash avec le même sel
    const crypto = require('crypto');
    const keyLen = 64;
    
    return new Promise((resolve, reject) => {
      crypto.scrypt(plainPassword, salt, keyLen, (err, derivedKey) => {
        if (err) {
          console.error('Erreur lors du hachage du mot de passe:', err);
          return resolve(false);
        }
        
        const suppliedHashedBuffer = Buffer.from(derivedKey).toString('hex');
        
        // Comparaison sécurisée des deux hashes
        const result = crypto.timingSafeEqual(
          Buffer.from(hashed, 'hex'),
          Buffer.from(suppliedHashedBuffer, 'hex')
        );
        
        resolve(result);
      });
    });
  } catch (error) {
    console.error('Erreur lors de la comparaison des mots de passe:', error);
    return false;
  }
}