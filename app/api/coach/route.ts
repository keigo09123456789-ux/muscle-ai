import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      exerciseName,
      workouts,
    } = body;

    if (!exerciseName) {
      return Response.json(
        { error: "種目名がありません" },
        { status: 400 }
      );
    }

    if (!Array.isArray(workouts) || workouts.length === 0) {
      return Response.json(
        {
          advice:
            "まだ十分なトレーニング履歴がありません。まずは記録を増やしてみましょう！",
        }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",

      input: `
あなたは筋力トレーニング記録アプリ「MuscleAI」のAIコーチです。

ユーザーの過去のトレーニング履歴を分析して、
次回のトレーニングについて日本語でアドバイスしてください。

種目:
${exerciseName}

トレーニング履歴:
${JSON.stringify(workouts, null, 2)}

次の内容を簡潔に回答してください。

1. 最近の成長傾向
2. 次回おすすめ重量
3. 次回おすすめ回数
4. 注意点
5. 一言コメント

無理な重量アップは勧めず、
安全性を優先してください。
`,
    });

    return Response.json({
      advice: response.output_text,
    });
  } catch (error) {
    console.error("AI coach error:", error);

    return Response.json(
      {
        error: "AIコーチの分析に失敗しました",
      },
      {
        status: 500,
      }
    );
  }
}