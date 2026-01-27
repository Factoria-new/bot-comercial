import { useCallback } from 'react';
import { toast } from 'sonner';

export const useAuthenticatedFetch = () => {
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('Usuário não autenticado (sem token)');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token inválido ou expirado
        toast.error("Sessão expirada. Por favor faça login novamente.");
        // Opcional: limpar token local
        localStorage.removeItem('token');
        // window.location.href = '/login'; // Opcional: forçar redirecionamento
      }

      return response;
    } catch (error) {
      console.error('Erro na requisição autenticada:', error);
      throw error;
    }
  }, []);

  return { authenticatedFetch };
};
