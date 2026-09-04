import crypto from 'node:crypto';
import http from 'http';
import path from 'path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { Server as SocketServer } from 'socket.io';
import compression from 'compression';
import mongoose from 'mongoose';
import gsCallbackRouter from '@main/routes/gs-callback.router';
import agCallbackRouter from '@main/routes/ag-callback.router';
import routes from './routes';
import pageRoute from './page.route';
import socketServer from './socket';
import config from './config';
import { errorConverter, errorHandler } from './middlewares/error';

const app = express();
app.use(helmet());
app.use(compression());

const allowAll = config.corsOrigin.length === 0 || config.corsOrigin.includes('*');
const corsOptions = {
    origin: allowAll
        ? true
        : (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
              if (!origin) return cb(null, true);
              if (config.corsOrigin.includes(origin)) return cb(null, true);
              return cb(new Error(`CORS blocked for origin: ${origin}`));
          },
    credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, _res, next) => {
    req.headers['x-request-id'] =
        req.headers['x-request-id'] || crypto.randomUUID();
    next();
});

const healthHandler = async (_req: express.Request, res: express.Response) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Redis ping (không throw nếu lỗi)
    let redisStatus = 'unavailable';
    try {
        if (global.redis) {
            await (global.redis as any).ping?.();
            redisStatus = 'connected';
        }
    } catch {
        redisStatus = 'error';
    }

    const memUsed = process.memoryUsage();
    const uptime  = process.uptime();

    const healthy = dbStatus === 'connected';
    res.status(healthy ? 200 : 503).json({
        status:   healthy ? 'ok' : 'degraded',
        time:     new Date().toISOString(),
        uptime:   Math.floor(uptime),
        database: dbStatus,
        redis:    redisStatus,
        memory: {
            heapUsed:  Math.round(memUsed.heapUsed  / 1024 / 1024) + 'MB',
            heapTotal: Math.round(memUsed.heapTotal / 1024 / 1024) + 'MB',
            rss:       Math.round(memUsed.rss       / 1024 / 1024) + 'MB',
        },
        version: '1.0.0',
    });
};
app.get('/health',     healthHandler);
app.get('/api/health', healthHandler);

const publicFolders = [
    'AG',
    'avatars',
    'bonus',
    'banners',
    'kyc',
    'files',
    'vip',
    'banner',
    'games',
    'frontend',
    'chat'
];
publicFolders.forEach((folder) => {
    app.use(express.static(path.join(__dirname, '../public', folder)));
});
app.use('/media', express.static(path.join(__dirname, '../public/media')));
app.use('/game-icons', express.static(path.join(__dirname, '../public/game-icons')));
app.use('/v1/api', gsCallbackRouter);
app.use('/ag-callback', agCallbackRouter);
app.use('/api', routes);
app.use('*', pageRoute);
app.use(errorConverter);
app.use(errorHandler);

const server = http.createServer(app);
const io = new SocketServer(server, {
    path: '/socket.io',
    cors: {
        origin: allowAll ? true : config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true
    },
    /** Cho phép long-polling khi WSS bị chặn tạm thời. */
    transports: ['polling', 'websocket'],
    pingInterval: 25000,
    pingTimeout: 60000
});
global.io = io;
socketServer(io);

export default server;
