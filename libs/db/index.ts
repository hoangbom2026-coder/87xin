import mongoose from 'mongoose';

export interface DbConfig {
    mongodbURL: string;
    redisUrl?: string;
}

type InMemoryClient = {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<'OK'>;
    del: (key: string) => Promise<number>;
};

let redisClient: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

function createInMemoryStore(): InMemoryClient {
    const store = new Map<string, string>();
    return {
        get: async (key) => (store.has(key) ? store.get(key)! : null),
        set: async (key, value) => {
            store.set(key, value);
            return 'OK';
        },
        del: async (key) => {
            const existed = store.delete(key);
            return existed ? 1 : 0;
        }
    };
}

async function connectRedis(redisUrl: string): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    // Dùng require để tránh lỗi typecheck khi redis package nằm ở backend workspace
    const { createClient } = require('redis') as { createClient: (opts: { url: string }) => any };
    const client = createClient({ url: redisUrl });
    client.on('error', (err: Error) => console.log('Redis Client Error', err));
    await client.connect();
    return client;
}

export const connectDatabase = async (config: DbConfig): Promise<void> => {
    mongoose.set('strictQuery', true);
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongodbURL);
        console.log('--database connection successful--');
    } catch (e) {
        console.error('MongoDB connection failed:', (e as Error).message);
        throw e;
    }

    const redisUrl = config.redisUrl || process.env.REDIS_URL;
    if (!redisUrl) {
        console.log('REDIS_URL not set; using in-memory store');
        (global as any).redis = createInMemoryStore(); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else {
        try {
            redisClient = await connectRedis(redisUrl);
            (global as any).redis = redisClient; // eslint-disable-line @typescript-eslint/no-explicit-any
            console.log('--redis connection successful--');
        } catch (e) {
            console.log('Redis unavailable, falling back to in-memory store');
            (global as any).redis = createInMemoryStore(); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
    }
};