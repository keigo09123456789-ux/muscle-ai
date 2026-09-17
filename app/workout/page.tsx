"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { exercises } from "../data/exercises";
import { supabase } from "@/lib/supabase";

export default function WorkoutPage() {
  const router = useRouter();
 
  const [weeklyWorkoutCount, setWeeklyWorkoutCount] = useState(0);
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [latestWorkout, setLatestWorkout] = useState<any>(null);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
  router.replace("/login");
  return;
}

const startOfWeek = new Date();
const day = startOfWeek.getDay();

const diff =
  startOfWeek.getDate() - day + (day === 0 ? -6 : 1);

startOfWeek.setDate(diff);
startOfWeek.setHours(0, 0, 0, 0);

const { data, error } = await supabase
  .from("workouts")
  .select("id, volume")
  .eq("user_id", user.id)
  .gte("created_at", startOfWeek.toISOString());
 
 
  console.log("今週のデータ:", data, "エラー:", error);


if (!error && data) {
  setWeeklyWorkoutCount(data.length);

  const totalVolume = data.reduce(
    (total, workout) => total + Number(workout.volume || 0),
    0
  );

  setWeeklyVolume(totalVolume);

  const { data: latestData, error: latestError } = await supabase
  .from("workouts")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (!latestError && latestData) {
  setLatestWorkout(latestData);
}
}
    }

    checkUser();
  }, [router]);

  const bodyParts = ["胸", "背中", "脚", "肩", "腕"];


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
          💪 トレーニング
        </h1>

        <p className="mt-3 text-zinc-400">
          記録する種目を選んでください
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
    <p className="text-sm text-zinc-400">
      今週のトレーニング
    </p>

    <p className="mt-2 text-3xl font-bold">
      🔥 {weeklyWorkoutCount}回
    </p>
  </div>

  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
    <p className="text-sm text-zinc-400">
      今週の総ボリューム
    </p>

    <p className="mt-2 text-3xl font-bold">
      🏋️ {weeklyVolume.toLocaleString()}kg
    </p>
  </div>
</div>

{latestWorkout && (
  <div className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
    <div>
      <p className="text-sm text-zinc-400">
        最近のトレーニング
      </p>

      <p className="mt-2 text-xl font-bold">
        🏋️ {latestWorkout.exercise_name}
      </p>

      <p className="mt-2 text-zinc-300">
        総ボリューム：
        {Number(latestWorkout.volume).toLocaleString()}kg
      </p>
    </div>

   <div className="text-right">
  <p className="text-2xl font-bold">
    {latestWorkout.sets?.[0]?.weight || 0}kg
    <span className="mx-2 text-zinc-500">×</span>
    {latestWorkout.sets?.[0]?.reps || 0}回
  </p>

  <p className="mt-1 text-sm text-zinc-400">
    {latestWorkout.sets?.length || 0}セット
  </p>
</div>
</div>
)}

        <div className="mt-10 space-y-10">
          {bodyParts.map((bodyPart) => {
            const bodyPartExercises = exercises.filter(
              (exercise) => exercise.bodyPart === bodyPart
            );

            return (
              <section key={bodyPart}>
                <h2 className="mb-4 text-xl font-bold">
                  {bodyPart}
                </h2>

                <div className="grid gap-3">
                  {bodyPartExercises.map((exercise) => (
                    <Link
                      key={exercise.id}
                      href={`/workout/${exercise.id}`}
                      className="flex items-center justify-between rounded-2xl bg-zinc-900 p-5 transition hover:bg-zinc-800"
                    >
                      <span className="font-semibold">
                        {exercise.name}
                      </span>

                      <span className="text-zinc-500">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <Link
          href="/history"
          className="mt-10 block rounded-xl bg-zinc-800 py-3 text-center font-bold transition hover:bg-zinc-700"
        >
          📊 トレーニング履歴を見る
        </Link>
      </div>
    </main>
  );
}