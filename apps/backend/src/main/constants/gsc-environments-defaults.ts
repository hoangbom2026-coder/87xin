import crypto from 'crypto';
import { GSC_CONFIG } from '@main/constants/gsc-integration';

/** IGscEnvironment types cho các module GSC */
export interface IGscEnvironment {
    id: string;
    label: string;
    operatorCode: string;
    secretKey: string;
    enabled: boolean;
    host?: string;
}

/** Default environments (seed) */
export const GSC_ENVIRONMENTS_DEFAULTS: IGscEnvironment[] = [
    {
        id: 'default',
        label: 'Default',
        operatorCode: GSC_CONFIG.opCode,
        secretKey: GSC_CONFIG.secretKey,
        enabled: true
    }
];

export const gscBuildOutboundMd5 = (requestTime: number, content: string, secretKey: string): string => {
    const raw = `${requestTime}|${content}|${secretKey}`;
    return crypto.createHash('md5').update(raw).digest('hex');
};

export default GSC_ENVIRONMENTS_DEFAULTS;