-- Script SQL pour créer toutes les tables de l'application CARS MOTION
-- Exécuter ce script dans l'interface SQL de Supabase pour configurer la base de données

-- Extension pgcrypto pour la génération de UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table users
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table vehicles
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

-- Table customers
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

-- Table reservations
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

-- Table invoices
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

-- Table transactions
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

-- Table maintenance_records
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

-- Table settings
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

-- Création de l'utilisateur admin
INSERT INTO public.users (username, password, "fullName", role)
VALUES ('AdamNoe', '68824c15044b11c5a901b4ba69e4411eec889102a72c9f339b8abf9fc98b0e52.0f5d3c1e5cd0d1a39d4a38e38c6ec94b', 'Adam Noe', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Création des champs de recherche pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS vehicles_status_idx ON public.vehicles (status);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations (status);
CREATE INDEX IF NOT EXISTS reservations_dates_idx ON public.reservations ("startDate", "endDate");
CREATE INDEX IF NOT EXISTS invoices_status_idx ON public.invoices (status);
CREATE INDEX IF NOT EXISTS transactions_type_idx ON public.transactions (type);
CREATE INDEX IF NOT EXISTS transactions_date_idx ON public.transactions (date);

-- Ajouter des politiques de sécurité Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations (pour les fonctions d'API)
CREATE POLICY "Enable all operations for authenticated users" ON public.users FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.vehicles FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.reservations FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.maintenance_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON public.settings FOR ALL TO authenticated USING (true);