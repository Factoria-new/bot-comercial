
import prisma from '../src/config/prisma.js';

async function main() {
    console.log('Fetching all users form DB...');
    const users = await prisma.user.findMany();

    if (users.length === 0) {
        console.log('⚠️ No users found in database.');
    } else {
        console.log(`✅ Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ID: ${u.id} | Email: ${u.email} | Name: ${u.displayName} | HasKey: ${!!u.geminiApiKey}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
