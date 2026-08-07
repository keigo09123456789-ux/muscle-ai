import Link from "next/link";

const exercises = [
  {
    name: "ベンチプレス",
    target: "胸・上腕三頭筋",
    href: "/workout/bench-press",
  },
  {
    name: "インクラインダンベルプレス",
    target: "胸上部・肩",
    href: "/workout/incline-dumbbell-press",
  },
  {
    name: "ケーブルフライ",
    target: "胸",
    href: "/workout/cable-fly",
  },
];

export default function WorkoutPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← ホームへ戻る
        </Link>

        <h1 className="mt-8 text-4xl font-bold">🔥 胸の日</h1>

        <p className="mt-3 text-zinc-400">
          今日行う種目を選んでください
        </p>

        <div className="mt-8 space-y-4">
          {exercises.map((exercise) => (
            <Link
              key={exercise.name}
              href={exercise.href}
              className="block rounded-2xl bg-zinc-900 p-5 transition hover:bg-zinc-800"
            >
              <h2 className="text-xl font-semibold">{exercise.name}</h2>

              <p className="mt-2 text-sm text-zinc-400">
                対象部位：{exercise.target}
              </p>

              <p className="mt-4 text-right text-blue-400">
                記録する →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}