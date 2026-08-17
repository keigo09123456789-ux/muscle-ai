"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { exercises } from "../data/exercises";
import { supabase } from "@/lib/supabase";

export default function WorkoutPage() {
  const router = useRouter();

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