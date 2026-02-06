import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader } from 'lucide-react';

interface EmailRestrictedRouteProps {
    children: React.ReactNode;
    allowedEmail: string;
}

const EmailRestrictedRoute = ({ children, allowedEmail }: EmailRestrictedRouteProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-8 h-8 text-[#243B6B] animate-spin" />
                    <p className="text-gray-600">Verificando permissões...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (user.email !== allowedEmail) {
        // Redirect to home if logged in but wrong email
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default EmailRestrictedRoute;