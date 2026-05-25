/**
 * Xóa toàn bộ database MongoDB — CHỈ dùng môi trường dev.
 * Chạy: CONFIRM_RESET_DEV_DB=yes NODE_ENV=development npx ts-node -r dotenv/config src/scripts/reset-dev-database.ts
 */
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../../.env") });

async function main() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Chỉ cho phép NODE_ENV=development");
  }
  if (process.env.CONFIRM_RESET_DEV_DB !== "yes") {
    throw new Error("Đặt CONFIRM_RESET_DEV_DB=yes để xác nhận drop database");
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Thiếu DATABASE_URL trong .env");
  }
  await mongoose.connect(url);
  const name = mongoose.connection.name;
  await mongoose.connection.dropDatabase();
  // eslint-disable-next-line no-console
  console.log(`Đã drop database: ${name}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
