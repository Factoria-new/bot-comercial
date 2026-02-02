import { createContext, useContext, useEffect, useState, useCallback } from "react";
import API_CONFIG from "@/config/api";

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName?: string;
    role: "basic" | "pro" | "admin";
    plan?: string;
    period?: "monthly" | "semiannual" | "annual";
    hasPrompt?: boolean;
    isWhatsAppConnected?: boolean;
    hasGeminiApiKey?: boolean;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkSession: () => Promise<void>;
    updateUserPromptStatus: (hasPrompt: boolean) => void;
    updateUserApiKeyStatus: (hasApiKey: boolean) => void;
    checkWhatsAppInstance: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    checkSession: async () => { },
    updateUserPromptStatus: () => { },
    updateUserApiKeyStatus: () => { },
    checkWhatsAppInstance: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Check WhatsApp instance status for current user
    const checkWhatsAppInstance = useCallback(async (): Promise<boolean> => {
        if (!user?.uid) return false;

        try {
            const sessionId = `user_${user.uid}`;
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/whatsapp/status/${sessionId}`);
            const data = await response.json();

            const isConnected = data.status === 'connected';

            // Update user state with connection status
            setUser(prev => prev ? { ...prev, isWhatsAppConnected: isConnected } : null);

            return isConnected;
        } catch (error) {
            console.error('Failed to check WhatsApp instance:', error);
            return false;
        }
    }, [user?.uid]);

    const checkSession = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.decoded) {
                    const decoded = data.decoded;

                    // Fetch hasPrompt status from user prompt endpoint
                    let hasPrompt = false;
                    try {
                        const promptResponse = await fetch(`${API_CONFIG.BASE_URL}/api/user/prompt`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (promptResponse.ok) {
                            const promptData = await promptResponse.json();
                            hasPrompt = promptData.hasPrompt || false;
                        }
                    } catch (promptError) {
                        console.error('Failed to fetch prompt status:', promptError);
                    }

                    setUser({
                        uid: decoded.uid,
                        email: decoded.email,
                        role: decoded.role || 'basic',
                        plan: decoded.plan,
                        period: decoded.period,
                        displayName: decoded.displayName,
                        hasPrompt,
                        hasGeminiApiKey: decoded.hasGeminiApiKey || false // Ensure backend sends this in token, or we fetch it
                    });
                } else {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } else {
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (error) {
            console.error('Session verification failed:', error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser({
                uid: data.user.uid,
                email: data.user.email,
                role: data.user.role || 'basic',
                plan: data.user.plan,
                period: data.user.period,
                displayName: data.user.displayName,
                hasPrompt: data.user.hasPrompt || false,
                hasGeminiApiKey: data.user.hasGeminiApiKey || false
            });
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        // Also clear dashboard state from localStorage
        localStorage.removeItem('dashboard_state');
        setUser(null);
    };

    // Update user prompt status (called after prompt is created/saved)
    const updateUserPromptStatus = useCallback((hasPrompt: boolean) => {
        setUser(prev => prev ? { ...prev, hasPrompt } : null);
    }, []);

    // Update user API key status (called after key is set)
    const updateUserApiKeyStatus = useCallback((hasGeminiApiKey: boolean) => {
        setUser(prev => prev ? { ...prev, hasGeminiApiKey } : null);
    }, []);

    useEffect(() => {
        checkSession();
    }, []);

    // Check WhatsApp instance after user is set
    useEffect(() => {
        if (user?.uid && !loading) {
            checkWhatsAppInstance();
        }
    }, [user?.uid, loading, checkWhatsAppInstance]);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            checkSession,
            updateUserPromptStatus,
            updateUserApiKeyStatus,
            checkWhatsAppInstance
        }}>
            {children}
        </AuthContext.Provider>
    );
};
