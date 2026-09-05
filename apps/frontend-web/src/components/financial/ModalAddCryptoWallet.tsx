/**
 * Modal to add and save a new crypto wallet address.
 */
import * as React from 'react';
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { DEPOSIT_CRYPTO_NETWORKS } from '../../constants/financial';
import { cn } from '../../lib/cn';

export interface SavedCryptoWalletPayload {
  networkId: string;
  networkName: string;
  address: string;
}

export interface ModalAddCryptoWalletProps {
  open: boolean;
  onClose: () => void;
  existingAddressKeys?: Set<string>;
  onSaved: (payload: SavedCryptoWalletPayload) => void;
}

export const ModalAddCryptoWallet: React.FC<ModalAddCryptoWalletProps> = ({
  open,
  onClose,
  existingAddressKeys,
  onSaved,
}) => {
  const { t } = useLanguage();
  const [networkId, setNetworkId] = useState('TRC20');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError(t('wallet.addressRequired', 'Vui lòng nhập địa chỉ ví'));
      return;
    }
    const key = `${networkId}_${address.trim()}`;
    if (existingAddressKeys?.has(key)) {
      setError(t('wallet.addressExists', 'Địa chỉ ví đã tồn tại'));
      return;
    }
    const network = DEPOSIT_CRYPTO_NETWORKS.find((n) => n.id === networkId);
    onSaved({
      networkId,
      networkName: network?.name || networkId,
      address: address.trim(),
    });
    setAddress('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#161f2c] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <h3 className="text-xl font-bold text-amber-400">
          {t('wallet.addCryptoTitle', 'Thêm Địa Chỉ Ví Crypto')}
        </h3>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Mạng lưới</label>
            <select
              value={networkId}
              onChange={(e) => setNetworkId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
            >
              {DEPOSIT_CRYPTO_NETWORKS.map((n) => (
                <option key={n.id} value={n.id} className="bg-[#161f2c]">
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Địa chỉ ví (TRC20)</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ ví USDT..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-sm"
            >
              Lưu địa chỉ ví
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalAddCryptoWallet;
