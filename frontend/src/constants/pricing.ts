/**
 * Centralized Pricing Configuration
 * Defines the base monthly price and current discount strategies.
 * All other prices are derived from these two values.
 */

export const PRICING_CONFIG = {
    MONTHLY_PRICE: 49.90,
    YEARLY_DISCOUNT_PERCENTAGE: 50, // 17% discount
};

// Derived Calculations

// Annual Price (Total for 12 months with discount)
// Formula: Monthly * 12 * (1 - Discount/100)
// Current Target: ~198.20 (closely matching the old 199.00)
export const ANNUAL_PRICE_TOTAL =
    PRICING_CONFIG.MONTHLY_PRICE * 12 * (1 - PRICING_CONFIG.YEARLY_DISCOUNT_PERCENTAGE / 100);

// Annual Price (Monthly Equivalent)
// Formula: Annual Total / 12
export const ANNUAL_PRICE_MONTHLY = ANNUAL_PRICE_TOTAL / 12;

// Semi-Annual Price (Total for 6 months)
// Currently no discount applied to semi-annual in the original code (19.90 * 6 = 119.40)
export const SEMI_ANNUAL_PRICE = PRICING_CONFIG.MONTHLY_PRICE * 6;

// Formatter helper
export const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Raw formatted strings for display (without R$ or with specific formatting if needed)
export const PRICING_DISPLAY = {
    monthly: formatCurrency(PRICING_CONFIG.MONTHLY_PRICE),
    // For annual total, we often want "199,00" or similar clean number. 
    // The calculation 19.90 * 12 * 0.83 = 198.204.
    // If the user preferred exactly 199.00, we might need to adjust, but based on "Math based",
    // we use the calculated value. We will round typical for e-commerce.
    annualTotal: formatCurrency(ANNUAL_PRICE_TOTAL),
    annualMonthly: formatCurrency(ANNUAL_PRICE_MONTHLY),
    semiAnnual: formatCurrency(SEMI_ANNUAL_PRICE),
    discountPercentage: `${PRICING_CONFIG.YEARLY_DISCOUNT_PERCENTAGE}%`
};

/**
 * Hook or Helper to get price for payment links/state
 */
export const getPriceState = (period: 'monthly' | 'semiannual' | 'annual') => {
    switch (period) {
        case 'monthly':
            return `${formatCurrency(PRICING_CONFIG.MONTHLY_PRICE)}/mês`;
        case 'semiannual':
            return `${formatCurrency(SEMI_ANNUAL_PRICE)}/semestre`;
        case 'annual':
            return `${formatCurrency(ANNUAL_PRICE_TOTAL)}/ano`;
    }
};
