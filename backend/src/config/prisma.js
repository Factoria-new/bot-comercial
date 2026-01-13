// Prisma Client singleton para o backend - Prisma 7 com Driver Adapter
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const { Pool } = pg;

// Criar pool de conexões PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Criar adapter do Prisma para PostgreSQL
const adapter = new PrismaPg(pool);

// Singleton pattern para evitar múltiplas conexões
let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({ adapter });
} else {
    if (!global.prisma) {
        global.prisma = new PrismaClient({ adapter });
    }
    prisma = global.prisma;
}

export { prisma };
export default prisma;
