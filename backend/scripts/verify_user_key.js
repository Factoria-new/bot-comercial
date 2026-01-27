
import prisma from '../src/config/prisma.js';
import { decrypt } from '../src/utils/encryption.js';

async function main() {
    const userIdOrSession = process.argv[2];
    if (!userIdOrSession) {
        console.error('Please provide a user ID or session ID.');
        process.exit(1);
    }

    console.log(`Checking user for: ${userIdOrSession}`);

    let user = await prisma.user.findUnique({ where: { id: userIdOrSession } });

    if (!user && userIdOrSession.startsWith('user_')) {
        const cleanId = userIdOrSession.replace('user_', '');
        console.log(`Trying clean ID: ${cleanId}`);
        user = await prisma.user.findUnique({ where: { id: cleanId } });
    }

    if (!user) {
        // Try getting user via instance if the ID is an instance ID
        const instance = await prisma.instance.findUnique({
            where: { id: userIdOrSession },
            include: { user: true }
        });
        if (instance?.user) user = instance.user;
    }

    if (!user) {
        console.error('❌ User NOT found in database.');
    } else {
        console.log(`✅ User found: ${user.displayName} (ID: ${user.id})`);

        if (user.geminiApiKey) {
            console.log(`🔑 Encrypted API Key present. Length: ${user.geminiApiKey.length}`);
            try {
                const decrypted = decrypt(user.geminiApiKey);
                if (decrypted) {
                    console.log(`🔓 Decrypted Key: ${decrypted.substring(0, 4)}...${decrypted.substring(decrypted.length - 4)}`);
                } else {
                    console.error('❌ Decryption result is empty/null');
                }
            } catch (e) {
                console.error(`❌ Decryption failed: ${e.message}`);
            }
        } else {
            console.warn('⚠️ No API Key (geminiApiKey) set for this user.');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
