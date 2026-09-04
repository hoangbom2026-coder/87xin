import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
    env: process.env.NODE_ENV || 'production',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8701,
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : ['*'],
    backendUrl: process.env.BACKEND_URL || 'http://127.0.0.1:8701',
    frontendUrl: process.env.FRONTEND_URL || 'https://tc-gaming.live',
    mongodbURL: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/tc-gaming',
    mongoose: {
        url: process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/tc-gaming',
        options: {}
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'tc-gaming-jwt-secret-key-production',
        accessExpirationMinutes: 1440,
        refreshExpirationDays: 30
    },
    agCasino: {
        host: process.env.AG_HOST || 'https://api.ag.com',
        merchantCode: process.env.AG_MERCHANT_CODE || '',
        secretKey: process.env.AG_SECRET_KEY || ''
    },
    gsc: {
        opCode: process.env.GSC_OP_CODE || 'G7N1',
        secretKey: process.env.GSC_SECRET_KEY || 'krUWd6ZYgPKcUEZQN8KDxf',
        env: process.env.GSC_ENV || 'staging'
    }
};

export default config;
