import { Integration } from '@/types/onboarding';

// Base integration data - omitting 'connected' since it's dynamic
type BaseIntegration = Omit<Integration, 'connected' | 'username'>;

export const INTEGRATIONS_LIST: BaseIntegration[] = [
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
];

export const getIntegrations = (isWhatsAppConnected: boolean): Integration[] => {
    return INTEGRATIONS_LIST.map(integration => ({
        ...integration,
        connected: integration.id === 'whatsapp' ? isWhatsAppConnected : false
    }));
};
