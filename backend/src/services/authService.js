import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/firebase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_dev';
const SALT_ROUNDS = 10;

// Create a new user (Pending state) called after payment
export const createPendingUser = async (email, name) => {
    const userRef = db.collection('users').where('email', '==', email).limit(1);
    const snapshot = await userRef.get();

    let uid;
    if (!snapshot.empty) {
        // User already exists, maybe update status or check if already active
        const userDoc = snapshot.docs[0];
        uid = userDoc.id;
        // Optional: Update name if provided and not set?
        if (name && !userDoc.data().displayName) {
            await userDoc.ref.update({ displayName: name });
        }
    } else {
        // Create new user
        const newUser = {
            email,
            displayName: name || '',
            role: 'basic', // Default payment role
            status: 'pending',
            createdAt: new Date().toISOString(),
        };
        const res = await db.collection('users').add(newUser);
        uid = res.id;
    }

    // Generate Activation Token (valid for 24h)
    const token = jwt.sign({ uid, email, type: 'activation' }, JWT_SECRET, { expiresIn: '24h' });
    return token;
};

// Request Password Reset
export const requestPasswordReset = async (email) => {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
        // Silently fail for security or throw error? 
        // Standard practice is to not reveal user existence, but for this app explicit error might be better for UX
        // Let's return null to controller to decide or throw generic message
        throw new Error('User not found');
    }

    const startUser = snapshot.docs[0];
    const uid = startUser.id;

    const token = jwt.sign({ uid, email, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
    return token;
};

// Set Password (Activation or Reset)
export const setPassword = async (token, password) => {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!['activation', 'reset'].includes(decoded.type)) {
        throw new Error('Invalid token type');
    }

    const { uid } = decoded;
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
        throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const userData = userSnap.data();

    await userRef.update({
        password: hashedPassword,
        status: 'active',
        updatedAt: new Date().toISOString(),
    });

    // Return new session token with role
    const sessionToken = jwt.sign({
        uid,
        email: decoded.email,
        role: userData.role || 'basic'
    }, JWT_SECRET, { expiresIn: '7d' });
    return sessionToken;
};

// Login
export const login = async (email, password) => {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
        throw new Error('Invalid credentials');
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.password) {
        throw new Error('Account not activated or uses different login method');
    }

    const match = await bcrypt.compare(password, userData.password);
    if (!match) {
        throw new Error('Invalid credentials');
    }

    const sessionToken = jwt.sign({ uid: userDoc.id, email: userData.email, role: userData.role }, JWT_SECRET, { expiresIn: '7d' });

    return {
        token: sessionToken,
        user: {
            uid: userDoc.id,
            email: userData.email,
            role: userData.role,
            ...userData
        }
    };
};

export const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        throw new Error('Invalid token');
    }
}
