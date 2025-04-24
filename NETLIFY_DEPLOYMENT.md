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

1. Dans le tableau de bord Supabase, allez dans "SQL Editor"
2. Exécutez le script SQL suivant pour créer les tables nécessaires :

```sql
-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des véhicules
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  "licensePlate" TEXT NOT NULL,
  "fuelType" TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  "purchaseType" TEXT NOT NULL,
  "purchasePrice" DECIMAL NOT NULL,
  "monthlyPayment" DECIMAL,
  "contractDuration" INTEGER,
  "insuranceMonthlyFee" DECIMAL,
  "dailyRate" DECIMAL NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des clients
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  "postalCode" TEXT,
  country TEXT,
  "licenseNumber" TEXT,
  "licenseIssueDate" TEXT,
  "licenseExpiryDate" TEXT,
  "depositType" TEXT,
  "depositAmount" DECIMAL,
  "depositReference" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des réservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId" UUID NOT NULL,
  "customerId" UUID NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "totalAmount" DECIMAL NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id),
  FOREIGN KEY ("customerId") REFERENCES public.customers(id)
);

-- Table des factures
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceNumber" TEXT NOT NULL,
  "reservationId" UUID,
  "customerId" UUID NOT NULL,
  "issueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "totalAmount" DECIMAL NOT NULL,
  "taxAmount" DECIMAL NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("reservationId") REFERENCES public.reservations(id),
  FOREIGN KEY ("customerId") REFERENCES public.customers(id)
);

-- Table des transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  description TEXT NOT NULL,
  "relatedTo" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des enregistrements de maintenance
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "vehicleId" UUID NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  mileage INTEGER NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL NOT NULL,
  provider TEXT,
  "invoiceReference" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY ("vehicleId") REFERENCES public.vehicles(id)
);

-- Table des paramètres
CREATE TABLE IF NOT EXISTS public.settings (
  id SERIAL PRIMARY KEY,
  "companyName" TEXT NOT NULL,
  "companyAddress" TEXT NOT NULL,
  "companyPhone" TEXT NOT NULL,
  "companyEmail" TEXT NOT NULL,
  "vatNumber" TEXT,
  "bankDetails" TEXT,
  "logoUrl" TEXT,
  "lastBackupDate" TIMESTAMP WITH TIME ZONE
);

-- Création d'un utilisateur administrateur initial (mot de passe: 31/03/2025Location!)
INSERT INTO public.users (username, password, "fullName", role)
VALUES ('AdamNoe', '68824c15044b11c5a901b4ba69e4411eec889102a72c9f339b8abf9fc98b0e52.0f5d3c1e5cd0d1a39d4a38e38c6ec94b', 'Adam Noe', 'admin')
ON CONFLICT (username) DO NOTHING;
```

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