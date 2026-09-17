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

次のトレーニング履歴を分析してください。

以下を必ず考慮してください。
- 過去の重量
- 各セットの回数
- セット数
- 総ボリューム
- 重量の伸び
- 推定1RM
- 直近のトレーニング内容

次回のトレーニングを具体的に提案してください。

必ず以下の形式で日本語で回答してください。

1. 最近の成長傾向
重量・回数・総ボリュームの変化を簡潔に分析

2. 次回おすすめ重量
○○kg

3. 次回おすすめ回数
○〜○回

4. 次回おすすめセット数
○セット

5. 次回メニュー
○○kg × ○回 × ○セット

6. 判断理由
なぜこの重量・回数・セット数にしたのか説明

7. 注意点
フォームや疲労を考慮した注意点

8. 一言コメント
短くコメント

急激な重量アップは勧めず、
過去の記録から現実的な範囲で提案してください。
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