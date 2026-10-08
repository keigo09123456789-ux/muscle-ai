import { test, expect } from "@playwright/test";

test("トレーニングのセットを追加できる", async ({ page }) => {
  // ① ログイン
  await page.goto("http://localhost:3000/login");

  await page.getByPlaceholder("メールアドレス").fill(
    process.env.TEST_USER_EMAIL!
  );

  await page.getByPlaceholder("パスワード").fill(
    process.env.TEST_USER_PASSWORD!
  );

  await page.getByRole("button", { name: "ログイン", exact: true }).click();

  // ② ログイン完了を待つ
  await page.waitForURL("http://localhost:3000/");

  // ③ ベンチプレスへ
  await page.goto("http://localhost:3000/workout/bench-press");

  // ④ セット入力
  await page.getByPlaceholder("例：80").fill("80");
  await page.getByPlaceholder("例：10").fill("10");

  await page.getByRole("button", { name: "セットを追加" }).click();

  // ⑤ 今日の記録に追加されたことを確認
  await expect(page.getByRole("heading", { name: "今日の記録" })).toBeVisible();
await expect(
  page.getByText("まだセットが登録されていません")
).not.toBeVisible();
});