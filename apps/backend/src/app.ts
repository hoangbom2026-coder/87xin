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
    // ── Database check ──────────────────────────────────────────────────────
    const dbStart = Date.now();
    let dbStatus: 'ok' | 'error' = 'error';
    try {
        if (mongoose.connection.readyState === 1) {
            // Simple ping: listCollections returns fast even on large DBs
            await mongoose.connection.db!.command({ ping: 1 });
            dbStatus = 'ok';
        }
    } catch {
        dbStatus = 'error';
    }
    const dbLatency = Date.now() - dbStart;

    // ── Redis check ─────────────────────────────────────────────────────────
    const redisStart = Date.now();
    let redisStatus: 'ok' | 'error' = 'error';
    try {
        if (global.redis) {
            const pong = await (global.redis as any).ping?.();
            // Real redis-client returns 'PONG'; in-memory fallback has no ping → undefined
            redisStatus = (pong === 'PONG' || pong === undefined) ? 'ok' : 'error';
        }
    } catch {
        redisStatus = 'error';
    }
    const redisLatency = Date.now() - redisStart;

    const memUsed = process.memoryUsage();
    const uptime  = process.uptime();
    const allOk   = dbStatus === 'ok' && redisStatus === 'ok';
    const anyErr  = dbStatus === 'error' && redisStatus === 'error';

    const overallStatus = allOk ? 'ok' : anyErr ? 'error' : 'degraded';
    const httpCode      = overallStatus === 'ok' ? 200 : 503;

    res.status(httpCode).json({
        status:    overallStatus,
        timestamp: new Date().toISOString(),
        uptime:    Math.floor(uptime),
        services: {
            database: { status: dbStatus,    latency_ms: dbLatency    },
            redis:    { status: redisStatus, latency_ms: redisLatency },
        },
        // Legacy fields — giữ lại để không break smoke test + monitoring scripts cũ
        database: dbStatus === 'ok' ? 'connected' : 'disconnected',
        redis:    redisStatus === 'ok' ? 'connected' : (global.redis ? 'error' : 'unavailable'),
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
