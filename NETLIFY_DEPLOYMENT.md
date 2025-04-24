# Guide de déploiement sur Netlify avec Supabase

Ce guide explique comment déployer l'application CARS MOTION sur Netlify en utilisant Supabase comme base de données.

## Prérequis

1. Un compte Netlify
2. Un projet Supabase (déjà configuré)
3. Les informations d'identification Supabase :
   - URL du projet : `https://kuepctbdkdmujaltwzpu.supabase.co`
   - Clé anon : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZXBjdGJka2RtdWphbHR3enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzMjUwNzMsImV4cCI6MjAyOTkwMTA3M30.EfTpDVH2AcJfAUGZWHNsDYiR-V1jq_-3Z1O11MqGR5A`
   - Clé service : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZXBjdGJka2RtdWphbHR3enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDMyNTA3MywiZXhwIjoyMDI5OTAxMDczfQ.yJa0TCi9DAIISm6RV9rIHdqkYgxAIq-VW9hvPQ8p_IU`
   - URL de la base de données (standard) : `postgresql://postgres:Ahasiaup208!@db.kuepctbdkdmujaltwzpu.supabase.co:5432/postgres`
   - URL de la base de données (pooler) : `postgres://postgres.kuepctbdkdmujaltwzpu:Ahasiaup208!@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`

## Configuration de la base de données Supabase

### Option 1 : Création des tables via l'interface SQL de Supabase

1. Connectez-vous à votre compte Supabase et accédez à votre projet
2. Naviguez vers l'onglet "SQL Editor"
3. Copiez le contenu du fichier `scripts/schema.sql` dans l'éditeur
4. Exécutez le script SQL qui créera toutes les tables nécessaires

### Option 2 : Création automatique via la fonction Netlify

L'application inclut une fonction Netlify (`functions/create-tables.js`) qui tentera de créer les tables automatiquement lors du déploiement. 

**Note importante** : Pour que cette fonction fonctionne, vous devez créer une fonction RPC dans Supabase qui permet d'exécuter du SQL arbitraire. Voici comment procéder :

1. Dans l'interface Supabase, allez dans "Database" > "Functions" > "New function"
2. Créez une fonction nommée `execute_sql` avec le code suivant :

```sql
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
```

3. Assurez-vous que cette fonction est disponible pour le rôle de service (`service_role`)

## Déploiement sur Netlify

### Étape 1 : Préparation du projet

Le projet est déjà configuré pour Netlify avec les fichiers suivants :
- `netlify.toml` : Configuration du déploiement
- `functions/` : Dossier contenant les fonctions serverless

### Étape 2 : Déploiement initial

1. Connectez-vous à votre compte Netlify
2. Cliquez sur "New site from Git"
3. Sélectionnez votre dépôt Git
4. Configurez les paramètres de build :
   - Build command : `npm run build`
   - Publish directory : `client/dist`

### Étape 3 : Configuration des variables d'environnement

Dans les paramètres du site Netlify, ajoutez les variables d'environnement suivantes :

```
SUPABASE_URL=https://kuepctbdkdmujaltwzpu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZXBjdGJka2RtdWphbHR3enB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQzMjUwNzMsImV4cCI6MjAyOTkwMTA3M30.EfTpDVH2AcJfAUGZWHNsDYiR-V1jq_-3Z1O11MqGR5A
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1ZXBjdGJka2RtdWphbHR3enB1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNDMyNTA3MywiZXhwIjoyMDI5OTAxMDczfQ.yJa0TCi9DAIISm6RV9rIHdqkYgxAIq-VW9hvPQ8p_IU
DATABASE_URL=postgres://postgres.kuepctbdkdmujaltwzpu:Ahasiaup208!@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

### Étape 4 : Déploiement et vérification

1. Déclenchez un nouveau déploiement sur Netlify
2. Vérifiez les logs de la fonction `create-tables` pour vous assurer que les tables ont été créées correctement
3. Si la fonction échoue, vous devrez créer les tables manuellement via l'option 1

## Migration des données depuis la version locale

Si vous disposez déjà d'une version locale de l'application avec des données, vous pouvez les migrer vers Supabase :

1. Utilisez la fonction d'exportation dans l'application (dans les paramètres) pour exporter toutes les données
2. Connectez-vous à l'application déployée avec votre compte administrateur
3. Utilisez la fonction d'importation pour restaurer toutes les données

## Dépannage

### Les tables ne sont pas créées automatiquement

Si les tables ne sont pas créées automatiquement lors du déploiement :

1. Vérifiez les logs de la fonction `create-tables` sur Netlify
2. Assurez-vous que les variables d'environnement sont correctement configurées
3. Créez manuellement les tables en utilisant le script SQL fourni

### Problèmes de connexion à la base de données

Si l'application ne parvient pas à se connecter à la base de données :

1. Vérifiez que les variables d'environnement sont correctes
2. Assurez-vous que les politiques de sécurité RLS (Row Level Security) sont correctement configurées
3. Vérifiez les paramètres réseau de Supabase pour vous assurer que les connexions depuis Netlify sont autorisées

## Support

Pour toute assistance supplémentaire, contactez l'équipe de support ou consultez la documentation en ligne de Netlify et Supabase.