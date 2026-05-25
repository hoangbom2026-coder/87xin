import VipCashbackModel from '@main/models/vip-cashback.model';
import balanceService from './balance.service';
import transactionService from './transaction.service';
import telegramService from './telegram.service';

const processAutomatedCashback = async () => {
    console.log('---Reward Bot: Processing Cashback---');
    const pendingCashbacks = await VipCashbackModel.find({ claimed: false });
    
    let processedCount = 0;
    for (const cashback of pendingCashbacks) {
        try {
            const userId = String(cashback.userId);
            
            // 1. Credit balance
            await balanceService.depositBalance(userId, cashback.amount);
            
            // 2. Mark as claimed
            cashback.claimed = true;
            await cashback.save();
            
            // 3. Log transaction
            const tnxId = `reward-cashback-${Date.now()}-${cashback._id}`;
            await transactionService.createTransaction({
                userId,
                tnxId,
                amount: cashback.amount,
                beforeAmount: 0,
                afterAmount: cashback.amount,
                type: 'bonus',
                typeDescription: `Automated ${cashback.type} cashback: ${cashback.tiersName}`,
                currencyName: cashback.currency,
                provider: 'system',
                category: 'payment'
            });

            processedCount++;
        } catch (error) {
            console.error(`Reward Bot: Failed to process cashback for user ${cashback.userId}`, (error as Error).message);
        }
    }

    if (processedCount > 0) {
        await telegramService.sendTelegramMessage(
            `🤖 <b>Reward Bot Report</b>\n\n` +
            `✅ Đã xử lý thành công: <b>${processedCount}</b> lệnh hoàn trả (Cashback).\n` +
            `📅 Thời gian: ${new Date().toLocaleString()}`
        );
    }
};

export default {
    processAutomatedCashback
};
