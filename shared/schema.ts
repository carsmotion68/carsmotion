import { pgTable, text, serial, integer, boolean, numeric, json, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Vehicle table for fleet management
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate").notNull().unique(),
  fuelType: text("fuel_type").notNull(),
  mileage: integer("mileage").notNull(),
  purchaseType: text("purchase_type").notNull(),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(),
  monthlyPayment: numeric("monthly_payment", { precision: 10, scale: 2 }),
  contractDuration: integer("contract_duration"),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("available"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).pick({
  make: true,
  model: true,
  year: true,
  licensePlate: true,
  fuelType: true,
  mileage: true,
  purchaseType: true,
  purchasePrice: true,
  monthlyPayment: true,
  contractDuration: true,
  dailyRate: true,
  status: true,
  notes: true,
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

// Customer table for client information
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  postalCode: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Reservation table for bookings
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  customerId: integer("customer_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservations).pick({
  vehicleId: true,
  customerId: true,
  startDate: true,
  endDate: true,
  totalAmount: true,
  status: true,
  notes: true,
});

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

// Invoice table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  reservationId: integer("reservation_id"),
  customerId: integer("customer_id").notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("unpaid"), // unpaid, paid, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  invoiceNumber: true,
  reservationId: true,
  customerId: true,
  issueDate: true,
  dueDate: true,
  totalAmount: true,
  taxAmount: true,
  status: true,
  notes: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Transaction table for financial operations
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  type: text("type").notNull(), // income, expense
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  relatedTo: text("related_to"), // vehicle id, reservation id, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  date: true,
  type: true,
  category: true,
  amount: true,
  description: true,
  relatedTo: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Maintenance table for vehicle maintenance events
export const maintenanceRecords = pgTable("maintenance_records", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  type: text("type").notNull(), // service, repair, inspection
  date: date("date").notNull(),
  mileage: integer("mileage").notNull(),
  description: text("description").notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
  provider: text("provider"),
  invoiceReference: text("invoice_reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).pick({
  vehicleId: true,
  type: true,
  date: true,
  mileage: true,
  description: true,
  cost: true,
  provider: true,
  invoiceReference: true,
  notes: true,
});

export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;

// Settings table for application settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  companyAddress: text("company_address").notNull(),
  companyPhone: text("company_phone").notNull(),
  companyEmail: text("company_email").notNull(),
  vatNumber: text("vat_number"),
  bankDetails: text("bank_details"),
  logoUrl: text("logo_url"),
  lastBackupDate: timestamp("last_backup_date"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).pick({
  companyName: true,
  companyAddress: true,
  companyPhone: true,
  companyEmail: true,
  vatNumber: true,
  bankDetails: true,
  logoUrl: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
