"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  function translateAuthError(message: string): string {
  const errors: Record<string, string> = {
    "Invalid login credentials":
      "メールアドレスまたはパスワードが違います",
    "Email not confirmed":
      "メール認証が完了していません。届いたメールを確認してください",
    "User already registered":
      "このメールアドレスはすでに登録されています",
    "Password should be at least 6 characters":
      "パスワードは6文字以上で入力してください",
    "Email rate limit exceeded":
      "メールの送信回数が上限に達しました。時間をおいてお試しください",
  };

  return errors[message] ?? "エラーが発生しました。入力内容をご確認ください";
}

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signUp() {
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(translateAuthError(error.message));
      return;
    }

    setMessage(
  "登録したメールアドレスに認証メールを送信しました。届いたメールのリンクから認証を行ってください。"
);
  }

  async function signIn() {
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(translateAuthError(error.message));
      return;
    }

    setMessage("ログインできました！");
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-md">
        <h1 className="text-4xl font-bold">💪 MuscleAI</h1>

        <h2 className="mt-8 text-2xl font-bold">ログイン</h2>

        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-6 w-full rounded-xl bg-zinc-800 p-4"
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-xl bg-zinc-800 p-4"
        />

        <button
          type="button"
          onClick={signIn}
          className="mt-6 w-full rounded-xl bg-blue-600 p-4 font-bold"
        >
          ログイン
        </button>

        <button
          type="button"
          onClick={signUp}
          className="mt-3 w-full rounded-xl bg-zinc-700 p-4 font-bold"
        >
          新規登録
        </button>

        {message && (
          <p className="mt-5 text-center text-sm">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}