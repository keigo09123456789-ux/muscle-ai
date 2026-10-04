"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function calculateEstimated1RM(weight: number, reps: number) {
  if (!weight || !reps) return 0;

  return weight * (1 + reps / 30);
}

export default function Home() {
  const router = useRouter();

const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
const [allWorkouts, setAllWorkouts] = useState<any[]>([]);

const [loading, setLoading] = useState(true);
const [graphPeriod, setGraphPeriod] = useState<"week" | "month" | "year">("month");

const [graphMetric, setGraphMetric] = useState<"1rm" | "volume">("1rm");

const [selectedExercise, setSelectedExercise] = useState("ベンチプレス");

const graphData = allWorkouts
  .filter((workout) => {
    if (workout.exercise_name !== selectedExercise) {
  return false;
}


    const workoutDate = new Date(workout.created_at);
    const now = new Date();

    const startDate = new Date();

    if (graphPeriod === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (graphPeriod === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    return workoutDate >= startDate;
  })
  .map((workout) => {
    const sets = workout.sets ?? [];

    const estimated1RM = Math.max(
      ...sets.map((set: any) =>
        calculateEstimated1RM(Number(set.weight), Number(set.reps))
      ),
      0
    );

    const totalVolume = sets.reduce((total: number, set: any) => {
  const weight = Number(set.weight) || 0;
  const reps = Number(set.reps) || 0;

  return total + weight * reps;
}, 0);

    return {
      date: new Date(workout.created_at).toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
      }),
      estimated1RM: Number(estimated1RM.toFixed(1)),
      totalVolume: Number(totalVolume.toFixed(1)),
    };
  })
  .reverse();

  const latestValue =
  graphData.length > 0
    ? graphMetric === "1rm"
      ? graphData[graphData.length - 1].estimated1RM
      : graphData[graphData.length - 1].totalVolume
    : 0;

const previousValue =
  graphData.length > 1
    ? graphMetric === "1rm"
      ? graphData[graphData.length - 2].estimated1RM
      : graphData[graphData.length - 2].totalVolume
    : 0;

const difference = latestValue - previousValue;

const differencePercent =
  previousValue > 0
    ? (difference / previousValue) * 100
    : 0;

    const personalBest =
  graphData.length > 0
    ? Math.max(...graphData.map((item) => item.estimated1RM))
    : 0;

const isNewPR =
  graphMetric === "1rm" &&
  graphData.length >= 2 &&
  latestValue === personalBest &&
  latestValue > previousValue;

  const allTimePR = allWorkouts
  .filter((workout) => workout.exercise_name === selectedExercise)
  .reduce((best: number, workout) => {
    const sets = workout.sets ?? [];

    const workoutBest = Math.max(
      ...sets.map((set: any) =>
        calculateEstimated1RM(
          Number(set.weight),
          Number(set.reps)
        )
      ),
      0
    );

    return Math.max(best, workoutBest);
  }, 0);

const kgToAllTimePR = Math.max(allTimePR - personalBest, 0);

const exerciseOptions = Array.from(
  new Set(
    allWorkouts
      .map((workout) => workout.exercise_name)
      .filter(Boolean)
  )
);

const thisWeekCount = allWorkouts.filter((workout) => {
  const workoutDate = new Date(workout.created_at);

  const now = new Date();
  const startOfWeek = new Date(now);

  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;

  startOfWeek.setDate(now.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  return workoutDate >= startOfWeek;
  console.log("今週判定", {
  workoutDate,
  startOfWeek,
  result: workoutDate >= startOfWeek,
});

}).length;

useEffect(() => {
  async function fetchRecentWorkouts() {
    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("最近のトレーニング取得エラー:", error);
      setLoading(false);
      return;
    }

    setAllWorkouts(data ?? []);
    console.log("全履歴データ:", data);
setRecentWorkouts((data ?? []).slice(0, 3));

    setLoading(false);
  }

  fetchRecentWorkouts();
}, []);


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


<section className="mt-10 w-full max-w-2xl px-4">
  <h2 className="mb-4 text-2xl font-bold">
    📊 ダッシュボード
  </h2>

 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
     <div className="rounded-2xl bg-zinc-900 p-4 text-center">
      <p className="text-sm text-zinc-400">🔥 今週</p>
      <p className="mt-2 text-2xl font-bold">
        {thisWeekCount}回
      </p>
    </div>

    <div className="rounded-2xl bg-zinc-900 p-4 text-center">
      <p className="text-sm text-zinc-400">🏆 最新1RM</p>
      <p className="mt-2 text-2xl font-bold">
        {recentWorkouts[0]?.sets?.length
          ? Math.max(
              ...recentWorkouts[0].sets.map((set: any) =>
                calculateEstimated1RM(
                  Number(set.weight),
                  Number(set.reps)
                )
              )
            ).toFixed(1)
          : "—"}
        kg
      </p>
    </div>

    <div className="col-span-2 md:col-span-1 rounded-2xl bg-zinc-900 p-4 text-center">
      <p className="text-sm text-zinc-400">💪 最新種目</p>
      <p className="mt-2 break-keep text-base font-bold">
  {recentWorkouts[0]?.exercise_name ?? "—"}
</p>

    </div>
  </div>
</section>

{/* 成長グラフ */}
<section className="mt-10 w-full max-w-2xl px-4">
  <div className="rounded-2xl bg-zinc-900 p-5">
    <h2 className="mb-4 text-2xl font-bold">
      📈 成長グラフ
    </h2>

    {graphData.length >= 2 && (
  <div className="mb-4">
    <p className="text-sm text-zinc-400">
      前回比
    </p>

    {graphMetric === "1rm" && personalBest > 0 && (
  <div className="mb-6 rounded-xl bg-zinc-800 p-4">
    <p className="text-sm text-zinc-400">
  🏆 期間内ベスト
</p>

    <div className="mt-1 flex items-center gap-3">
      <p className="text-2xl font-bold text-white">
        {personalBest.toFixed(1)}kg
      </p>

      {isNewPR && (
        <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-bold text-green-400">
          NEW PR 🔥
        </span>
      )}
    </div>
  </div>
)}

{graphMetric === "1rm" && allTimePR > 0 && (
  <div className="mb-6 rounded-xl bg-zinc-800 p-4">
    <p className="text-sm text-zinc-400">
      👑 歴代PR
    </p>

    <p className="mt-1 text-2xl font-bold text-white">
      {allTimePR.toFixed(1)}kg
    </p>
    {personalBest >= allTimePR ? (
  <p className="mt-2 font-bold text-green-400">
    🎉 歴代PR達成！
  </p>
) : (
  <p className="mt-2 text-zinc-400">
    あと
    <span className="mx-1 font-bold text-white">
      {kgToAllTimePR.toFixed(1)}kg
    </span>
    で歴代PR！
  </p>
)}
  </div>
)}

    <p
      className={`text-xl font-bold ${
        difference > 0
          ? "text-green-400"
          : difference < 0
          ? "text-red-400"
          : "text-zinc-400"
      }`}
    >
      {difference > 0 ? "↑" : difference < 0 ? "↓" : "→"}{" "}
      {difference > 0 ? "+" : ""}
      {difference.toFixed(1)}
      {graphMetric === "1rm" ? "kg" : "kg"}
      {" ("}
      {differencePercent > 0 ? "+" : ""}
      {differencePercent.toFixed(1)}%
      {")"}
    </p>
  </div>
)}

{/* 種目選択 */}
<div className="mb-4">
  <select
    value={selectedExercise}
    onChange={(e) => setSelectedExercise(e.target.value)}
    className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none"
  >
    {exerciseOptions.map((exercise) => (
      <option key={exercise} value={exercise}>
        {exercise}
      </option>
    ))}
  </select>
</div>

{/* グラフ項目切り替え */}
<div className="mb-4 flex gap-2">
  <button
    onClick={() => setGraphMetric("1rm")}
    className={`flex-1 rounded-xl p-2 ${
      graphMetric === "1rm"
        ? "bg-blue-600 text-white"
        : "bg-zinc-800 text-zinc-400"
    }`}
  >
    🏆 1RM
  </button>

  <button
    onClick={() => setGraphMetric("volume")}
    className={`flex-1 whitespace-nowrap rounded-xl p-2 ${
      graphMetric === "volume"
        ? "bg-blue-600 text-white"
        : "bg-zinc-800 text-zinc-400"
    }`}
  >
    🔥 総ボリューム
  </button>
</div>

    {/* 期間切り替え */}
    <div className="mb-6 flex gap-2">
      <button
        onClick={() => setGraphPeriod("week")}
        className={`flex-1 rounded-xl p-2 ${
          graphPeriod === "week"
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        1週間
      </button>

      <button
        onClick={() => setGraphPeriod("month")}
        className={`flex-1 rounded-xl p-2 ${
          graphPeriod === "month"
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        1ヶ月
      </button>

      <button
        onClick={() => setGraphPeriod("year")}
        className={`flex-1 rounded-xl p-2 ${
          graphPeriod === "year"
            ? "bg-blue-600 text-white"
            : "bg-zinc-800 text-zinc-400"
        }`}
      >
        1年
      </button>
    </div>

    {/* グラフ */}
   　<div className="h-56 w-full md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={graphData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={graphMetric === "1rm" ? "estimated1RM" : "totalVolume"}
            stroke="#3b82f6"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
</section>



      <section className="mt-10 w-full max-w-2xl px-4">
  <h2 className="mb-4 text-2xl font-bold">
    🏋️ 最近のトレーニング
  </h2>

  {loading ? (
    <p className="text-zinc-400">読み込み中...</p>
  ) : recentWorkouts.length === 0 ? (
    <p className="text-zinc-400">
      まだトレーニング記録がありません
    </p>
  ) : (
    <div className="space-y-3">
      {recentWorkouts.map((workout) => (
        <div
          key={workout.id}
          className="rounded-2xl bg-zinc-900 p-5"
        >
          <p className="text-lg font-bold">
            {workout.exercise_name ?? "トレーニング"}
          </p>

          <p className="mt-1 text-sm text-zinc-400">
            {new Date(workout.created_at).toLocaleDateString("ja-JP")}
          </p>

          <div className="mt-4 space-y-2">
  {workout.sets?.map((set: any, index: number) => (
    <p key={index} className="text-zinc-300">
      {index + 1}セット目：{set.weight}kg × {set.reps}回
    </p>
  ))}
</div>

<p className="mt-4 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
  総ボリューム：
  <span className="ml-2 font-bold text-white">
    {workout.sets
      ?.reduce(
        (total: number, set: any) =>
          total + Number(set.weight) * Number(set.reps),
        0
      )
      .toLocaleString()}
    kg
  </span>
</p>

<p className="mt-2 text-sm text-zinc-400">
  推定1RM：
  <span className="ml-2 font-bold text-white">
    {Math.max(
      ...(workout.sets?.map((set: any) =>
        calculateEstimated1RM(
          Number(set.weight),
          Number(set.reps)
        )
      ) ?? [0])
    ).toFixed(1)}
    kg
  </span>
</p>

        </div>
      ))}
    </div>
  )}
</section>

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