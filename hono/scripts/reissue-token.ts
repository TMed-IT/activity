/**
 * トークン再発行スクリプト
 *
 * 実行
 * - yarn reissue-token <screen_name>
 *
 * 事前に `wrangler login` が必要です
 */
import { v4 as uuidv4 } from "uuid";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bcrypt from "bcryptjs";

// src/libs/token.ts と同様の関数を実装
const hashToken = (token: string) => {
  return bcrypt.hashSync(token, 10)
};

const getIdToken = (userId: string, token: string) => {
  return `${userId}:${token}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const honoDir = join(__dirname, "..");
const DB_NAME = "activity";

const screenName = process.argv[2];
if (!screenName) {
  console.error("Usage: yarn reissue-token <screen_name>");
  process.exit(1);
}

// スクリーンネームの形式チェック
if (!/^[a-z0-9_]{4,16}$/.test(screenName)) {
  console.error("Error: screen name must match [a-z0-9_]{4,16}");
  process.exit(1);
}

// ユーザを検索
console.log("Fetching user from D1...");
let selectOutput: string;
try {
  selectOutput = execSync(
    `wrangler d1 execute ${DB_NAME} --remote --json --command "SELECT id FROM user WHERE screen_name = '${screenName}'"`,
    { encoding: "utf-8", cwd: honoDir }
  );
} catch (e) {
  console.error("Failed to query D1:", e);
  process.exit(1);
}

let userId: string;
try {
  const parsed = JSON.parse(selectOutput);
  const row = parsed[0]?.results?.[0];
  if (!row) {
    console.error("User not found.");
    process.exit(1);
  }
  userId = row.id;
} catch (e) {
  console.error("Failed to parse D1 response:", e);
  process.exit(1);
}
console.log(`Found: ${screenName} (${userId})`);

// 新しいトークンを生成してハッシュ化
const token = uuidv4();
const hashedToken = hashToken(token);
const idToken = getIdToken(userId, token);

// D1 を更新
console.log("Updating hashed_token in D1...");
try {
  const escapedHash = hashedToken.replace(/\$/g, "\\$");
  execSync(
    `wrangler d1 execute ${DB_NAME} --remote --command "UPDATE user SET hashed_token = '${escapedHash}' WHERE id = '${userId}'"`,
    { encoding: "utf-8", cwd: honoDir }
  );
} catch (e) {
  console.error("Failed to update D1:", e);
  process.exit(1);
}

console.log(`\nToken re-issued successfully!
- Screen name: ${screenName}
- User ID    : ${userId}
- New token  : ${idToken}`);
