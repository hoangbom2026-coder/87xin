/**
 * Alias PM2 cho production — trùng nội dung `ecosystem.config.cjs`
 * (API :8701 + admin vite preview :8781; frontend do Nginx serve dist).
 *
 *   pm2 start /var/87app/deploy/ecosystem.prod.js
 *   # hoặc: ECOSYSTEM_FILE=ecosystem.prod.js sudo bash /var/87app/deploy/deploy.sh
 */
module.exports = require("./ecosystem.config.cjs");
