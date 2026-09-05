import crypto from 'crypto';
import httpStatus from 'http-status';
import ApiError from '@utils/ApiError';
import { GSC_CONFIG } from '@main/constants/gsc-integration';

export interface IGscEnvironment {
    id: string;
    label: string;
    operatorCode: string;
    secretKey: string;
    enabled: boolean;
}

const GSC_ENVIRONMENTS: IGscEnvironment[] = [
    {
        id: 'default',
        label: 'Default',
        operatorCode: GSC_CONFIG.opCode,
        secretKey: GSC_CONFIG.secretKey,
        enabled: true
    }
];

/** Build outbound MD5 signature cho GSC API */
export const buildOutboundMd5 = (requestTime: number, content: string, env: IGscEnvironment): string => {
    const raw = `${requestTime}|${content}|${env.secretKey}`;
    return crypto.createHash('md5').update(raw).digest('hex');
};

/** Lấy danh sách các environment đang bật */
export const getEnabledGscEnvironments = async (): Promise<IGscEnvironment[]> => {
    return GSC_ENVIRONMENTS.filter((e) => e.enabled);
};

/** Lấy environment theo id */
export const getGscEnvironmentById = async (envId: string): Promise<IGscEnvironment> => {
    const env = GSC_ENVIRONMENTS.find((e) => e.id === envId);
    if (!env) throw new ApiError(httpStatus.NOT_FOUND, `GSC environment not found: ${envId}`);
    return env;
};

export default {
    buildOutboundMd5,
    getEnabledGscEnvironments,
    getGscEnvironmentById,
};