// Auth Service - Gerenciamento de autenticação com Prisma/Supabase
// Migrado de Firebase/Firestore para Prisma/PostgreSQL

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_dev';
const SALT_ROUNDS = 10;

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
    const sessionToken = jwt.sign(
        { uid, email: decoded.email, role: user.role || 'basic' },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    return sessionToken;
};

/**
 * Login
 * @param {string} email - Email do usuário
 * @param {string} password - Senha do usuário
 * @returns {Promise<{token: string, user: object}>}
 */
export const login = async (email, password) => {
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    if (!user.password) {
        throw new Error('Account not activated or uses different login method');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Error('Invalid credentials');
    }

    const sessionToken = jwt.sign(
        { uid: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

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
            hasPrompt: !!user.customPrompt
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
