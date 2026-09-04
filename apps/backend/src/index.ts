import path from 'path';
process.env.TZ = 'Asia/Ho_Chi_Minh';
import { createClient } from 'redis';
import * as moduleAlias from 'module-alias';
import * as mongoose from 'mongoose';

import config from './config';
import logger from './config/logger';

const aliasData =
    config.env === 'production'
        ? {
              '@root': path.join(__dirname, '..', 'dist'),
              '@main': `${path.join(__dirname, '..', 'dist', 'main')}`,
              '@utils': `${path.join(__dirname, '..', 'dist', 'utils')}`,
              '@config': `${path.join(__dirname, '..', 'dist', 'config')}`,
              '@middlewares': `${path.join(__dirname, '..', 'dist', 'middlewares')}`
          }
        : {
              '@root': path.join(__dirname, '..'),
              '@main': `${__dirname}/main`,
              '@utils': `${__dirname}/utils`,
              '@config': `${__dirname}/config`,
              '@middlewares': `${__dirname}/middlewares`
          };
moduleAlias.addAliases(aliasData);

import appServer from './app';

import { initTables } from './initialize.service';
import { startAffiliateFakeFeedCron } from '@main/cron/affiliate-fake-feed.cron';
import { startAffiliateDailyCron } from '@main/cron/affiliate-daily.cron';

const main = async () => {
    mongoose.set('strictQuery', true);

    // Start the HTTP server immediately so platform healthchecks succeed quickly.
    const server = appServer.listen(config.port, () => {
        logger.info(`Listening to port ${config.port}`);
        console.log(`HTTP server listening on port ${config.port}`);
    });

    // Initialize DB and redis asynchronously. Failures here should not prevent the server from starting.
    (async () => {
        try {
            console.log('Connecting to MongoDB...');
            console.log('Config.mongodbURL:', config.mongodbURL);
            console.log('Env DATABASE_URL:', process.env.DATABASE_URL);
            await mongoose.connect(config.mongodbURL as string);
            console.log('--database connection successful--');
            await initTables();
            startAffiliateFakeFeedCron();
            startAffiliateDailyCron();

            const redisUrl = process.env.REDIS_URL;
            if (!redisUrl) {
                console.log('REDIS_URL not set; using in-memory store');
                const store = new Map<string, string>();
                global.redis = {
                    get: async (key: string) => (store.has(key) ? store.get(key)! : null),
                    set: async (key: string, value: string) => {
                        store.set(key, value);
                        return 'OK';
                    },
                    del: async (key: string) => {
                        const existed = store.delete(key);
                        return existed ? 1 : 0;
                    }
                } as any;
            } else {
                try {
                    const client = createClient({ url: redisUrl });
                    client.on('error', (err) => console.log('Redis Client Error', err));
                    await client.connect();
                    global.redis = client;
                } catch (e) {
                    console.log('Redis unavailable, falling back to in-memory store');
                    const store = new Map<string, string>();
                    global.redis = {
                        get: async (key: string) => (store.has(key) ? store.get(key)! : null),
                        set: async (key: string, value: string) => {
                            store.set(key, value);
                            return 'OK';
                        },
                        del: async (key: string) => {
                            const existed = store.delete(key);
                            return existed ? 1 : 0;
                        }
                    } as any;
                }
            }
        } catch (err) {
            console.log('--error connecting to database---');
            console.log(err);
        }
    })();

    const exitHandler = () => {
        if (server) {
            server.close(() => {
                logger.info('Server closed');
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    };

    const unexpectedErrorHandler = (error) => {
        logger.error(error);
        exitHandler();
    };

    process.on('uncaughtException', unexpectedErrorHandler);
    process.on('unhandledRejection', unexpectedErrorHandler);

    process.on('SIGTERM', () => {
        logger.info('SIGTERM received');
        if (server) {
            server.close();
        }
    });
};

main();
