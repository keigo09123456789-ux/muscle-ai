import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // テスト用アカウントでログイン
  await page.goto("http://localhost:3000/login");

  await page
    .getByPlaceholder("メールアドレス")
    .fill(process.env.TEST_USER_EMAIL!);

  await page
    .getByPlaceholder("パスワード")
    .fill(process.env.TEST_USER_PASSWORD!);

  await page
    .getByRole("button", {
      name: "ログイン",
      exact: true,
    })
    .click();

  await page.waitForURL("http://localhost:3000/");

  // トレーニング画面へ移動
  await page.goto("http://localhost:3000/workout/bench-press");

  // 入力欄が表示されるまで待つ
  await expect(page.getByPlaceholder("例：80")).toBeVisible();
});

test("TC-002: 文字列の回数を拒否する", async ({ page }) => {
  await page.getByPlaceholder("例：80").fill("60");
  await page.getByPlaceholder("例：10").fill("abc");

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe("重量と回数を入力してください");
    await dialog.accept();
  });

  await page.getByRole("button", { name: "セットを追加" }).click();
  

  await expect(
    page.getByText("まだセットが登録されていません")
  ).toBeVisible();
});

test("TC-003: 小数の回数を拒否する", async ({ page }) => {
  await page.getByPlaceholder("例：80").fill("60");
  await page.getByPlaceholder("例：10").fill("10.5");

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe("重量と回数を入力してください");
    await dialog.accept();
  });

  await page.getByRole("button", { name: "セットを追加" }).click();

  await expect(
    page.getByText("まだセットが登録されていません")
  ).toBeVisible();
});

test("TC-001: 正常な回数を追加できる", async ({ page }) => {
  await page.getByPlaceholder("例：80").fill("60");
  await page.getByPlaceholder("例：10").fill("10");

  await page.getByRole("button", { name: "セットを追加" }).click();

  await expect(page.getByText("60kg × 10回")).toBeVisible();
});
