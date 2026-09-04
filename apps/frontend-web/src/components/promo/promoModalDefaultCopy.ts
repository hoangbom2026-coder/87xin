import type { AppLanguage } from '../../i18n/LanguageContext'

/** Nội dung T&C modal khuyến mãi mặc định (song ngữ) — cấu trúc theo template HTML chuẩn. */
export const promoModalDefaultCopy: Record<
  AppLanguage,
  {
    participateTitle: string
    tnc1: string
    tnc2: string
    tnc3: string
    howApplyTitle: string
    apply1: string
    apply2: string
    apply3: string
    detailsTitle: string
    thProvider: string
    thBonus: string
    thMax: string
    thTurnover: string
    rowLive: string
    rowSlots: string
    rowSports: string
    rowEmpty: string
    bonusPct: string
    max300a: string
    max300b: string
    max200: string
    turnover25: string
    turnover20a: string
    turnover20b: string
    turnover4: string
    rebateNote: string
    exampleTitle: string
    thFormula: string
    thFormulaVal: string
    exRow1a: string
    exRow1b: string
    exRow2a: string
    exRow2b: string
    slotsSectionTitle: string
    slotsSectionBody: string
    megaSectionTitle: string
    megaSectionBody: string
    rulesTitle: string
    rulesBody: string
  }
> = {
  en: {
    participateTitle: 'How to stand a chance to participate?',
    tnc1: 'This promotion is limited to members who place their first deposit.',
    tnc2: 'New Members are required to transfer a minimum of RM50 to the specified wallet.',
    tnc3: 'New Members can apply for this bonus ONCE (1).',
    howApplyTitle: 'How to apply?',
    apply1:
      'Step 1: Click on [Account], then select [Deposit].\nStep 2: Transfer your credits by selecting Main Wallet on [From] and select the specific slots provider on [To].\nStep 3: Select "-------------" from the promotion category.',
    apply2:
      'Members can only withdraw a maximum of RM1488 after selecting the bonus. Additional credit amount exceeding the withdrawal limit will be deducted from their respective accounts prior to withdrawal.',
    apply3: 'New Members can apply for this bonus ONCE (1).',
    detailsTitle: 'Details:',
    thProvider: 'Gaming Provider',
    thBonus: 'Bonus Amount',
    thMax: 'Max Bonus(MYR)',
    thTurnover: 'Turnover/Winover',
    rowLive: "Every Live Casino's provider",
    rowSlots: 'Every Slots & Fishing provider except for',
    rowSports: 'Every Sports Provider',
    rowEmpty: '',
    bonusPct: '100%',
    max300a: 'MYR 300',
    max300b: 'MYR 300',
    max200: 'MYR 200',
    turnover25: '25x',
    turnover20a: '20x',
    turnover20b: '20x',
    turnover4: '4x (winover)',
    rebateNote: 'Members are not entitled for rebate prior to claiming bonus',
    exampleTitle: 'Example:',
    thFormula: 'Formula for the calculation of turnover',
    thFormulaVal: '(Deposit + Bonus) x turnover multiplier = Total turnover (Bets placed)',
    exRow1a: 'How to achieve the turnover requirement',
    exRow1b: 'Accumulate total bets placed until turnover has been reached.',
    exRow2a: 'Example of calculation of turnover:',
    exRow2b:
      'Deposit: MYR 100\nBonus: MYR 100\nYou will get: MYR 200\nTurnover multiplier: 20x\n(MYR100+MYR100)x20 = MYR4000',
    slotsSectionTitle: 'As for every slots provider',
    slotsSectionBody:
      'Bets placed on unincluded providers (Table games, Live Poker, Number games, Scratch & Arcade) will not be calculated into the turnover.',
    megaSectionTitle: 'As for MEGA888 & 918kiss',
    megaSectionBody:
      'Bonus claimed can only be used to play slots.\nWe reserve the rights to cancel or forfeit the bonus claimed by members if found guilty of playing online games such as Live entertainment, Live casino, Live table games; or games unrelated to Slots such as Live table games, Live poker and number games.',
    rulesTitle: 'Rules & Regulations:',
    rulesBody:
      'Members can only claim this bonus ONCE (1). Members who are caught using multiple accounts to claim this bonus will be suspended from their participation rights and any winnings and bonus claimed will be forfeited immediately.\nMember with one account have the rights to claim this bonus. As an illustration, ONE (1) Name and ONE (1) IP Address will be able to claim this promotion 1 time only.\nMembers who request for the bonus at the specific time frame shall not perform any transfer of credits to the gaming provider before achieving the turnover requirement or when their credit is fully considered as a loss. Members can only perform a withdrawal after achieving the turnover requirement or when the bonus has been considered as a loss.\nThis promotion may NOT be claimed individually and in conjunction with any other promotions.\nIn the case that there are misunderstandings between languages (English, Mandarin, Bahasa Malaysia) in the explanation of the rules and regulations of the bonus will stick to the explanation from the English language.',
  },
  vi: {
    participateTitle: 'Làm thế nào để tham gia?',
    tnc1: 'Khuyến mãi chỉ áp dụng cho thành viên thực hiện lần nạp đầu tiên.',
    tnc2: 'Thành viên mới cần chuyển tối thiểu RM50 vào ví được chỉ định.',
    tnc3: 'Thành viên mới chỉ được đăng ký nhận thưởng này MỘT (1) lần.',
    howApplyTitle: 'Cách đăng ký nhận thưởng?',
    apply1:
      'Bước 1: Vào [Tài khoản], chọn [Nạp tiền].\nBước 2: Chuyển khoản từ Ví chính [Từ] sang nhà cung cấp slot chỉ định [Đến].\nBước 3: Chọn mục khuyến mãi tương ứng trong danh sách.',
    apply2:
      'Sau khi chọn thưởng, thành viên chỉ được rút tối đa RM1488; phần vượt giới hạn sẽ bị trừ trước khi rút.',
    apply3: 'Thành viên mới chỉ được đăng ký nhận thưởng này MỘT (1) lần.',
    detailsTitle: 'Chi tiết:',
    thProvider: 'Nhà cung cấp',
    thBonus: 'Mức thưởng',
    thMax: 'Thưởng tối đa (MYR)',
    thTurnover: 'Vòng cược / Winover',
    rowLive: 'Tất cả nhà cung cấp Live Casino',
    rowSlots: 'Tất cả Slot & Bắn cá (trừ các nhà loại trừ)',
    rowSports: 'Tất cả nhà cung cấp Thể thao',
    rowEmpty: '',
    bonusPct: '100%',
    max300a: 'MYR 300',
    max300b: 'MYR 300',
    max200: 'MYR 200',
    turnover25: '25x',
    turnover20a: '20x',
    turnover20b: '20x',
    turnover4: '4x (winover)',
    rebateNote: 'Thành viên không được tính hoàn trả trước khi nhận thưởng.',
    exampleTitle: 'Ví dụ:',
    thFormula: 'Công thức tính tổng vòng cược',
    thFormulaVal: '(Nạp + Thưởng) × hệ số vòng cược = Tổng vòng cược (cược hợp lệ)',
    exRow1a: 'Cách hoàn thành yêu cầu vòng cược',
    exRow1b: 'Tích lũy tổng cược cho đến khi đạt đủ vòng cược.',
    exRow2a: 'Ví dụ tính vòng cược:',
    exRow2b:
      'Nạp: MYR 100\nThưởng: MYR 100\nBạn nhận: MYR 200\nHệ số vòng cược: 20x\n(MYR100+MYR100)×20 = MYR4000',
    slotsSectionTitle: 'Đối với từng nhà cung cấp slot',
    slotsSectionBody:
      'Cược tại các nhà không nằm trong danh sách (Table games, Live Poker, Number games, Scratch & Arcade) sẽ không được tính vào vòng cược.',
    megaSectionTitle: 'Đối với MEGA888 & 918kiss',
    megaSectionBody:
      'Thưởng chỉ dùng để chơi slot.\nChúng tôi có quyền hủy hoặc thu hồi thưởng nếu phát hiện chơi Live casino, bàn live, poker live, game số, v.v.',
    rulesTitle: 'Quy định & điều khoản:',
    rulesBody:
      'Mỗi thành viên chỉ được nhận thưởng MỘT (1) lần. Phát hiện đa tài khoản để nhận thưởng sẽ bị khóa quyền tham gia và thu hồi thưởng.\nMột (1) tên và một (1) IP chỉ nhận khuyến mãi một lần.\nSau khi đăng ký nhận thưởng, không chuyển khoản sang nhà cung cấp trước khi hoàn thành vòng cược hoặc khi thua hết — chỉ rút được sau khi đạt vòng cược hoặc thưởng được xem là thua hết.\nKhông kết hợp với khuyến mãi khác.\nNếu có sai lệch giữa các ngôn ngữ, ưu tiên bản tiếng Anh.',
  },
}
