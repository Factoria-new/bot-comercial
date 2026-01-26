import { useCallback } from 'react';
import { auth } from '@/config/firebase';
import { toast } from 'sonner';

export const useAuthenticatedFetch = () => {
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    try {
      const user = auth.currentUser;

      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const token = await user.getIdToken();

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
        // Opcional: forçar logout ou redirecionar
        // navigate('/login'); // Precisa do hook useNavigate
      }

      return response;
    } catch (error) {
      console.error('Erro na requisição autenticada:', error);
      throw error;
    }
  }, []);

  return { authenticatedFetch };
};
