import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: "basic" | "pro" | "admin";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-8 h-8 text-[#243B6B] animate-spin" />
                    <p className="text-gray-600">Verificando autenticação...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role check
    if (requiredRole) {
        // If user doesn't have the required role (and isn't admin)
        if (user.role !== requiredRole && user.role !== "admin") {
            // You could redirect to a "Upgrade Plan" page or similar
            // For now, maybe just redirect to dashboard or show forbidden?
            // Let's redirect to dashboard if they try to access a pro route
            // But if they ARE at dashboard, this might loop if dashboard requires pro.
            // Assumption: Dashboard is basic.
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
