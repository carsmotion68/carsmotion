import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  username: string;
  fullName: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });
  
  const { toast } = useToast();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('carsmotion_auth');
    
    if (savedAuth) {
      try {
        const user = JSON.parse(savedAuth);
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false
        });
      } catch (error) {
        console.error('Failed to parse auth data:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    } else {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    // For this offline demo, we'll just hard-code the credentials
    // In a real app, this would make an API call or use a more secure authentication method
    if (username === 'AdamNoe' && password === '31/03/2025Location!') {
      const user = {
        username: 'AdamNoe',
        fullName: 'Adam Noe',
        role: 'admin'
      };
      
      localStorage.setItem('carsmotion_auth', JSON.stringify(user));
      
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false
      });
      
      toast({
        title: 'Connexion réussie',
        description: `Bienvenue, ${user.fullName}`,
      });
      
      return true;
    }
    
    toast({
      variant: 'destructive',
      title: 'Échec de la connexion',
      description: 'Identifiants incorrects. Veuillez réessayer.',
    });
    
    return false;
  }, [toast]);

  const logout = useCallback(() => {
    localStorage.removeItem('carsmotion_auth');
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    
    toast({
      title: 'Déconnexion',
      description: 'Vous avez été déconnecté avec succès.',
    });
  }, [toast]);

  return {
    ...authState,
    login,
    logout
  };
}
