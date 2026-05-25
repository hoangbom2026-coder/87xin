import * as React from 'react'
import CryptoDepositPanel from '../../../components/financial/CryptoDepositPanel'

/**
 * DepositCrypto — panel nạp Crypto (USDT TRC20 / ERC20 / BEP20).
 * Logic UI nằm tại `components/financial/CryptoDepositPanel.tsx` (đã match clone TX88 1:1).
 * File này tách riêng theo chuẩn 1 method = 1 page để dễ mở rộng nếu sau có flow xác nhận chuyển tiền.
 */
const DepositCrypto: React.FC = () => <CryptoDepositPanel />

export default DepositCrypto
