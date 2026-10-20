export type Status = "low" | "normal" | "high" | "unknown";

export interface ExamItem {
  name: string;
  value: string;
  unit: string;
  reference: string;
  status: Status;
  comparison?: string;
  explanation: string;
}

export interface Analysis {
  summary: string;
  items: ExamItem[];
  questions_for_doctor?: string[];
}

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export async function analyze(anonymizedText: string): Promise<Analysis> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 65_000);
  try {
    const resp = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: anonymizedText }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const body = await resp.json().catch(() => null);
      throw new Error(
        typeof body?.detail === "string"
          ? body.detail
          : "Não foi possível analisar o exame agora.",
      );
    }
    return resp.json();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "A análise demorou mais que o esperado. Tente novamente em instantes.",
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
