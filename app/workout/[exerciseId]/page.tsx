"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function ExercisePage() {
  const params = useParams();
  const router = useRouter();

  const exerciseId = params.exerciseId as string;

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
  const [sets, setSets] = useState<WorkoutSet[]>([]);
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
    return history.filter(
      (workout) => workout.exerciseId === exerciseId
    );
  }, [history, exerciseId]);

  const latestWorkout = exerciseHistory[0];

  const recommendation = useMemo(() => {
    if (!latestWorkout) {
      return {
        weight: null,
        reps: null,
        message: "まずは最初の記録を作ってみましょう！",
      };
    }

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
        message:
          "前回10回以上できています。重量アップに挑戦しましょう🔥",
      };
    }

    if (bestSet.reps >= 8) {
      return {
        weight: bestSet.weight,
        reps: "10",
        message:
          "前回の重量を維持して、10回達成を狙いましょう💪",
      };
    }

    return {
      weight: Math.max(bestSet.weight - 2.5, 0),
      reps: "8〜10",
      message:
        "少し重量を下げて、フォームと回数を安定させましょう。",
    };
  }, [latestWorkout]);

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
                {recommendation.reps}回
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
        </section>

        <div className="mt-8 rounded-2xl bg-zinc-900 p-6">
          <label className="block text-sm text-zinc-300">
            重量
          </label>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="0.5"
              value={weight}
              onChange={(event) =>
                setWeight(event.target.value)
              }
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
              type="number"
              min="1"
              value={reps}
              onChange={(event) =>
                setReps(event.target.value)
              }
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