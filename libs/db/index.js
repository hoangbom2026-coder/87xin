"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoose = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.mongoose = mongoose_1.default;
const redis_1 = require("redis");
const connectDatabase = async (config) => {
    mongoose_1.default.set('strictQuery', true);
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(config.mongodbURL);
        console.log('--database connection successful--');
        const redisUrl = config.redisUrl || process.env.REDIS_URL;
        if (!redisUrl) {
            console.log('REDIS_URL not set; using in-memory store');
            const store = new Map();
            global.redis = {
                get: async (key) => (store.has(key) ? store.get(key) : null),
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
        else {
            try {
                const client = (0, redis_1.createClient)({ url: redisUrl });
                client.on('error', (err) => console.log('Redis Client Error', err));
                await client.connect();
                global.redis = client;
            }
            catch (e) {
                console.log('Redis unavailable, falling back to in-memory store');
                const store = new Map();
                global.redis = {
                    get: async (key) => (store.has(key) ? store.get(key) : null),
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
        }
    }
    catch (err) {
        console.log('--error connecting to database---');
        console.log(err);
        throw err;
    }
};
exports.connectDatabase = connectDatabase;
