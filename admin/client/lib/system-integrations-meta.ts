/** Đồng bộ slug với backend `PAYMENT_GATEWAY_SLUGS`. */
export const PAYMENT_GATEWAY_SLUGS = [
  "paypal",
  "stripe",
  "coinpayments",
  "razorpay",
  "vougepay",
  "mollie",
  "nowpayments",
  "flutterwave",
  "paystack",
  "paghiper",
  "gourl",
  "perfectmoney",
  "mercadopago",
  "paytm",
  "bank_manual",
] as const;

export type PaymentGatewaySlug = (typeof PAYMENT_GATEWAY_SLUGS)[number];

export const GATEWAY_LABELS_VI: Record<PaymentGatewaySlug, string> = {
  paypal: "PayPal",
  stripe: "Stripe",
  coinpayments: "CoinPayments",
  razorpay: "Razorpay",
  vougepay: "VoguePay",
  mollie: "Mollie",
  nowpayments: "NOWPayments",
  flutterwave: "Flutterwave",
  paystack: "Paystack",
  paghiper: "PagHiper",
  gourl: "GoUrl.io",
  perfectmoney: "Perfect Money",
  mercadopago: "Mercado Pago",
  paytm: "Paytm",
  bank_manual: "Chuyển khoản ngân hàng (thủ công)",
};

export type GatewayCredentialSlot = {
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
};

export type SystemIntegrationsGeneral = {
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
};

export type SystemIntegrationsDoc = {
  gateways: Record<string, GatewayCredentialSlot>;
  general: SystemIntegrationsGeneral;
};
