import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure l'authentification et ajoute les routes /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // Création des routes API pour sauvegarder les données en base de données
  // Ces routes seront implémentées progressivement pour remplacer le stockage localStorage
  
  const httpServer = createServer(app);

  return httpServer;
}
