"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { exercises } from "../../data/exercises";
import { supabase } from "@/lib/supabase";

type WorkoutSet = {
  id: number;
  weight: number;
  reps: number;
};

type WorkoutHistory = {
  id: number;
  date: string;
  exercise: string;
  exerciseId: string;
  sets: WorkoutSet[];
  volume: number;
};

const HISTORY_KEY = "muscle-ai-workout-history";

function calculateEstimated1RM(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  return weight * (1 + reps / 30);
}

export default function ExercisePage() {
 const params = useParams();
const router = useRouter();
const searchParams = useSearchParams();

const exerciseId = params.exerciseId as string;

const recommendedWeight = searchParams.get("weight");
const recommendedReps = searchParams.get("reps");
const recommendedSets = searchParams.get("sets");

  useEffect(() => {
  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
    }
  }

  checkUser();
}, [router]);

  const exercise = exercises.find(
    (item) => item.id === exerciseId
  );

  const currentSetsKey =
    `muscle-ai-${exerciseId}-current-sets`;

  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  
  useEffect(() => {
  if (recommendedWeight) {
    setWeight(recommendedWeight);
  }

  if (recommendedReps) {
    setReps(recommendedReps);
  }
}, [recommendedWeight, recommendedReps]);
  
const [sets, setSets] = useState<WorkoutSet[]>([]);
const [aiAdvice, setAiAdvice] = useState("");
const [aiLoading, setAiLoading] = useState(false);


const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedSets = localStorage.getItem(currentSetsKey);
    const savedHistory = localStorage.getItem(HISTORY_KEY);

    if (savedSets) {
      setSets(JSON.parse(savedSets));
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }

    setLoaded(true);
  }, [currentSetsKey]);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    localStorage.setItem(
      currentSetsKey,
      JSON.stringify(sets)
    );
  }, [sets, loaded, currentSetsKey]);

 const exerciseHistory = useMemo(() => {
  return history
    .filter(
      (workout) => workout.exerciseId === exerciseId
    )
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );
}, [history, exerciseId]);

  const latestWorkout = exerciseHistory[0];

  const latestEstimated1RM = useMemo(() => {
  if (!latestWorkout || latestWorkout.sets.length === 0) {
    return null;
  }

  const estimated1RMs = latestWorkout.sets.map((set) =>
    calculateEstimated1RM(set.weight, set.reps)
  );

  return Math.max(...estimated1RMs);
}, [latestWorkout]);

const bestEstimated1RM = useMemo(() => {
  const previousWorkouts = exerciseHistory.slice(1);

  if (previousWorkouts.length === 0) {
    return null;
  }

  const allEstimated1RMs = previousWorkouts.flatMap((workout) =>
    workout.sets.map((set) =>
      calculateEstimated1RM(set.weight, set.reps)
    )
  );

  if (allEstimated1RMs.length === 0) {
    return null;
  }

  return Math.max(...allEstimated1RMs);
}, [exerciseHistory]);
 
  const recentFiveWorkouts = exerciseHistory.slice(0, 5);
  const recentFiveVolumes = recentFiveWorkouts.map(
  (workout) => workout.volume
);

const recentFiveEstimated1RMs = recentFiveWorkouts.map(
  (workout) => {
    const estimated1RMs = workout.sets.map((set) =>
      calculateEstimated1RM(set.weight, set.reps)
    );

    if (estimated1RMs.length === 0) {
      return 0;
    }

    return Math.max(...estimated1RMs);
  }
);

const trainingTrend = useMemo(() => {
  if (
    recentFiveVolumes.length < 2 ||
    recentFiveEstimated1RMs.length < 2
  ) {
    return "データ不足";
  }

  const latestVolume = recentFiveVolumes[0];
  const oldestVolume =
    recentFiveVolumes[recentFiveVolumes.length - 1];

  const latest1RM = recentFiveEstimated1RMs[0];
  const oldest1RM =
    recentFiveEstimated1RMs[
      recentFiveEstimated1RMs.length - 1
    ];

  const volumeGrowth =
    oldestVolume > 0
      ? (latestVolume - oldestVolume) / oldestVolume
      : 0;

  const strengthGrowth =
    oldest1RM > 0
      ? (latest1RM - oldest1RM) / oldest1RM
      : 0;

  if (strengthGrowth > 0.02 || volumeGrowth > 0.05) {
    return "成長中";
  }

  if (strengthGrowth < -0.02 && volumeGrowth < -0.05) {
    return "低下";
  }

  return "停滞";
}, [recentFiveVolumes, recentFiveEstimated1RMs]);


const volumeChangePercent = useMemo(() => {
  if (recentFiveVolumes.length < 2) {
    return null;
  }

  const latest = recentFiveVolumes[0];
  const oldest =
    recentFiveVolumes[recentFiveVolumes.length - 1];

  if (oldest === 0) {
    return null;
  }

  return ((latest - oldest) / oldest) * 100;
}, [recentFiveVolumes]);

const estimated1RMChangePercent = useMemo(() => {
  if (recentFiveEstimated1RMs.length < 2) {
    return null;
  }

  const latest = recentFiveEstimated1RMs[0];
  const oldest =
    recentFiveEstimated1RMs[
      recentFiveEstimated1RMs.length - 1
    ];

  if (oldest === 0) {
    return null;
  }

  return ((latest - oldest) / oldest) * 100;
}, [recentFiveEstimated1RMs]);

  const recommendation = useMemo(() => {
    if (!latestWorkout) {
      return {
        weight: null,
        reps: null,
        sets: null,
        message: "まずは最初の記録を作ってみましょう！",
      };
    }
    
    const recentSetCounts = exerciseHistory
  .slice(0, 5)
  .map((workout) => workout.sets.length);

const averageSets =
  recentSetCounts.reduce((sum, count) => sum + count, 0) /
  recentSetCounts.length;

const recommendedSets =
  recentSetCounts.length > 0
    ? Math.max(1, Math.round(averageSets))
    : 1;

    const bestSet = latestWorkout.sets.reduce((best, set) => {
      if (set.weight > best.weight) {
        return set;
      }

      if (
        set.weight === best.weight &&
        set.reps > best.reps
      ) {
        return set;
      }

      return best;
    });

    if (bestSet.reps >= 10) {
      return {
        weight: bestSet.weight + 2.5,
        reps: "8〜10",
        sets: recommendedSets,
        message:
          "前回10回以上できています。重量アップに挑戦しましょう🔥",
      };
    }

    if (bestSet.reps >= 8) {
      return {
        weight: bestSet.weight,
        reps: "10",
        sets: recommendedSets,
        message:
          "前回の重量を維持して、10回達成を狙いましょう💪",
      };
    }

    return {
      weight: Math.max(bestSet.weight - 2.5, 0),
      reps: "8〜10",
     sets: recommendedSets,
      message:
        "少し重量を下げて、フォームと回数を安定させましょう。",
    };
  }, [latestWorkout]);

  function addSet() {
  const weightNumber = Number(weight);
  const repsNumber = Number(reps);

  // 重量は0より大きい有限の数値、
  // 回数は1以上の整数だけ許可する
  if (
    !Number.isFinite(weightNumber) ||
    weightNumber <= 0 ||
    !Number.isInteger(repsNumber) ||
    repsNumber <= 0
  ) {
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

 async function askAiCoach() {

  if (!exercise) return;

  setAiLoading(true);
  setAiAdvice("");

  try {
    // 過去履歴がない場合
    if (!exerciseHistory || exerciseHistory.length === 0) {
      setAiAdvice(
        "まだトレーニング履歴がありません。まずは1回トレーニングを記録しましょう💪"
      );
      return;
    }

    // 最新のトレーニング
    const latestWorkout = exerciseHistory[0];
    const latestSets = latestWorkout.sets ?? [];

    if (latestSets.length === 0) {
      setAiAdvice("セット記録がありません。");
      return;
    }

    // 最新トレーニングの中で最も重いセット
    const bestSet = latestSets.reduce((best: any, current: any) => {
      return Number(current.weight) > Number(best.weight)
        ? current
        : best;
    });

    const weight = Number(bestSet.weight);
    const reps = Number(bestSet.reps);

    let nextWeight = weight;
    let minReps = 8;
    let maxReps = 10;
    let nextSets = latestSets.length;

    let comment = "";

    // 10回以上できた → 2.5kgアップ
    if (reps >= 10) {
      nextWeight = weight + 2.5;
      minReps = 8;
      maxReps = 10;

      comment =
        `前回${reps}回できています。` +
        "重量アップに挑戦しましょう🔥";
    }

    // 8〜9回 → 同じ重量で回数を伸ばす
    else if (reps >= 8) {
      nextWeight = weight;
      minReps = reps + 1;
      maxReps = 10;

      comment =
        `前回${reps}回でした。` +
        "同じ重量で回数アップを狙いましょう💪";
    }

    // 7回以下 → 同じ重量で8回を目標
    else {
      nextWeight = weight;
      minReps = reps;
      maxReps = 8;

      comment =
        "まずはこの重量を安定させて8回を目指しましょう💪";
    }

    // 推奨セット数は2〜3セット
    nextSets = Math.min(Math.max(nextSets, 2), 3);

    // Epley式で推定1RM
    const estimated1RM = weight * (1 + reps / 30);

    // 過去最高の推定1RMを計算
    let previousBest1RM = 0;

    exerciseHistory.slice(1).forEach((workout: any) => {
      (workout.sets ?? []).forEach((set: any) => {
        const w = Number(set.weight);
        const r = Number(set.reps);

        if (!w || !r) return;

        const oneRM = w * (1 + r / 30);

        if (oneRM > previousBest1RM) {
          previousBest1RM = oneRM;
        }
      });
    });

    let growthMessage = "";

    if (previousBest1RM > 0) {
      const difference = estimated1RM - previousBest1RM;

      if (difference > 0) {
        growthMessage =
          `📈 推定1RMが過去記録より` +
          `${difference.toFixed(1)}kg伸びています！`;
      } else if (difference < -2) {
        growthMessage =
          "📊 前回より少し低めです。疲労を考慮して無理せず進めましょう。";
      } else {
        growthMessage = "➡️ 筋力は安定しています。";
      }
    }

    const advice = `
🤖 ${exercise.name} AIコーチ

${comment}

${growthMessage}

推定1RM：${estimated1RM.toFixed(1)}kg

次回おすすめ
${nextWeight.toFixed(1)}kg × ${minReps}〜${maxReps}回 × ${nextSets}セット
    `.trim();

    setAiAdvice(advice);
  } catch (error) {
    console.error(error);
    setAiAdvice("AIコーチの分析中にエラーが発生しました。");
  } finally {
    setAiLoading(false);
  }
}

  async function completeWorkout() {
  if (!exercise) {
    return;
  }

  if (sets.length === 0) {
    alert("セットを1つ以上登録してください");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    alert("ログインしてください");
    return;
  }

  const volume = sets.reduce(
    (total, set) => total + set.weight * set.reps,
    0
  );

  const { error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: sets,
      volume: volume,
    });

  if (error) {
    console.error(error);
    alert(`保存に失敗しました: ${error.message}`);
    return;
  }

  const newHistory: WorkoutHistory = {
    id: Date.now(),
    date: new Date().toLocaleDateString("ja-JP"),
    exercise: exercise.name,
    exerciseId: exercise.id,
    sets,
    volume,
  };

  const updatedHistory = [newHistory, ...history];

  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(updatedHistory)
  );

  setHistory(updatedHistory);
  setSets([]);
  localStorage.removeItem(currentSetsKey);

  alert("クラウドにトレーニング記録を保存しました！");
　}

  if (!exercise) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-md">
          <h1 className="text-3xl font-bold">
            種目が見つかりません
          </h1>

          <Link
            href="/workout"
            className="mt-6 block text-blue-400"
          >
            ← 種目一覧へ戻る
          </Link>
        </div>
      </main>
    );
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

        <p className="mt-8 text-sm text-zinc-500">
          {exercise.bodyPart}
        </p>

        <h1 className="mt-1 text-4xl font-bold">
          {exercise.name}
        </h1>

        <section className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
          <p className="text-sm font-semibold text-blue-300">
            🤖 AIコーチ
          </p>

          {recommendation.weight ? (
            <>
              <p className="mt-4 text-sm text-zinc-400">
                次回おすすめ
              </p>

            <p className="mt-1 text-3xl font-bold">
              {recommendation.weight}kg ×{" "}
              {recommendation.reps}回 ×{" "}
              {recommendation.sets}セット
            </p>

            </>
          ) : (
            <p className="mt-4 text-xl font-bold">
              初回トレーニング
            </p>
          )}

          <p className="mt-4 text-sm leading-6 text-zinc-300">
            {recommendation.message}
          </p>

          {latestEstimated1RM !== null && (
  <div className="mt-4 rounded-xl bg-zinc-800 p-4">
    <p className="text-sm text-zinc-400">
      推定1RM
    </p>

    <p className="mt-1 text-2xl font-bold">
      {latestEstimated1RM.toFixed(1)}kg
    </p>

    {bestEstimated1RM !== null &&
  latestEstimated1RM > bestEstimated1RM && (
    <>
      <p className="mt-2 text-sm text-zinc-400">
        過去最高：{bestEstimated1RM.toFixed(1)}kg
      </p>

      <p className="mt-1 text-sm font-bold">
        🏆 NEW PR！ +
        {(latestEstimated1RM - bestEstimated1RM).toFixed(1)}kg
      </p>
    </>
  )}

  </div>
)}

          <div className="mt-4 rounded-xl bg-zinc-800 p-4">
  <p className="text-sm text-zinc-400">
    最近5回のトレーニング傾向
  </p>

  <p className="mt-1 text-xl font-bold">
  {trainingTrend === "成長中" && "📈 成長中"}
  {trainingTrend === "停滞" && "➡️ 停滞"}
  {trainingTrend === "低下" && "📉 低下"}
  {trainingTrend === "データ不足" && "📊 データ不足"}
</p>

  {volumeChangePercent !== null && (
  <p className="mt-1 text-sm text-zinc-400">
    総ボリューム変化：
    {volumeChangePercent > 0 ? "+" : ""}
    {volumeChangePercent.toFixed(1)}%
  </p>
)}

{estimated1RMChangePercent !== null && (
  <p className="mt-1 text-sm text-zinc-400">
    推定1RM変化：
    {estimated1RMChangePercent > 0 ? "+" : ""}
    {estimated1RMChangePercent.toFixed(1)}%
  </p>
)}


  </div>

        </section>
    

<button
  type="button"
  onClick={askAiCoach}
  disabled={aiLoading}
  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-4 font-bold text-white disabled:opacity-50"
>
  {aiLoading ? "AI分析中..." : "🤖 AIコーチに次回メニューを聞く"}
</button>

{aiAdvice && (
  <div className="mt-4 whitespace-pre-wrap rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm leading-7 text-zinc-200">
    {aiAdvice}
  </div>
)}

        <div className="mt-8 rounded-2xl bg-zinc-900 p-6">
          <label className="block text-sm text-zinc-300">
            重量
          </label>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min="0"
              autoFocus
              value={weight}
             onChange={(event) => {
  const value = event.target.value.replace(/[０-９．]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );

  setWeight(value);
}}
              
              placeholder="例：80"
              className="w-full rounded-xl bg-zinc-800 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <span className="text-zinc-400">kg</span>
          </div>

          <label className="mt-6 block text-sm text-zinc-300">
            回数
          </label>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="text"
inputMode="numeric"
              min="1"
              value={reps}
             onChange={(event) => {
  const value = event.target.value.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );

  setReps(value);
}}
           
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
          <h2 className="text-2xl font-semibold">
            今日の記録
          </h2>

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
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold"
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
          📊 履歴を見る
        </Link>
      </div>
    </main>
  );
}