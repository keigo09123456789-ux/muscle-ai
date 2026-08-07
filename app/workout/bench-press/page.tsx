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

const CURRENT_SETS_KEY = "muscle-ai-bench-press-sets";
const HISTORY_KEY = "muscle-ai-workout-history";

export default function BenchPressPage() {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedSets = localStorage.getItem(CURRENT_SETS_KEY);

    if (savedSets) {
      setSets(JSON.parse(savedSets));
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(CURRENT_SETS_KEY, JSON.stringify(sets));
  }, [sets, loaded]);

  function addSet() {
    const weightNumber = Number(weight);
    const repsNumber = Number(reps);

    if (weightNumber <= 0 || repsNumber <= 0) {
      alert("重量と回数を入力してください");
      return;
    }

    const newSet: WorkoutSet = {
      id: Date.now(),
      weight: weightNumber,
      reps: repsNumber,
    };

    setSets([...sets, newSet]);
    setWeight("");
    setReps("");
  }

  function deleteSet(id: number) {
    setSets(sets.filter((set) => set.id !== id));
  }

  function clearWorkout() {
    if (sets.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "今日のベンチプレス記録をすべて削除しますか？"
    );

    if (!confirmed) {
      return;
    }

    setSets([]);
  }

  function completeWorkout() {
    if (sets.length === 0) {
      alert("セットを1つ以上登録してください");
      return;
    }

    const volume = sets.reduce(
      (total, set) => total + set.weight * set.reps,
      0
    );

    const newHistory: WorkoutHistory = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ja-JP"),
      exercise: "ベンチプレス",
      sets,
      volume,
    };

    const savedHistory = localStorage.getItem(HISTORY_KEY);

    const history: WorkoutHistory[] = savedHistory
      ? JSON.parse(savedHistory)
      : [];

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify([newHistory, ...history])
    );

    setSets([]);
    localStorage.removeItem(CURRENT_SETS_KEY);

    alert("トレーニング記録を履歴に保存しました！");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/workout"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← 種目一覧へ戻る
        </Link>

        <h1 className="mt-8 text-4xl font-bold">ベンチプレス</h1>

        <p className="mt-3 text-zinc-400">
          重量と回数を入力して、セットを記録しましょう
        </p>

        <div className="mt-8 rounded-2xl bg-zinc-900 p-6">
          <label className="block text-sm text-zinc-300">重量</label>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="0.5"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="例：80"
              className="w-full rounded-xl bg-zinc-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <span className="text-zinc-400">kg</span>
          </div>

          <label className="mt-6 block text-sm text-zinc-300">回数</label>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={reps}
              onChange={(event) => setReps(event.target.value)}
              placeholder="例：10"
              className="w-full rounded-xl bg-zinc-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <span className="text-zinc-400">回</span>
          </div>

          <button
            type="button"
            onClick={addSet}
            className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold transition hover:bg-blue-700"
          >
            セットを追加
          </button>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">今日の記録</h2>

            {sets.length > 0 && (
              <button
                type="button"
                onClick={clearWorkout}
                className="text-sm text-red-400 transition hover:text-red-300"
              >
                全削除
              </button>
            )}
          </div>

          {sets.length === 0 ? (
            <p className="mt-4 text-zinc-500">
              まだセットが登録されていません
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {sets.map((set, index) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between rounded-xl bg-zinc-900 p-4"
                >
                  <div>
                    <p className="text-sm text-zinc-400">
                      {index + 1}セット目
                    </p>

                    <p className="mt-1 font-semibold">
                      {set.weight}kg × {set.reps}回
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteSet(set.id)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold transition hover:bg-red-700"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={completeWorkout}
          className="mt-8 w-full rounded-xl bg-green-600 py-3 font-bold transition hover:bg-green-700"
        >
          トレーニング完了
        </button>

        <Link
          href="/history"
          className="mt-4 block w-full rounded-xl bg-zinc-800 py-3 text-center font-bold transition hover:bg-zinc-700"
        >
          履歴を見る
        </Link>
      </div>
    </main>
  );
}