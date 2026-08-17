"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(`ログアウトに失敗しました: ${error.message}`);
      return;
    }

    router.push("/login");
  }

  return (


    <main className="flex min-h-screen flex-col items-center bg-zinc-950 p-8 text-white">
      <h1 className="mt-10 text-5xl font-bold">💪 MuscleAI</h1>

      <p className="mt-4 text-center text-zinc-400">
        AIがあなた専属のトレーニングコーチ
      </p>

      <div className="mt-10 w-full max-w-md rounded-2xl bg-zinc-900 p-6 shadow-xl">
        <h2 className="text-2xl font-semibold">🔥 今日のトレーニング</h2>

        <p className="mt-3 text-zinc-300">胸の日</p>

        <Link
  href="/workout"
  className="mt-6 block w-full rounded-xl bg-blue-600 py-3 text-center font-bold transition hover:bg-blue-700"
>
  トレーニング開始
</Link>

<button
  type="button"
  onClick={handleLogout}
  className="mt-4 w-full rounded-xl bg-zinc-800 py-3 font-bold transition hover:bg-zinc-700"
>
  ログアウト
</button>
      </div>
    </main>
  );
}