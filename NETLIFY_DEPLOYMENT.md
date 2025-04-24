# Guide de déploiement sur Netlify

Ce document explique les étapes pour déployer CARS MOTION sur Netlify avec Supabase comme base de données.

## Prérequis

- Un compte Netlify (créez-en un sur [netlify.com](https://netlify.com) si nécessaire)
- Un projet Supabase (créez-en un sur [supabase.com](https://supabase.com) si nécessaire)
- Git installé sur votre ordinateur

## Étape 1 : Configurer les variables d'environnement dans Netlify

1. Connectez-vous à votre compte Netlify
2. Créez un nouveau site depuis Git
3. Sélectionnez votre dépôt GitHub, GitLab ou Bitbucket
4. Dans les paramètres de construction, ajoutez les variables d'environnement suivantes :

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
DATABASE_URL=postgres://postgres:your-password@your-project-id.supabase.co:5432/postgres
```

*Note: Ces valeurs se trouvent dans les paramètres de votre projet Supabase.*

## Étape 2 : Configurer la base de données Supabase

Vous avez deux options pour créer les tables dans votre base de données Supabase :

### Option 1 : Utiliser la fonction Netlify (recommandé)

Nous avons créé une fonction Netlify (`/.netlify/functions/create-tables`) qui se chargera automatiquement de créer toutes les tables nécessaires dans votre base de données Supabase.

1. Déployez d'abord votre application sur Netlify (voir Étape 3 ci-dessous)
2. Une fois le déploiement terminé, accédez à votre application déployée
3. Connectez-vous avec les identifiants administrateur (username: AdamNoe, password: 31/03/2025Location!)
4. Appelez la fonction de création des tables en exécutant cette commande dans la console de votre navigateur :

```javascript
fetch('/.netlify/functions/create-tables', { method: 'POST' })
  .then(response => response.json())
  .then(data => console.log('Résultat:', data))
  .catch(error => console.error('Erreur:', error));
```

### Option 2 : Exécuter le script SQL manuellement

Si vous préférez créer les tables manuellement :

1. Dans le tableau de bord Supabase, allez dans "SQL Editor"
2. Créez une nouvelle requête
3. Collez le script SQL qui se trouve dans le fichier `/scripts/schema.sql`
4. Exécutez le script
5. Vérifiez que toutes les tables ont été créées dans la section "Table Editor"

## Étape 3 : Déployer l'application

1. Cliquez sur "Deploy site" dans l'interface Netlify
2. Attendez que le déploiement soit terminé
3. Accédez à l'URL fournie par Netlify

## Étape 4 : Configurer un domaine personnalisé (optionnel)

1. Dans les paramètres du site Netlify, cliquez sur "Domain settings"
2. Suivez les instructions pour configurer votre domaine personnalisé

## Dépannage

Si vous rencontrez des problèmes :

1. Vérifiez les journaux de construction dans Netlify
2. Assurez-vous que toutes les variables d'environnement sont correctement configurées
3. Vérifiez que les tables ont été créées dans Supabase

## Support

Pour toute question ou assistance, contactez le support technique.