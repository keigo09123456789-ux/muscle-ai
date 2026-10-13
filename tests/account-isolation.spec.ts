
import { test, expect } from "@playwright/test";

const accounts = [
  {
    name: "アカウントA",
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
  },
  {
    name: "アカウントB",
    email: process.env.TEST_USER_B_EMAIL,
    password: process.env.TEST_USER_B_PASSWORD,
  },
];

for (const account of accounts) {
  test(`${account.name}でログインできる`, async ({ page }) => {
    if (!account.email || !account.password) {
      throw new Error(`${account.name}のテスト用認証情報が未設定です`);
    }

    await page.goto("http://localhost:3000/login");

    await page.getByPlaceholder("メールアドレス").fill(account.email);
    await page.getByPlaceholder("パスワード").fill(account.password);

    await page
      .getByRole("button", { name: "ログイン", exact: true })
      .click();

    await expect(page).toHaveURL("http://localhost:3000/");
  });
}


test("アカウントBはアカウントAの記録を取得できない", async ({ page }) => {
  const emailA = process.env.TEST_USER_EMAIL;
  const passwordA = process.env.TEST_USER_PASSWORD;
  const emailB = process.env.TEST_USER_B_EMAIL;
  const passwordB = process.env.TEST_USER_B_PASSWORD;

  if (!emailA || !passwordA || !emailB || !passwordB) {
    throw new Error("テスト用アカウントの認証情報が未設定です");
  }

  // AでログインしてユーザーIDを取得
  await page.goto("http://localhost:3000/login");
  await page.getByPlaceholder("メールアドレス").fill(emailA);
  await page.getByPlaceholder("パスワード").fill(passwordA);
  await page.getByRole("button", { name: "ログイン", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3000/");

  const userIdA = await page.evaluate(async () => {
    const key = Object.keys(localStorage).find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
    );
    if (!key) throw new Error("Supabaseのセッションが見つかりません");

    const session = JSON.parse(localStorage.getItem(key)!);
    return session.user.id as string;
  });

  // Bは別のブラウザ環境でログイン
  const contextB = await page.context().browser()!.newContext();
  const pageB = await contextB.newPage();

  try {
    await pageB.goto("http://localhost:3000/login");
    await pageB.getByPlaceholder("メールアドレス").fill(emailB);
    await pageB.getByPlaceholder("パスワード").fill(passwordB);
    await pageB.getByRole("button", { name: "ログイン", exact: true }).click();
    await expect(pageB).toHaveURL("http://localhost:3000/");

    // Bの認証情報でSupabaseのREST APIに直接問い合わせる
    const result = await pageB.evaluate(async (idA) => {
      const key = Object.keys(localStorage).find(
        (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
      );
      if (!key) throw new Error("Bのセッションが見つかりません");

      const session = JSON.parse(localStorage.getItem(key)!);
      
      // ブラウザ内では環境変数を直接参照できないため、
      // この部分は次のステップで設定する
      return { idA, hasSession: Boolean(session.access_token) };
    }, userIdA);

   
expect(result.hasSession).toBe(true);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error("Supabaseの環境変数が未設定です");
}

// アカウントBのアクセストークンをブラウザから取得
const accessTokenB = await pageB.evaluate(() => {
  const key = Object.keys(localStorage).find(
    (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
  );

  if (!key) throw new Error("Bのセッションが見つかりません");

  const session = JSON.parse(localStorage.getItem(key)!);
  return session.access_token as string;
});

// Bの権限でAの記録を直接検索
const response = await pageB.request.get(
  `${supabaseUrl}/rest/v1/workouts`,
  {
    params: {
      select: "id,user_id",
      user_id: `eq.${userIdA}`,
    },
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessTokenB}`,
    },
  }
);

expect(response.ok()).toBe(true);

const records = await response.json();
expect(records).toEqual([]);

  } finally {
    await contextB.close();
  }
});
