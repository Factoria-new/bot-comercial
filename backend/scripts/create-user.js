// Script para criar usuário de desenvolvimento
// Uso: node scripts/create-user.js

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function createUser() {
    // Dados do usuário de desenvolvimento
    const email = 'bruno@factoria.com';
    const password = 'admin123';
    const displayName = 'Bruno Porto';
    const role = 'pro';

    console.log('🔧 Criando usuário de desenvolvimento...\n');

    try {
        // Verificar se usuário já existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log(`⚠️  Usuário ${email} já existe. Atualizando senha...`);

            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    status: 'active',
                    role
                }
            });

            console.log(`✅ Senha atualizada com sucesso!`);
        } else {
            // Criar novo usuário
            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    displayName,
                    role,
                    status: 'active',
                    plan: 'pro_monthly',
                    subscriptionStatus: 'active'
                }
            });

            console.log(`✅ Usuário criado com sucesso!`);
        }

        console.log('\n� Credenciais de login:');
        console.log('━'.repeat(40));
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${password}`);
        console.log(`   Role:  ${role}`);
        console.log('━'.repeat(40));
        console.log('\n🚀 Agora você pode fazer login no frontend!');

    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
    } finally {
        await prisma.$disconnect();
        await pool.end();
        process.exit(0);
    }
}

createUser();
