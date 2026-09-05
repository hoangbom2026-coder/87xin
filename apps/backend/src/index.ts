process.env.TZ = 'Asia/Ho_Chi_Minh';

import config from './config';
import logger from './config/logger';
import appServer from './app';
import { initTables } from './initialize.service';
import { connectDatabase } from '@game/db';
import { startAllCrons } from '@game/cron';

const main = async () => {
    // Async DB & Cron initialization
    // Chờ DB connect xong trước khi mở server nhận traffic (readiness gate).
    // Health endpoint vẫn phản ánh đúng trạng thái ready/degraded/error.
    let dbReady = false;
    (async () => {
        try {
            await connectDatabase({
                mongodbURL: config.mongodbURL as string
            });
            await initTables();
            startAllCrons();
            dbReady = true;
        } catch (err) {
            console.log('--database or background initialization failed---');
            console.log(err);
        }
    })();

    // Chờ DB ready tối đa 30s trước khi listen. Nếu DB fail-fast trong production => thoát.
    const readyTimeoutMs = config.env === 'production' ? 30000 : 10000;
    const deadline = Date.now() + readyTimeoutMs;
    while (!dbReady && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 200));
    }

    if (!dbReady && config.env === 'production') {
        console.error('Database initialization failed. Server will not start (fail-fast).');
        process.exit(1);
    }

    // Start HTTP server
    const server = appServer.listen(config.port, () => {
        logger.info(`Listening to port ${config.port}`);
        console.log(`HTTP server listening on port ${config.port}`);
    });

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
