process.env.TZ = 'Asia/Ho_Chi_Minh';

import config from './config';
import logger from './config/logger';
import appServer from './app';
import { initTables } from './initialize.service';
import { connectDatabase } from '@game/db';
import { startAllCrons } from '@game/cron';

const main = async () => {
    // Start HTTP server immediately
    const server = appServer.listen(config.port, () => {
        logger.info(`Listening to port ${config.port}`);
        console.log(`HTTP server listening on port ${config.port}`);
    });

    // Async DB & Cron initialization
    (async () => {
        try {
            await connectDatabase({
                mongodbURL: config.mongodbURL as string
            });
            await initTables();
            startAllCrons();
        } catch (err) {
            console.log('--database or background initialization failed---');
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

    const unexpectedErrorHandler = (error: any) => {
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
