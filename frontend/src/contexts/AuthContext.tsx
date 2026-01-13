import { createContext, useContext, useEffect, useState } from "react";
import API_CONFIG from "@/config/api";

export interface UserProfile {
    uid: string;
    email: string | null;
    role: "basic" | "pro" | "admin";
    displayName?: string;
    // Add other fields from Firestore as needed
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: () => { },
    checkSession: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

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
                    // We need to fetch the full user profile if not in token, or trust token claims
                    // For now, trusting token claims for basic info
                    setUser({
                        uid: decoded.uid,
                        email: decoded.email,
                        role: decoded.role || 'basic',
                        displayName: decoded.displayName
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
                ...data.user
            });
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    useEffect(() => {
        checkSession();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>
            {children}
        </AuthContext.Provider>
    );
};
