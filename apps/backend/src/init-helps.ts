import HelpModel from '@main/models/help.model';

/** Seed trợ giúp pháp lý / FAQ để DB đầy đủ và Help Center có nội dung khi trống */
export async function initDefaultHelps(): Promise<void> {
    const defaults: Array<{
        slug: string;
        icon: string;
        title: string;
        lang: string;
        content: string;
    }> = [
        {
            slug: 'terms',
            icon: 'icon-park-outline:notebook',
            title: 'Điều khoản & Điều kiện',
            lang: 'vi',
            content:
                '<p>Điều khoản dịch vụ được cập nhật định kỳ. Người chơi đăng ký đồng ý tuân thủ các quy định về tuổi hợp pháp, một tài khoản, giao dịch và khuyến mãi.</p>'
        },
        {
            slug: 'privacy',
            icon: 'icon-park-outline:shield',
            title: 'Chính sách bảo mật',
            lang: 'vi',
            content:
                '<p>Chúng tôi thu thập dữ liệu cần thiết để vận hành tài khoản và tuân thủ pháp luật. Thông tin được bảo vệ và không bán cho bên thứ ba.</p>'
        },
        {
            slug: 'about',
            icon: 'icon-park-outline:building-one',
            title: 'Về chúng tôi',
            lang: 'vi',
            content:
                '<p>Nền tảng giải trí trực tuyến — casino & thể thao — hỗ trợ 24/7.</p>'
        },
        {
            slug: 'terms',
            icon: 'icon-park-outline:notebook',
            title: 'Terms & Conditions',
            lang: 'en',
            content:
                '<p>Service terms are updated periodically. One account per player; deposits and withdrawals subject to verification.</p>'
        },
        {
            slug: 'privacy',
            icon: 'icon-park-outline:shield',
            title: 'Privacy policy',
            lang: 'en',
            content:
                '<p>We collect data required to operate accounts and comply with regulations.</p>'
        },
        {
            slug: 'about',
            icon: 'icon-park-outline:building-one',
            title: 'About us',
            lang: 'en',
            content:
                '<p>Online entertainment platform — sports & casino — with 24/7 support.</p>'
        }
    ];

    for (const doc of defaults) {
        const exists = await HelpModel.findOne({ slug: doc.slug, lang: doc.lang });
        if (!exists) {
            await HelpModel.create({ ...doc, status: true });
        }
    }
}
