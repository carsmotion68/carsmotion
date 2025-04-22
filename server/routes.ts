import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // This application is completely client-side with all data stored in localStorage
  // There are no server-side routes for API calls since it runs 100% offline
  
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  const httpServer = createServer(app);

  return httpServer;
}
