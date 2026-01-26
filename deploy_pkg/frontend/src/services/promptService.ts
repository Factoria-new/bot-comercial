// Prompt Service - Gerenciamento de prompt do agente
import API_CONFIG from "@/config/api";

export interface PromptResponse {
    success: boolean;
    prompt?: string | null;
    hasPrompt?: boolean;
    message?: string;
    error?: string;
}

const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
};

/**
 * Buscar prompt do usuário
 */
export const getPrompt = async (): Promise<PromptResponse> => {
    const token = getAuthToken();
    if (!token) {
        return { success: false, error: 'Não autenticado' };
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/prompt`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar prompt:', error);
        return { success: false, error: 'Erro de conexão' };
    }
};

/**
 * Salvar/atualizar prompt do usuário
 */
export const savePrompt = async (prompt: string): Promise<PromptResponse> => {
    const token = getAuthToken();
    if (!token) {
        return { success: false, error: 'Não autenticado' };
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/user/prompt`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao salvar prompt:', error);
        return { success: false, error: 'Erro de conexão' };
    }
};

export const promptService = {
    getPrompt,
    savePrompt,
    architectChat: async (message: string, history: any[], currentSystemPrompt: string) => {
        const token = getAuthToken();
        if (!token) return { success: false, error: 'Não autenticado' };

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/agent/architect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message,
                    history,
                    currentSystemPrompt,
                    userId: 'user' // Backend expects this?
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro no chat com a Lia:', error);
            return { success: false, error: 'Erro de conexão' };
        }
    }
};

export default promptService;
