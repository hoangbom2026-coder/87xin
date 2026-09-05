import SitePluginModel, { ISitePlugin, SitePluginStatus } from '@main/models/site-plugin.model';

const DEFAULT_PLUGINS: Array<{
    key: string;
    title: string;
    version: string;
    description: string;
    author: string;
    iconUrl: string;
    status: SitePluginStatus;
    configPath: string;
    configJson: Record<string, unknown>;
    order: number;
}> = [
    {
        key: 'soloCurrency',
        title: 'Single Currency',
        version: '5.0.0',
        description: 'Configure the main currency of the website.',
        author: 'phoenix-gambling.com',
        iconUrl: '',
        status: 'installed',
        configPath: '/setting/site',
        configJson: {},
        order: 0
    },
    {
        key: 'multiWallet',
        title: 'Multi Wallet',
        version: '2.1.0',
        description: 'Enable multiple fiat/crypto wallets per user.',
        author: 'Platform Core',
        iconUrl: '',
        status: 'available',
        configPath: '/currency',
        configJson: {},
        order: 1
    },
    {
        key: 'affiliateEngine',
        title: 'Affiliate Engine',
        version: '4.3.2',
        description: 'Referral tiers, commissions and affiliate dashboard.',
        author: 'Platform Core',
        iconUrl: '',
        status: 'installed',
        configPath: '/affiliate-dashboard',
        configJson: {},
        order: 2
    },
    {
        key: 'vipProgram',
        title: 'VIP Program',
        version: '3.0.1',
        description: 'VIP levels, cashback and spin rewards.',
        author: 'Platform Core',
        iconUrl: '',
        status: 'available',
        configPath: '/vip',
        configJson: {},
        order: 3
    },
    {
        key: 'botAutomation',
        title: 'Bot Automation',
        version: '1.2.0',
        description: 'Configurable bet & chat bots for lobby activity.',
        author: 'Platform Core',
        iconUrl: '',
        status: 'installed',
        configPath: '/admin/bots',
        configJson: {},
        order: 4
    }
];

export async function seedSitePluginsIfEmpty(): Promise<void> {
    const n = await SitePluginModel.countDocuments();
    if (n > 0) return;
    await SitePluginModel.insertMany(DEFAULT_PLUGINS);
}

export async function listPlugins(search?: string) {
    const q = search?.trim();
    const filter: Record<string, unknown> = {};
    if (q) {
        filter.$or = [
            { title: { $regex: q, $options: 'i' } },
            { key: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { author: { $regex: q, $options: 'i' } }
        ];
    }
    return SitePluginModel.find(filter).sort({ order: 1, title: 1 }).lean();
}

export async function getPluginById(id: string) {
    return SitePluginModel.findById(id).lean();
}

export async function findByKey(key: string) {
    return SitePluginModel.findOne({ key: key.toLowerCase().trim() }).lean();
}

export async function createPlugin(data: Partial<ISitePlugin>) {
    return SitePluginModel.create(data);
}

export async function patchPlugin(id: string, data: Partial<ISitePlugin>) {
    return SitePluginModel.findByIdAndUpdate(id, { $set: data }, { new: true }).lean();
}

export async function setStatus(id: string, status: SitePluginStatus) {
    return SitePluginModel.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
}

export default {
    seedSitePluginsIfEmpty,
    listPlugins,
    getPluginById,
    findByKey,
    createPlugin,
    patchPlugin,
    setStatus
};
