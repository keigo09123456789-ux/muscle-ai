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
import { supabase } from "@/lib/supabase";

type WorkoutSet = {
  id: number;
  weight: number;
  reps: number;
};

type WorkoutHistory = {
  id: number;
  created_at: string;
  exercise_id: string;
  exercise_name: string;
  sets: WorkoutSet[];
  volume: number;
};

export default function HistoryPage() {
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [aiAdvice, setAiAdvice] = useState("");
const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
     }

      const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setMessage(`履歴の取得に失敗しました: ${error.message}`);
        setLoading(false);
        return;
      }

      setHistory(data ?? []);
      setLoading(false);
    }

    loadHistory();
  }, []);
   
  async function askAiCoach() {
  if (selectedExercise === "all") {
    setAiAdvice("分析したい種目を選んでください！");
    return;
  }

  const targetWorkouts = history.filter(
    (item) => item.exercise_name === selectedExercise
  );

  if (targetWorkouts.length === 0) {
    setAiAdvice("この種目のトレーニング履歴がありません。");
    return;
  }

  setAiLoading(true);
  setAiAdvice("");

  try {
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exerciseName: selectedExercise,
        workouts: targetWorkouts,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "AI分析に失敗しました");
    }

    setAiAdvice(data.advice);
  } catch (error) {
    console.error(error);
    setAiAdvice("AIコーチの分析中にエラーが発生しました。");
  } finally {
    setAiLoading(false);
  }
}
  const exerciseNames = useMemo(() => {
    return Array.from(
      new Set(history.map((item) => item.exercise_name))
    );
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (selectedExercise === "all") {
      return history;
    }

    return history.filter(
      (item) => item.exercise_name === selectedExercise
    );
  }, [history, selectedExercise]);

  const bestWeight = useMemo(() => {
    if (filteredHistory.length === 0) {
      return 0;
    }

    return Math.max(
      ...filteredHistory.flatMap((workout) =>
        workout.sets.map((set) => set.weight)
      )
    );
  }, [filteredHistory]);

  const estimatedOneRepMax = useMemo(() => {
    if (filteredHistory.length === 0) {
      return 0;
    }

    return Math.max(
      ...filteredHistory.flatMap((workout) =>
        workout.sets.map(
          (set) => set.weight * (1 + set.reps / 30)
        )
      )
    );
  }, [filteredHistory]);

  const chartData = useMemo(() => {
    return [...filteredHistory]
      .reverse()
      .map((workout, index) => ({
        name: `${index + 1}回目`,
        date: new Date(workout.created_at).toLocaleDateString("ja-JP"),
        exercise: workout.exercise_name,
        maxWeight: Math.max(
          ...workout.sets.map((set) => set.weight)
        ),
      }));
  }, [filteredHistory]);

  async function deleteHistory(id: number) {
    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", id);

    if (error) {
      alert(`削除に失敗しました: ${error.message}`);
      return;
    }

    setHistory((current) =>
      current.filter((item) => item.id !== id)
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

        {loading && (
          <p className="mt-8 text-zinc-400">
            履歴を読み込み中...
          </p>
        )}

        {!loading && message && (
          <p className="mt-8 text-red-400">
            {message}
          </p>
        )}

        {!loading && history.length > 0 && (
          <>
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
            {/* AIコーチ */}
<section className="mt-8 rounded-2xl bg-zinc-900 p-5">
  <h2 className="text-2xl font-bold">
    🤖 AIコーチ
  </h2>

  <p className="mt-2 text-sm text-zinc-400">
    過去のトレーニング履歴から次回のメニューを分析します
  </p>

  <button
    onClick={askAiCoach}
    disabled={aiLoading || selectedExercise === "all"}
    className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50"
  >
    {aiLoading ? "AIが分析中..." : "AIコーチに分析してもらう"}
  </button>

  {selectedExercise === "all" && (
    <p className="mt-3 text-sm text-zinc-400">
      分析したい種目を選択してください
    </p>
  )}

  {aiAdvice && (
　　<div className="mt-4 whitespace-pre-wrap rounded-xl bg-zinc-800 p-4 leading-7">
    {aiAdvice.replace(/\*\*/g, "")}
  </div>
)}
</section>
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

            <div className="mt-8 space-y-6">
              {filteredHistory.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl bg-zinc-900 p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">
                        {new Date(
                          item.created_at
                        ).toLocaleDateString("ja-JP")}
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        {item.exercise_name}
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
          </>
        )}

        {!loading &&
          !message &&
          history.length === 0 && (
            <p className="mt-8 text-zinc-500">
              まだトレーニング履歴がありません
            </p>
          )}
      </div>
    </main>
  );
}