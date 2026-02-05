import { useIntegrationsContext } from '@/contexts/IntegrationsContext';

export const useIntegrations = () => {
    const context = useIntegrationsContext();
    return context;
};
