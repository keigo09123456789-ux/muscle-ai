"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type WorkoutSet = {
  id: number;
  weight: number;
  reps: number;
};

type WorkoutHistory = {
  id: number;
  date: string;
  exercise: string;
  exerciseId?: string;
  sets: WorkoutSet[];
  volume: number;
};

const HISTORY_KEY = "muscle-ai-workout-history";

export default function HistoryPage() {
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("all");

  useEffect(() => {
    const savedHistory = localStorage.getItem(HISTORY_KEY);

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const exerciseNames = useMemo(() => {
    return Array.from(
      new Set(history.map((item) => item.exercise))
    );
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (selectedExercise === "all") {
      return history;
    }

    return history.filter(
      (item) => item.exercise === selectedExercise
    );
  }, [history, selectedExercise]);

  const statsHistory =
    selectedExercise === "all"
      ? history
      : filteredHistory;

  const bestWeight = useMemo(() => {
    if (statsHistory.length === 0) {
      return 0;
    }

    return Math.max(
      ...statsHistory.flatMap((workout) =>
        workout.sets.map((set) => set.weight)
      )
    );
  }, [statsHistory]);

  const estimatedOneRepMax = useMemo(() => {
    if (statsHistory.length === 0) {
      return 0;
    }

    return Math.max(
      ...statsHistory.flatMap((workout) =>
        workout.sets.map(
          (set) => set.weight * (1 + set.reps / 30)
        )
      )
    );
  }, [statsHistory]);

  const chartData = useMemo(() => {
    return [...filteredHistory]
      .reverse()
      .map((workout, index) => ({
        name: `${index + 1}回目`,
        date: workout.date,
        exercise: workout.exercise,
        maxWeight: Math.max(
          ...workout.sets.map((set) => set.weight)
        ),
      }));
  }, [filteredHistory]);

  function deleteHistory(id: number) {
    const updatedHistory = history.filter(
      (item) => item.id !== id
    );

    setHistory(updatedHistory);

    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(updatedHistory)
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← ホームへ戻る
        </Link>

        <h1 className="mt-8 text-4xl font-bold">
          📊 トレーニング履歴
        </h1>

        <div className="mt-8">
          <label className="text-sm text-zinc-400">
            種目を選択
          </label>

          <select
            value={selectedExercise}
            onChange={(event) =>
              setSelectedExercise(event.target.value)
            }
            className="mt-2 w-full rounded-xl bg-zinc-900 px-4 py-3 outline-none"
          >
            <option value="all">すべての種目</option>

            {exerciseNames.map((exercise) => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>
        </div>

        {statsHistory.length > 0 && (
          <>
            <section className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">
                  🏆 最高重量
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {bestWeight} kg
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">
                  🧮 推定1RM
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {estimatedOneRepMax.toFixed(1)} kg
                </p>
              </div>
            </section>

            <section className="mt-8 rounded-2xl bg-zinc-900 p-6">
              <h2 className="text-2xl font-bold">
                📈 最高重量の推移
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                選択した種目の成長を表示します
              </p>

              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="name" />

                    <YAxis />

                    <Tooltip
                      formatter={(value) => [
                        `${value} kg`,
                        "最高重量",
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;

                        return item
                          ? `${label} / ${item.date} / ${item.exercise}`
                          : label;
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="maxWeight"
                      strokeWidth={3}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {filteredHistory.length === 0 ? (
          <p className="mt-8 text-zinc-500">
            履歴がありません
          </p>
        ) : (
          <div className="mt-8 space-y-6">
            {filteredHistory.map((item) => (
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