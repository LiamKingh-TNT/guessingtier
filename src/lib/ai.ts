const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_MODEL = "groq/compound-mini";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

interface GroqResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

export async function generateItemDescription(name: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("尚未設定 Groq API 金鑰");
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "user",
          content: `請先搜尋「${name}」的相關資料，再用繁體中文、以嚴謹正式的語氣寫一段不超過40字的簡介，只回覆該段文字本身，不要加上引言、引號、來源說明或其他任何文字，如果對「${name}」缺乏足夠資訊，請回覆「尚無相關資訊」。`,
        },
      ],
      max_tokens: 60,
    }),
  });

  if (!response.ok) {
    throw new Error("AI 服務請求失敗");
  }

  const data = (await response.json()) as GroqResponse;
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("AI 未回傳描述內容");
  }

  return text;
}
