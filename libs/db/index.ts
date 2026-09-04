import mongoose from 'mongoose';
import { createClient } from 'redis';

export interface DbConfig {
    mongodbURL: string;
    redisUrl?: string;
}

export const connectDatabase = async (config: DbConfig): Promise<void> => {
    mongoose.set('strictQuery', true);
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongodbURL);
        console.log('--database connection successful--');

        const redisUrl = config.redisUrl || process.env.REDIS_URL;
        if (!redisUrl) {
            console.log('REDIS_URL not set; using in-memory store');
            const store = new Map<string, string>();
            (global as any).redis = {
                get: async (key: string) => (store.has(key) ? store.get(key)! : null),
                set: async (key: string, value: string) => {
                    store.set(key, value);
                    return 'OK';
                },
                del: async (key: string) => {
                    const existed = store.delete(key);
                    return existed ? 1 : 0;
                }
            };
        } else {
            try {
                const client = createClient({ url: redisUrl });
                client.on('error', (err) => console.log('Redis Client Error', err));
                await client.connect();
                (global as any).redis = client;
            } catch (e) {
                console.log('Redis unavailable, falling back to in-memory store');
                const store = new Map<string, string>();
                (global as any).redis = {
                    get: async (key: string) => (store.has(key) ? store.get(key)! : null),
                    set: async (key: string, value: string) => {
                        store.set(key, value);
                        return 'OK';
                    },
                    del: async (key: string) => {
                        const existed = store.delete(key);
                        return existed ? 1 : 0;
                    }
                };
            }
        }
    } catch (err) {
        console.log('--error connecting to database---');
        console.log(err);
        throw err;
    }
};

export { mongoose };
