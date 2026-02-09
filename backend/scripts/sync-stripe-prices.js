import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const Stripe = require('stripe');

console.log('📦 Stripe imported via require');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📂 Loading .env from:', path.join(__dirname, '../.env'));
const result = dotenv.config({ path: path.join(__dirname, '../.env') });

if (result.error) {
    console.error('❌ Error loading .env:', result.error);
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
console.log('🔑 Stripe key status:', STRIPE_SECRET_KEY ? 'Presente' : 'Ausente');


if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY não encontrado no .env');
    process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

const PRODUCTS_MAP = {
    monthly: 'prod_TwoY6A64Pf4Sg8',      // Plano Essential Mensal
    semiannual: 'prod_TwoWaOaLiPIbZw',  // Plano Essential Semestral
    annual: 'prod_TwoO9W7rePUXZZ'       // Plano Essential Anual
};

const COUPON_ID = 'CAJI50';

async function syncPrices() {
    console.log('🔄 Iniciando sincronização de preços com Stripe...');

    const pricingConfig = {
        COUPON_ANNUAL: COUPON_ID,
        PRODUCTS: {}
    };

    try {
        for (const [key, productId] of Object.entries(PRODUCTS_MAP)) {
            console.log(`🔍 Buscando preço para ${key} (${productId})...`);

            const prices = await stripe.prices.list({
                product: productId,
                active: true,
                limit: 1
            });

            if (prices.data.length === 0) {
                console.warn(`⚠️ Nenhum preço ativo encontrado para o produto ${productId} (${key})`);
                continue;
            }

            const price = prices.data[0];
            const amount = price.unit_amount / 100;

            pricingConfig.PRODUCTS[key] = {
                productId: productId,
                priceId: price.id,
                amount: amount,
                label: key === 'monthly' ? 'Mensal' : key === 'semiannual' ? 'Semestral' : 'Anual'
            };

            console.log(`✅ ${key}: R$ ${amount} (${price.id})`);
        }

        // Calcular desconto anual para exibição
        const monthlyPrice = pricingConfig.PRODUCTS.monthly?.amount || 0;
        const annualPriceTotal = pricingConfig.PRODUCTS.annual?.amount || 0;

        let discountPercentage = 0;
        if (monthlyPrice > 0 && annualPriceTotal > 0) {
            // Comparando custo mensal x custo anual mensalizado
            // Anual total já é o valor com desconto do produto (se configurado assim no Stripe)
            // OU se o desconto é via CUPOM, o preço base do produto anual pode ser cheio?
            // O usuário disse: "O plano anual terá um desconto e para isso usamos o cupom da stripe"
            // Isso implica que o PREÇO do produto anual pode ser:
            // 1. O preço cheio (ex: 12 * mensal), e o cupom aplica o desconto no checkout via backend.
            // 2. Ou o preço já é reduzido e o cupom é EXTRA?
            // O user disse: "todo o plano anual deverá ter esse desconto: CUPOM ID ...".
            // Assumiremos que o preço recuperado é o BASE, e o desconto é aplicado visualmente e no checkout.

            // Se o desconto é via cupom, precisamos saber o valor do cupom para calcular o display.
            // Vamos buscar o cupom também?
            try {
                const coupon = await stripe.coupons.retrieve(COUPON_ID);
                if (coupon && coupon.valid) {
                    if (coupon.percent_off) {
                        discountPercentage = coupon.percent_off;
                        console.log(`🎉 Cupom encontrado: ${coupon.name} (${coupon.percent_off}% OFF)`);
                    } else if (coupon.amount_off) {
                        console.log(`🎉 Cupom de valor fixo: -${coupon.amount_off}`);
                        // Lógica de porcentagem ficaria complexa, vamos focar em percent_off por enquanto ou ignorar
                    }
                }
            } catch (err) {
                console.warn('⚠️ Não foi possível recuperar o cupom (pode ser ID de PromoCode em vez de Coupon direct?):', err.message);
                // Se falhar, mantemos 0 ou usamos hardcoded se o user preferir, mas o script tenta ser dinâmico.
                // O ID parece ser de uma Promotion Code (promo_...) ou Coupon? IDs de cupom geralmente começam com nada específico ou cup_... promo_ geralmente é PromotionCode.
                // Mas a API de coupons retrieve aceita ID de cupom. Se for promo code, é diferente.
                // O user disse "CUPOM ID : promo_...". "promo_" geralmente é Promotion Code objeto, que TEM um coupon.
            }
        }

        // Gerar conteúdo do arquivo TS
        const tsContent = `/**
 * ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE MANUALMENTE
 * Para atualizar, rode: node backend/scripts/sync-stripe-prices.js
 * Data: ${new Date().toISOString()}
 */

export const STRIPE_CONFIG = {
    COUPON_ANNUAL: '${COUPON_ID}',
    DISCOUNT_PERCENTAGE: ${discountPercentage},
    PRODUCTS: ${JSON.stringify(pricingConfig.PRODUCTS, null, 4)}
} as const;

export const PRICING_DISPLAY = {
    monthly: STRIPE_CONFIG.PRODUCTS.monthly.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    semiannual: STRIPE_CONFIG.PRODUCTS.semiannual.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    annualTotal: STRIPE_CONFIG.PRODUCTS.annual.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    // Valor mensal equivalente do anual (com o desconto do cupom aplicado se for percentual)
    annualMonthly: ((STRIPE_CONFIG.PRODUCTS.annual.amount * (1 - STRIPE_CONFIG.DISCOUNT_PERCENTAGE / 100)) / 12).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    discountPercentage: \`\${STRIPE_CONFIG.DISCOUNT_PERCENTAGE}%\`
};

export const getPriceState = (period: 'monthly' | 'semiannual' | 'annual') => {
    switch (period) {
        case 'monthly':
            return \`\${PRICING_DISPLAY.monthly}/mês\`;
        case 'semiannual':
            return \`\${PRICING_DISPLAY.semiannual}/semestre\`;
        case 'annual':
            return \`\${PRICING_DISPLAY.annualTotal}/ano\`;
    }
};
`;

        const outputPath = path.join(__dirname, '../../frontend/src/constants/pricing.ts');
        fs.writeFileSync(outputPath, tsContent);

        console.log(`✅ Arquivo de preços atualizado com sucesso em: ${outputPath}`);

    } catch (error) {
        console.error('❌ Erro ao sincronizar preços:', error);
        process.exit(1);
    }
}

syncPrices();
