/**
 * Cấu hình tích hợp bên ngoài (cổng thanh toán, GA, preloader, …) — admin PATCH `systemIntegrations`.
 * Không merge vào API public `getDefaultData` (site người chơi).
 */

export const PAYMENT_GATEWAY_SLUGS = [
    'paypal',
    'stripe',
    'coinpayments',
    'razorpay',
    'vougepay',
    'mollie',
    'nowpayments',
    'flutterwave',
    'paystack',
    'paghiper',
    'gourl',
    'perfectmoney',
    'mercadopago',
    'paytm',
    'bank_manual'
] as const;

export type PaymentGatewaySlug = (typeof PAYMENT_GATEWAY_SLUGS)[number];

export interface IGatewayCredentialSlot {
    enabled: boolean;
    sandbox: boolean;
    displayLabel: string;
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
    merchantId: string;
    clientId: string;
    extraJson: string;
    notes: string;
}

export interface ISystemIntegrationsGeneral {
    preloaderEnabled: boolean;
    preloaderImageUrl: string;
    googleAnalyticsMeasurementId: string;
    googleTagManagerContainerId: string;
    cookieConsentHtml: string;
    recaptchaSiteKey: string;
    recaptchaSecretKey: string;
    liveChatSnippetHtml: string;
    globalSeoDefaultTitle: string;
    globalSeoDefaultDescription: string;
    globalSeoDefaultOgImageUrl: string;
}

export interface ISystemIntegrations {
    gateways: Record<string, IGatewayCredentialSlot>;
    general: ISystemIntegrationsGeneral;
}

const DEFAULT_GATEWAY_SLOT: IGatewayCredentialSlot = {
    enabled: false,
    sandbox: false,
    displayLabel: '',
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    merchantId: '',
    clientId: '',
    extraJson: '',
    notes: ''
};

const DEFAULT_GENERAL: ISystemIntegrationsGeneral = {
    preloaderEnabled: false,
    preloaderImageUrl: '',
    googleAnalyticsMeasurementId: '',
    googleTagManagerContainerId: '',
    cookieConsentHtml: '',
    recaptchaSiteKey: '',
    recaptchaSecretKey: '',
    liveChatSnippetHtml: '',
    globalSeoDefaultTitle: '',
    globalSeoDefaultDescription: '',
    globalSeoDefaultOgImageUrl: ''
};

function defaultGateways(): Record<string, IGatewayCredentialSlot> {
    const o: Record<string, IGatewayCredentialSlot> = {};
    for (const slug of PAYMENT_GATEWAY_SLUGS) {
        o[slug] = { ...DEFAULT_GATEWAY_SLOT };
    }
    return o;
}

export const DEFAULT_SYSTEM_INTEGRATIONS: ISystemIntegrations = {
    gateways: defaultGateways(),
    general: { ...DEFAULT_GENERAL }
};

function mergeGatewaySlot(
    base: IGatewayCredentialSlot,
    patch?: Partial<IGatewayCredentialSlot> | null
): IGatewayCredentialSlot {
    if (!patch || typeof patch !== 'object') return { ...base };
    return {
        enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : base.enabled,
        sandbox: patch.sandbox !== undefined ? Boolean(patch.sandbox) : base.sandbox,
        displayLabel:
            typeof patch.displayLabel === 'string' ? patch.displayLabel.slice(0, 200) : base.displayLabel,
        publicKey: typeof patch.publicKey === 'string' ? patch.publicKey.slice(0, 2000) : base.publicKey,
        secretKey: typeof patch.secretKey === 'string' ? patch.secretKey.slice(0, 2000) : base.secretKey,
        webhookSecret:
            typeof patch.webhookSecret === 'string' ? patch.webhookSecret.slice(0, 2000) : base.webhookSecret,
        merchantId: typeof patch.merchantId === 'string' ? patch.merchantId.slice(0, 500) : base.merchantId,
        clientId: typeof patch.clientId === 'string' ? patch.clientId.slice(0, 500) : base.clientId,
        extraJson: typeof patch.extraJson === 'string' ? patch.extraJson.slice(0, 20000) : base.extraJson,
        notes: typeof patch.notes === 'string' ? patch.notes.slice(0, 5000) : base.notes
    };
}

export function mergeSystemIntegrations(
    stored?: Partial<ISystemIntegrations> | null | Record<string, unknown>
): ISystemIntegrations {
    const base = JSON.parse(JSON.stringify(DEFAULT_SYSTEM_INTEGRATIONS)) as ISystemIntegrations;
    if (!stored || typeof stored !== 'object') return base;
    const s = stored as Partial<ISystemIntegrations>;

    const mergedGateways = { ...base.gateways };
    const incG = (s.gateways || {}) as Record<string, Partial<IGatewayCredentialSlot>>;
    for (const slug of PAYMENT_GATEWAY_SLUGS) {
        mergedGateways[slug] = mergeGatewaySlot(base.gateways[slug], incG[slug]);
    }
    for (const k of Object.keys(incG)) {
        if (!mergedGateways[k]) {
            mergedGateways[k] = mergeGatewaySlot({ ...DEFAULT_GATEWAY_SLOT }, incG[k]);
        }
    }

    const g = (s.general || {}) as Partial<ISystemIntegrationsGeneral>;
    const mergedGeneral: ISystemIntegrationsGeneral = {
        preloaderEnabled: g.preloaderEnabled !== undefined ? Boolean(g.preloaderEnabled) : base.general.preloaderEnabled,
        preloaderImageUrl:
            typeof g.preloaderImageUrl === 'string'
                ? g.preloaderImageUrl.slice(0, 2000)
                : base.general.preloaderImageUrl,
        googleAnalyticsMeasurementId:
            typeof g.googleAnalyticsMeasurementId === 'string'
                ? g.googleAnalyticsMeasurementId.slice(0, 200)
                : base.general.googleAnalyticsMeasurementId,
        googleTagManagerContainerId:
            typeof g.googleTagManagerContainerId === 'string'
                ? g.googleTagManagerContainerId.slice(0, 200)
                : base.general.googleTagManagerContainerId,
        cookieConsentHtml:
            typeof g.cookieConsentHtml === 'string'
                ? g.cookieConsentHtml.slice(0, 200000)
                : base.general.cookieConsentHtml,
        recaptchaSiteKey:
            typeof g.recaptchaSiteKey === 'string'
                ? g.recaptchaSiteKey.slice(0, 500)
                : base.general.recaptchaSiteKey,
        recaptchaSecretKey:
            typeof g.recaptchaSecretKey === 'string'
                ? g.recaptchaSecretKey.slice(0, 500)
                : base.general.recaptchaSecretKey,
        liveChatSnippetHtml:
            typeof g.liveChatSnippetHtml === 'string'
                ? g.liveChatSnippetHtml.slice(0, 200000)
                : base.general.liveChatSnippetHtml,
        globalSeoDefaultTitle:
            typeof g.globalSeoDefaultTitle === 'string'
                ? g.globalSeoDefaultTitle.slice(0, 500)
                : base.general.globalSeoDefaultTitle,
        globalSeoDefaultDescription:
            typeof g.globalSeoDefaultDescription === 'string'
                ? g.globalSeoDefaultDescription.slice(0, 2000)
                : base.general.globalSeoDefaultDescription,
        globalSeoDefaultOgImageUrl:
            typeof g.globalSeoDefaultOgImageUrl === 'string'
                ? g.globalSeoDefaultOgImageUrl.slice(0, 2000)
                : base.general.globalSeoDefaultOgImageUrl
    };

    return { gateways: mergedGateways, general: mergedGeneral };
}

/** PATCH: merge dữ liệu DB (đã chuẩn hoá) với phần gửi lên từ admin. */
export function applySystemIntegrationsPatch(
    storedRaw: unknown,
    patch: Partial<ISystemIntegrations> | null | undefined
): ISystemIntegrations {
    const base = mergeSystemIntegrations(storedRaw as never);
    if (!patch || typeof patch !== 'object') return base;

    const gateways = { ...base.gateways };
    if (patch.gateways && typeof patch.gateways === 'object') {
        for (const [slug, slot] of Object.entries(patch.gateways)) {
            const prev = gateways[slug] ?? { ...DEFAULT_GATEWAY_SLOT };
            gateways[slug] = mergeGatewaySlot(prev, slot as Partial<IGatewayCredentialSlot>);
        }
    }

    const incG = patch.general;
    const general: ISystemIntegrationsGeneral = { ...base.general };
    if (incG && typeof incG === 'object') {
        if (incG.preloaderEnabled !== undefined) general.preloaderEnabled = Boolean(incG.preloaderEnabled);
        if (typeof incG.preloaderImageUrl === 'string')
            general.preloaderImageUrl = incG.preloaderImageUrl.slice(0, 2000);
        if (typeof incG.googleAnalyticsMeasurementId === 'string')
            general.googleAnalyticsMeasurementId = incG.googleAnalyticsMeasurementId.slice(0, 200);
        if (typeof incG.googleTagManagerContainerId === 'string')
            general.googleTagManagerContainerId = incG.googleTagManagerContainerId.slice(0, 200);
        if (typeof incG.cookieConsentHtml === 'string')
            general.cookieConsentHtml = incG.cookieConsentHtml.slice(0, 200000);
        if (typeof incG.recaptchaSiteKey === 'string')
            general.recaptchaSiteKey = incG.recaptchaSiteKey.slice(0, 500);
        if (typeof incG.recaptchaSecretKey === 'string')
            general.recaptchaSecretKey = incG.recaptchaSecretKey.slice(0, 500);
        if (typeof incG.liveChatSnippetHtml === 'string')
            general.liveChatSnippetHtml = incG.liveChatSnippetHtml.slice(0, 200000);
        if (typeof incG.globalSeoDefaultTitle === 'string')
            general.globalSeoDefaultTitle = incG.globalSeoDefaultTitle.slice(0, 500);
        if (typeof incG.globalSeoDefaultDescription === 'string')
            general.globalSeoDefaultDescription = incG.globalSeoDefaultDescription.slice(0, 2000);
        if (typeof incG.globalSeoDefaultOgImageUrl === 'string')
            general.globalSeoDefaultOgImageUrl = incG.globalSeoDefaultOgImageUrl.slice(0, 2000);
    }

    return { gateways, general };
}
