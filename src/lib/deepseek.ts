type DeepseekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepseekChatResponse = {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function deepseekChat(messages: DeepseekMessage[]) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY ausente");
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const timeoutMs = Number(process.env.DEEPSEEK_TIMEOUT_MS || 30000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    const latencyMs = Date.now() - startedAt;
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`DeepSeek HTTP ${res.status}: ${text.slice(0, 500)}`);
    }

    const data = (await res.json()) as DeepseekChatResponse;
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    return { content, latencyMs, model };
  } finally {
    clearTimeout(timer);
  }
}
