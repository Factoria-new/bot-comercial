/**
 * Demo API Key Manager
 * Gerencia rotacao de chaves de API para o chat de demonstracao.
 * Quando uma chave atinge o limite (429), rotaciona para a proxima.
 */

let currentKeyIndex = 0;

const DEMO_KEYS = [
    process.env.DEMO_API_KEY_1,
    process.env.DEMO_API_KEY_2,
    process.env.DEMO_API_KEY_3
].filter(Boolean);

/**
 * Retorna a chave de API ativa no momento.
 */
export function getCurrentDemoKey() {
    if (DEMO_KEYS.length === 0) {
        console.warn('[Demo Keys] Nenhuma chave DEMO_API_KEY configurada no .env');
        return null;
    }
    return DEMO_KEYS[currentKeyIndex];
}

/**
 * Rotaciona para a proxima chave disponivel.
 * Retorna a nova chave ativa.
 */
export function rotateToNextKey() {
    if (DEMO_KEYS.length === 0) return null;

    const previousIndex = currentKeyIndex;
    currentKeyIndex = (currentKeyIndex + 1) % DEMO_KEYS.length;

    console.log(`[Demo Keys] Rotacionado de chave ${previousIndex + 1} para ${currentKeyIndex + 1}`);
    return DEMO_KEYS[currentKeyIndex];
}

/**
 * Retorna o numero total de chaves configuradas.
 */
export function getTotalKeys() {
    return DEMO_KEYS.length;
}

/**
 * Retorna o indice da chave atual (para logging/debug).
 */
export function getCurrentKeyIndex() {
    return currentKeyIndex;
}

export default {
    getCurrentDemoKey,
    rotateToNextKey,
    getTotalKeys,
    getCurrentKeyIndex
};
