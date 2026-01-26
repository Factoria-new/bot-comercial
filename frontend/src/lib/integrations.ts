import { Integration } from '@/types/onboarding';

// Base integration data - omitting 'connected' since it's dynamic
type BaseIntegration = Omit<Integration, 'connected' | 'username'>;

export const INTEGRATIONS_LIST: BaseIntegration[] = [
    { id: 'instagram', name: 'Instagram', icon: 'instagram', color: '#E1306C', isComingSoon: true },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#1877F2', isComingSoon: true },
];

export const getIntegrations = (isWhatsAppConnected: boolean): Integration[] => {
    return INTEGRATIONS_LIST.map(integration => ({
        ...integration,
        connected: integration.id === 'whatsapp' ? isWhatsAppConnected : false
    }));
};
