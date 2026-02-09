/**
 * ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE MANUALMENTE
 * Para atualizar, rode: node backend/scripts/sync-stripe-prices.js
 * Data: 2026-02-09T14:39:38.034Z
 */

export const STRIPE_CONFIG = {
    COUPON_ANNUAL: 'CAJI50',
    DISCOUNT_PERCENTAGE: 50,
    PRODUCTS: {
        "monthly": {
            "productId": "prod_TwoY6A64Pf4Sg8",
            "priceId": "price_1SyuvXEz11WiJQwkEORS4bH0",
            "amount": 49.9,
            "label": "Mensal"
        },
        "semiannual": {
            "productId": "prod_TwoWaOaLiPIbZw",
            "priceId": "price_1SyutkEz11WiJQwkqHYNNJcI",
            "amount": 299.4,
            "label": "Semestral"
        },
        "annual": {
            "productId": "prod_TwoO9W7rePUXZZ",
            "priceId": "price_1Syum9Ez11WiJQwkZ34eXFbn",
            "amount": 499.9,
            "label": "Anual"
        }
    }
} as const;

export const PRICING_DISPLAY = {
    monthly: STRIPE_CONFIG.PRODUCTS.monthly.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    semiannual: STRIPE_CONFIG.PRODUCTS.semiannual.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    semiannualMonthly: (STRIPE_CONFIG.PRODUCTS.semiannual.amount / 6).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    annualTotal: STRIPE_CONFIG.PRODUCTS.annual.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    // Valor total anual com desconto
    annualTotalDiscounted: (STRIPE_CONFIG.PRODUCTS.annual.amount * (1 - STRIPE_CONFIG.DISCOUNT_PERCENTAGE / 100)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    // Valor mensal equivalente do anual (com o desconto do cupom aplicado se for percentual)
    annualMonthly: ((STRIPE_CONFIG.PRODUCTS.annual.amount * (1 - STRIPE_CONFIG.DISCOUNT_PERCENTAGE / 100)) / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    discountPercentage: `${STRIPE_CONFIG.DISCOUNT_PERCENTAGE}%`
};

export const getPriceState = (period: 'monthly' | 'semiannual' | 'annual') => {
    switch (period) {
        case 'monthly':
            return `${PRICING_DISPLAY.monthly}/mês`;
        case 'semiannual':
            return `${PRICING_DISPLAY.semiannual}/semestre`;
        case 'annual':
            return `${PRICING_DISPLAY.annualTotal}/ano`;
    }
};
