/**
 * Unit tests for balance.service.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import balanceService from '../balance.service';
import BalanceModel from '@main/models/balance.model';
import UserModel from '@main/models/user.model';

vi.mock('@main/models/balance.model', () => ({
  default: {
    aggregate: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
}));

vi.mock('@main/models/user.model', () => ({
  default: {
    findOne: vi.fn(),
    findById: vi.fn(),
    updateOne: vi.fn(),
  },
}));

vi.mock('../vip-level-up-bonus.service', () => ({
  default: {
    checkAndAwardBonus: vi.fn(),
  },
}));

describe('Balance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBalance', () => {
    it('should call BalanceModel.create with userId and currencyId', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const currencyId = '507f1f77bcf86cd799439012';
      const mockDoc = { userId, currencyId, amount: 0 };

      (BalanceModel.create as any).mockResolvedValue(mockDoc);

      const result = await balanceService.createBalance(userId, currencyId);
      expect(BalanceModel.create).toHaveBeenCalledWith({ userId, currencyId });
      expect(result).toEqual(mockDoc);
    });
  });

  describe('creditBalance', () => {
    it('should increment balance amount and return updated doc', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const amount = 50000;
      const mockUpdated = { userId, amount: 150000 };

      (BalanceModel.findOneAndUpdate as any).mockResolvedValue(mockUpdated);

      const result = await balanceService.creditBalance(userId, amount);
      expect(BalanceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { $inc: { amount: 50000 } },
        { new: true }
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('depositBonus', () => {
    it('should increment bonus amount on balance', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const amount = 25000;
      const mockUpdated = { userId, bonus: 25000 };

      (BalanceModel.findOneAndUpdate as any).mockResolvedValue(mockUpdated);

      const result = await balanceService.depositBonus(userId, amount);
      expect(BalanceModel.findOneAndUpdate).toHaveBeenCalledWith(
        { userId },
        { $inc: { bonus: 25000 } },
        { new: true }
      );
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('getBalanceByUserId', () => {
    it('should find balance by userId', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockBalance = { userId, amount: 200000 };

      (BalanceModel.findOne as any).mockResolvedValue(mockBalance);

      const result = await balanceService.getBalanceByUserId(userId);
      expect(BalanceModel.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockBalance);
    });
  });
});
