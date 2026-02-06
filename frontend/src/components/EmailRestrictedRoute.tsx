// import { Navigate } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
// import { Loader } from 'lucide-react';

interface EmailRestrictedRouteProps {
    children: React.ReactNode;
    // allowedEmail: string; // Temporarily unused
    allowedEmail: string;
}

const EmailRestrictedRoute = ({ children, allowedEmail }: EmailRestrictedRouteProps) => {
    // ⚠️ DO NOT COMMIT THIS CHANGE ⚠️
    // Local bypass enabled: Allow access without login/email check.
    // Apenas uma versão para eu acessar sem ter q fazer login, nada poderá ficar para commit.
    return <>{children}</>;
};

export default EmailRestrictedRoute;