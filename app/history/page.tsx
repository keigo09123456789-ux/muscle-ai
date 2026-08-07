"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type WorkoutSet = {
  id: number;
  weight: number;
  reps: number;
};

type WorkoutHistory = {
  id: number;
  date: string;
  exercise: string;
  sets: WorkoutSet[];
  volume: number;
};

const HISTORY_KEY = "muscle-ai-workout-history";

export default function HistoryPage() {
  const [history, setHistory] = useState<WorkoutHistory[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  function deleteHistory(id: number) {
    const updatedHistory = history.filter((item) => item.id !== id);

    setHistory(updatedHistory);

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(updatedHistory)
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← ホームへ戻る
        </Link>

        <h1 className="mt-8 text-4xl font-bold">📊 トレーニング履歴</h1>

        {history.length === 0 ? (
          <p className="mt-8 text-zinc-500">
            まだトレーニング履歴がありません
          </p>
        ) : (
          <div className="mt-8 space-y-6">
            {history.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl bg-zinc-900 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">
                      {item.date}
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {item.exercise}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteHistory(item.id)}
                    className="text-sm text-red-400 transition hover:text-red-300"
                  >
                    削除
                  </button>
                </div>

                <div className="mt-5 space-y-2">
                  {item.sets.map((set, index) => (
                    <div
                      key={set.id}
                      className="flex justify-between rounded-xl bg-zinc-800 px-4 py-3"
                    >
                      <span className="text-zinc-400">
                        {index + 1}セット目
                      </span>

                      <span className="font-semibold">
                        {set.weight}kg × {set.reps}回
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-zinc-800 pt-4">
                  <p className="text-sm text-zinc-400">
                    総ボリューム
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {item.volume.toLocaleString()} kg
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}