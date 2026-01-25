// Auth Service - Gerenciamento de autenticação com Prisma/Supabase
// Migrado de Firebase/Firestore para Prisma/PostgreSQL

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_dev';
const SALT_ROUNDS = 10;

/**
 * Gera um token de sessão padronizado
 * @param {object} user - Objeto do usuário
 * @returns {string} Token JWT
 */
export const generateSessionToken = (user) => {
    return jwt.sign(
        {
            uid: user.id,
            email: user.email,
            role: user.role,
            hasGeminiApiKey: !!user.geminiApiKey
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * Cria um novo usuário (estado Pending) - chamado após pagamento
 * @param {string} email - Email do usuário
 * @param {string} name - Nome do usuário (opcional)
 * @returns {Promise<string>} Token de ativação
 */
export const createPendingUser = async (email, name) => {
    // Verificar se usuário já existe
    let user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        // Usuário já existe, atualizar nome se não estiver definido
        if (name && !user.displayName) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { displayName: name }
            });
        }
    } else {
        // Criar novo usuário
        user = await prisma.user.create({
            data: {
                email,
                displayName: name || '',
                role: 'basic',
                status: 'pending'
            }
        });
    }

    // Gerar Token de Ativação (válido por 24h)
    const token = jwt.sign(
        { uid: user.id, email, type: 'activation' },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return token;
};

/**
 * Solicitar reset de senha
 * @param {string} email - Email do usuário
 * @returns {Promise<string>} Token de reset
 */
export const requestPasswordReset = async (email) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const token = jwt.sign(
        { uid: user.id, email, type: 'reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    return token;
};

/**
 * Definir senha (Ativação ou Reset)
 * @param {string} token - Token de ativação/reset
 * @param {string} password - Nova senha
 * @returns {Promise<string>} Token de sessão
 */
export const setPassword = async (token, password) => {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!['activation', 'reset'].includes(decoded.type)) {
        throw new Error('Invalid token type');
    }

    const { uid } = decoded;

    const user = await prisma.user.findUnique({
        where: { id: uid }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.user.update({
        where: { id: uid },
        data: {
            password: hashedPassword,
            status: 'active'
        }
    });

    // Retornar novo token de sessão com role
    // Note: user object loaded above needs to have geminiApiKey populated if we want it in token.
    // prisma.findUnique default doesn't guarantee select fields unless specified or all scalars returned.
    // By default findUnique returns all scalars.
    const sessionToken = generateSessionToken({ ...user, geminiApiKey: user.geminiApiKey });

    return sessionToken;
};

/**
 * Login
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = async (email, password) => {
    let user;
    try {
        user = await prisma.user.findUnique({
            where: { email }
        });
    } catch (error) {
        // Log detailed error for debugging but return generic message to user
        console.error(`Database error during login for ${email}:`, error);
        throw new Error('Email ou senha incorretos');
    }

    if (!user) {
        throw new Error('Email ou senha incorretos');
    }

    if (!user.password) {
        throw new Error('Conta não ativada ou método de login inválido');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Error('Email ou senha incorretos');
    }

    const sessionToken = generateSessionToken(user);

    return {
        token: sessionToken,
        user: {
            uid: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
            status: user.status,
            plan: user.plan,
            subscriptionStatus: user.subscriptionStatus,
            hasPrompt: !!user.customPrompt,
            hasGeminiApiKey: !!user.geminiApiKey
        }
    };
};

/**
 * Verificar token JWT
 * @param {string} token - Token JWT
 * @returns {Promise<object>} Dados decodificados do token
 */
export const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

/**
 * Buscar usuário por email
 * @param {string} email - Email do usuário
 * @returns {Promise<object|null>}
 */
export const getUserByEmail = async (email) => {
    return await prisma.user.findUnique({
        where: { email }
    });
};

/**
 * Buscar usuário por ID
 * @param {string} id - ID do usuário
 * @returns {Promise<object|null>}
 */
export const getUserById = async (id) => {
    return await prisma.user.findUnique({
        where: { id }
    });
};

/**
 * Atualizar dados de assinatura do usuário
 * @param {string} userId - ID do usuário
 * @param {object} subscriptionData - Dados da assinatura
 * @returns {Promise<object>}
 */
export const updateUserSubscription = async (userId, subscriptionData) => {
    return await prisma.user.update({
        where: { id: userId },
        data: subscriptionData
    });
};

/**
 * Atualizar usuário por email
 * @param {string} email - Email do usuário
 * @param {object} data - Dados a atualizar
 * @returns {Promise<object>}
 */
export const updateUserByEmail = async (email, data) => {
    return await prisma.user.update({
        where: { email },
        data
    });
};
