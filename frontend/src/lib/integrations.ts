import { Integration } from '@/types/onboarding';

// Base integration data - omitting 'connected' since it's dynamic
type BaseIntegration = Omit<Integration, 'connected' | 'username'>;

export const INTEGRATIONS_LIST: BaseIntegration[] = [
    { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
    { id: 'instagram', name: 'Instagram', icon: 'instagram', color: '#E4405F' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook', color: '#1877F2' },
];

export const getIntegrations = (isWhatsAppConnected: boolean, isInstagramConnected: boolean = false): Integration[] => {
    return INTEGRATIONS_LIST.map(integration => ({
        ...integration,
        connected: integration.id === 'whatsapp' ? isWhatsAppConnected :
            integration.id === 'instagram' ? isInstagramConnected : false
    }));
};

