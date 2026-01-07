export const INTEGRATIONS_LIST = [
    { id: 'whatsapp', name: 'WhatsApp', color: '#25D366' },
    { id: 'instagram', name: 'Instagram', color: '#E4405F' },
    { id: 'facebook', name: 'Facebook', color: '#1877F2' },
];

export const getIntegrations = (isWhatsAppConnected: boolean, isInstagramConnected: boolean = false) => {
    return INTEGRATIONS_LIST.map(integration => ({
        ...integration,
        connected: integration.id === 'whatsapp' ? isWhatsAppConnected :
            integration.id === 'instagram' ? isInstagramConnected : false
    }));
};
