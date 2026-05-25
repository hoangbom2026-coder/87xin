import mongoose, { Schema, Document } from 'mongoose';
import { toJSON, paginate } from '@utils/model-plugins';
import { GAME_CATEGORY_KEYS, GAME_KINDS, GameCategoryKey, GameKind } from '@main/constants/game-catalog';

export interface IRngOverride {
    /** Bật chế độ override RNG (false = chạy fair RNG mặc định). */
    enabled: boolean;
    /** Buộc thua mỗi ván. */
    forceLose: boolean;
    /** Buộc thắng mỗi ván. */
    forceWin: boolean;
    /** Trần payout cho 1 round (USD). 0 = không giới hạn. */
    maxPayoutPerRound: number;
    /** Trần payout cho 1 user/ngày (USD). 0 = không giới hạn. */
    maxPayoutPerUserDay: number;
    /** RTP target % override (90 ~ 99). 0 = không override. */
    targetRtpPercent: number;
    /** % nghiêng kết quả về phía thua (0-100). 0 = không nghiêng. */
    biasLosePercent: number;
    /** Whitelist user áp override (rỗng = áp tất cả khi enabled). */
    appliesToUserIds: string[];
    notes: string;
}

export interface IGameConfig extends Document {
    /** Slug duy nhất (vd "originals_mines", "gs_pp_book_of_dead"). */
    gameKey: string;
    name: string;
    /** URL hiển thị thumbnail. */
    image?: string;
    description?: string;
    category: GameCategoryKey;
    kind: GameKind;
    /** Provider: internal | gs | ag | sport_book | external. */
    provider: string;
    /** Code/id ngoài (gameCode bên GS/AG nếu có). */
    externalCode?: string;
    /** Tags do admin gán. */
    tags: string[];
    enabled: boolean;
    visible: boolean;
    featured: boolean;
    favorite: boolean;
    searchable: boolean;
    /** Bảo trì → ẩn khỏi list public, hiển thị badge ở admin. */
    maintenance: boolean;
    order: number;
    /** Cấu hình override RNG / payout cap. */
    rngOverride: IRngOverride;
    /** Metadata mở rộng. */
    meta: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const RngOverrideSchema = new Schema<IRngOverride>(
    {
        enabled: { type: Boolean, default: false },
        forceLose: { type: Boolean, default: false },
        forceWin: { type: Boolean, default: false },
        maxPayoutPerRound: { type: Number, default: 0 },
        maxPayoutPerUserDay: { type: Number, default: 0 },
        targetRtpPercent: { type: Number, default: 0 },
        biasLosePercent: { type: Number, default: 0 },
        appliesToUserIds: { type: [String], default: [] },
        notes: { type: String, default: '' }
    },
    { _id: false }
);

const GameConfigSchema = new mongoose.Schema<IGameConfig>(
    {
        gameKey: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
        name: { type: String, required: true, trim: true },
        image: { type: String, default: '' },
        description: { type: String, default: '' },
        category: { type: String, enum: GAME_CATEGORY_KEYS, default: 'originals', index: true },
        kind: { type: String, enum: GAME_KINDS, default: 'other', index: true },
        provider: { type: String, default: 'internal', index: true },
        externalCode: { type: String, default: '' },
        tags: { type: [String], default: [] },
        enabled: { type: Boolean, default: true, index: true },
        visible: { type: Boolean, default: true, index: true },
        featured: { type: Boolean, default: false, index: true },
        favorite: { type: Boolean, default: false },
        searchable: { type: Boolean, default: true },
        maintenance: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
        rngOverride: { type: RngOverrideSchema, default: () => ({}) },
        meta: { type: Schema.Types.Mixed, default: {} }
    },
    { timestamps: true }
);

GameConfigSchema.plugin(toJSON);
GameConfigSchema.plugin(paginate);
GameConfigSchema.index({ category: 1, kind: 1, order: 1 });

const GameConfigModel = mongoose.model<IGameConfig>('game-configs', GameConfigSchema);
export default GameConfigModel;
