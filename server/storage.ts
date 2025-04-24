import { users, type User, type InsertUser } from "@shared/schema";
import { db, supabase } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: any; // Type explicite de session.Store crée des problèmes
}

// Créer un store en mémoire pour les sessions
const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    // Utiliser un stockage mémoire pour les sessions
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 heures
    });
    // À remplacer par une implémentation Supabase une fois le backend déployé
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
