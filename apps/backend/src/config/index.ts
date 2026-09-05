/**
 * Core application configuration module.
 * Loads environment variables, sets up defaults, and validates required runtime secrets.
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const getJwtSecret = (): string => {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[config] Using DEVELOPMENT JWT secret. Do NOT run in production without JWT_SECRET.');
        return 'dev-jwt-secret-key-development-only';
    }
    // Production: bắt buộc phải set JWT_SECRET trong .env — fail-fast, không fallback
    throw new Error('JWT_SECRET is required in production. Set JWT_SECRET in .env to run the server.');
};

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
        secret: getJwtSecret(),
        accessExpirationMinutes: 1440,
        refreshExpirationDays: 30
    },
    agCasino: {
        host: process.env.AG_HOST || 'https://api.ag.com',
        merchantCode: process.env.AG_MERCHANT_CODE || '',
        secretKey: process.env.AG_SECRET_KEY || ''
    },
    agPay: {
        host: process.env.AG_PAY_HOST || 'https://api.agpay.com',
        sn: process.env.AG_PAY_SN || '',
        merchantName: process.env.AG_PAY_MERCHANT_NAME || '',
        secretKey: process.env.AG_PAY_SECRET_KEY || ''
    },
    gsc: {
        opCode: process.env.GSC_OP_CODE || 'G7N1',
        secretKey: process.env.GSC_SECRET_KEY || '',
        env: process.env.GSC_ENV || 'staging'
    },
    gsPay: {
        host: process.env.GS_PAY_HOST || 'https://api.gspay.com',
        merchantId: process.env.GS_PAY_MERCHANT_ID || '',
        secretKey: process.env.GS_PAY_SECRET_KEY || '',
        apiKey: process.env.GS_PAY_API_KEY || ''
    },
    nowpay: {
        host: process.env.NOWPAY_HOST || 'https://api.nowpayments.io',
        apiKey: process.env.NOWPAY_API_KEY || '',
        ipnSecret: process.env.NOWPAY_IPN_SECRET || '',
        email: process.env.NOWPAY_EMAIL || '',
        password: process.env.NOWPAY_PASSWORD || ''
    },
    exchangeRateKey: process.env.EXCHANGE_RATE_KEY || '',
    sendGridApiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'no-reply@tc-gaming.live',
    adminCode: process.env.ADMIN_CODE || '',
    slot: {
        host: process.env.SLOT_API_BASE_URL || '',
        apiKey: process.env.SLOT_API_KEY || '',
        apiBaseUrl: process.env.SLOT_API_BASE_URL || ''
    }
};

export default config;
