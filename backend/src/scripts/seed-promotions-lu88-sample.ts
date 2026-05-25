/**
 * Seed / upsert khuyến mãi mẫu (nội dung tham chiếu trang lu88.im/khuyen-mai) + ảnh local trong frontend1/public/images/promotions/cms/.
 *
 * Chạy sau khi đã tải ảnh (curl trong repo) và có MongoDB:
 *   npm run seed:promotions
 *
 * URI: DATABASE_URL hoặc MONGODB_URI trong backend/.env
 */
import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import PromotionModel from '../main/models/promotion.model';
import type { PromotionCategoryKey } from '../main/constants/promotion-categories';
import { PROMOTION_POPUP_EXAMPLE_GOLDEN_HOUR } from '../main/constants/promotion-popup-example-html';

dotenv.config({ path: path.join(__dirname, '../../.env') });

type SeedRow = {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    badge: string;
    imageUrl: string;
    category: PromotionCategoryKey;
    order: number;
    isVisible: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    tags: string[];
    content: string;
};

const ROWS: SeedRow[] = [
    {
        slug: 'golden-hour-co-hoi-vang-ngay-thu-6',
        title: 'Thưởng nạp Thứ Sáu - Nhận ngay 500K',
        subtitle: 'Cơ hội vàng ngày Thứ 6 – Sẵn sàng bứt phá với ưu đãi đặc biệt',
        description: 'Ưu đãi nạp tiền khung giờ vàng thứ Sáu — thưởng lên đến 500K theo điều kiện vận hành.',
        badge: 'Đang diễn ra',
        imageUrl: '/images/promotions/cms/golden-hour-friday.webp',
        category: 'bonus',
        order: 10,
        isVisible: true,
        tags: ['cms-seed', 'deposit', 'golden-hour'],
        content: PROMOTION_POPUP_EXAMPLE_GOLDEN_HOUR,
    },
    {
        slug: 'khuyen-mai-danh-cho-nguoi-moi-choi-nhan-ngay-100k',
        title: 'Người mới nhận ngay 100K',
        subtitle: 'Tặng 100K cho thành viên mới, áp dụng theo điều kiện nền tảng.',
        description: 'Thưởng chào mừng tân thủ — hoàn thành đăng ký và điều kiện nạp/cược theo quy định.',
        badge: 'Đang diễn ra',
        imageUrl: '/images/promotions/cms/newbie-100k.png',
        category: 'new_member',
        order: 20,
        isVisible: true,
        tags: ['cms-seed', 'newbie'],
        content: '<p>Thưởng dành cho hội viên mới. Một tài khoản — một IP. Vi phạm sẽ bị khóa khuyến mãi.</p>',
    },
    {
        slug: 'lu88-khuyen-mai-100-lan-nap-dau-tien',
        title: 'Tặng 100% khi nạp lần đầu',
        subtitle: 'Tặng 100% khi nạp lần đầu — áp dụng cho thành viên mới.',
        description: 'Gói nạp đầu — tỷ lệ thưởng và vòng cược theo cấu hình bonus trên admin.',
        badge: 'Đang diễn ra',
        imageUrl: '/images/promotions/cms/first-deposit-100.png',
        category: 'new_member',
        order: 30,
        isVisible: true,
        tags: ['cms-seed', 'first-deposit'],
        content: '<p>Nạp lần đầu nhận thưởng theo % — xem bảng turnover trong trang chi tiết bonus.</p>',
    },
    {
        slug: 'cuoc-tha-ga-nhan-sieu-hoan-tra-153',
        title: 'Hoàn trả 1.5% không giới hạn',
        subtitle: 'Hoàn trả 1.5% không giới hạn — áp dụng theo sản phẩm được cấu hình.',
        description: 'Cashback cược thể thao / sảnh được chỉ định — không giới hạn mức hoàn theo chương trình.',
        badge: 'Đang diễn ra',
        imageUrl: '/images/promotions/cms/cashback-15.webp',
        category: 'sport',
        order: 40,
        isVisible: true,
        tags: ['cms-seed', 'cashback', 'sports'],
        content: '<p>Hoàn trả theo tổng cược hợp lệ trong kỳ. Chi tiết tỷ lệ và sảnh áp dụng do admin thiết lập.</p>',
    },
    {
        slug: 'golden-hour-tet-2026',
        title: 'Nạp Tiền Đón Lộc Xuân',
        subtitle: 'Nhận ngay Lì Xì May Mắn lên đến 10 Triệu VNĐ',
        description: 'Chương trình Tết — đã kết thúc trên nguồn tham chiếu; lưu làm lịch sử hiển thị.',
        badge: 'Đã kết thúc',
        imageUrl: '/images/promotions/cms/tet-loc-xuan.webp',
        category: 'bonus',
        order: 50,
        isVisible: false,
        endDate: new Date('2026-02-15T23:59:59.000Z'),
        tags: ['cms-seed', 'ended', 'tet'],
        content: '<p>Chương trình theo mùa (đã kết thúc).</p>',
    },
    {
        slug: 'golden-hour-nap-tien-crypto',
        title: 'Nạp Vô Lo - Thưởng Siêu To',
        subtitle: 'Cuối tuần vàng cùng Crypto - Bứt phá cuộc chơi với ưu đãi đặc biệt',
        description: 'Ưu đãi nạp crypto cuối tuần — đã kết thúc trên nguồn tham chiếu.',
        badge: 'Đã kết thúc',
        imageUrl: '/images/promotions/cms/crypto-weekend.webp',
        category: 'bonus',
        order: 60,
        isVisible: false,
        endDate: new Date('2025-12-31T23:59:59.000Z'),
        tags: ['cms-seed', 'ended', 'crypto'],
        content: '<p>Ưu đãi nạp tiền ảo (đã kết thúc).</p>',
    },
    {
        slug: 'lottery-free',
        title: 'Chơi Đề Miễn Phí',
        subtitle: 'Chơi đề miễn phí, lộc về đầy ví',
        description: 'Sự kiện xổ số miễn phí — đã kết thúc trên nguồn tham chiếu.',
        badge: 'Đã kết thúc',
        imageUrl: '/images/promotions/cms/lottery-free.webp',
        category: 'general',
        order: 70,
        isVisible: false,
        endDate: new Date('2025-11-30T23:59:59.000Z'),
        tags: ['cms-seed', 'ended', 'lottery'],
        content: '<p>Chương trình xổ số (đã kết thúc).</p>',
    },
    {
        slug: 'dai-tiec-nap-tien-nhan-thuong',
        title: 'Siêu Ngày Đôi - Nạp tiền nhận ngay 11 Triệu Đồng',
        subtitle: 'Siêu Ngày Đôi - Nạp tiền nhận ngay 11 Triệu Đồng',
        description: 'Đại tiệc nạp tiền — đã kết thúc trên nguồn tham chiếu.',
        badge: 'Đã kết thúc',
        imageUrl: '/images/promotions/cms/sieu-ngay-doi.webp',
        category: 'bonus',
        order: 80,
        isVisible: false,
        endDate: new Date('2025-11-20T23:59:59.000Z'),
        tags: ['cms-seed', 'ended'],
        content: '<p>Sự kiện nạp tiền (đã kết thúc).</p>',
    },
];

async function main() {
    const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
    if (!uri) {
        console.error('Thiếu DATABASE_URL hoặc MONGODB_URI trong .env');
        process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected');

    for (const row of ROWS) {
        await PromotionModel.findOneAndUpdate(
            { slug: row.slug },
            {
                $set: {
                    slug: row.slug,
                    title: row.title,
                    subtitle: row.subtitle,
                    badge: row.badge,
                    description: row.description,
                    content: row.content,
                    imageUrl: row.imageUrl,
                    category: row.category,
                    tags: row.tags,
                    order: row.order,
                    isVisible: row.isVisible,
                    isMaintenance: false,
                    startDate: row.startDate ?? null,
                    endDate: row.endDate ?? null,
                    ctaText: 'Tìm hiểu thêm',
                    ctaUrl: '',
                },
            },
            { upsert: true, new: true },
        );
        console.log('Upserted promotion:', row.slug);
    }

    await mongoose.disconnect();
    console.log('Done. Ảnh dùng đường dẫn tĩnh:', ROWS[0]?.imageUrl);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
