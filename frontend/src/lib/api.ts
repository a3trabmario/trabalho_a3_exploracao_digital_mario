export type Status = "low" | "normal" | "high" | "unknown";

export interface ExamItem {
  name: string;
  value: string;
  unit: string;
  reference: string;
  status: Status;
  explanation: string;
}

export interface Analysis {
  summary: string;
  items: ExamItem[];
  questions_for_doctor?: string[];
}

export async function analyze(anonymizedText: string): Promise<Analysis> {
  const resp = await fetch("http://localhost:8000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: anonymizedText }),
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
}
