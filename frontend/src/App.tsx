import { useRef, useState } from "react";
import { analyze, Analysis, Status } from "./lib/api";
import { anonymize } from "./lib/anonymize";
import { extractText } from "./lib/extract";

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_MB = 10;
const STATUS_LABEL: Record<Status, string> = {
  low: "Abaixo da referência",
  normal: "Dentro da referência",
  high: "Acima da referência",
  unknown: "Sem classificação",
};
const STEPS = ["Upload", "Nome", "Resultado"];

export default function App() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [sentText, setSentText] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!ACCEPTED.includes(f.type))
      return setError("Formato não suportado. Envie PDF, JPG ou PNG.");
    if (f.size > MAX_MB * 1024 * 1024)
      return setError(`O arquivo deve ter até ${MAX_MB} MB.`);
    setError("");
    setFile(f);
  }

  async function run() {
    if (!file) return;
    setError("");
    try {
      setBusy("Lendo o arquivo neste dispositivo…");
      const raw = await extractText(file);
      if (raw.trim().length < 20)
        throw new Error(
          "Não conseguimos ler texto no arquivo. Tente uma imagem mais nítida.",
        );
      setBusy("Removendo dados pessoais…");
      const clean = anonymize(raw, name);
      setSentText(clean);
      setBusy("Gerando explicações…");
      setResult(await analyze(clean));
      setStep(3);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Algo deu errado. Tente novamente.",
      );
    } finally {
      setBusy("");
    }
  }

  function restart() {
    setStep(1);
    setFile(null);
    setName("");
    setResult(null);
    setSentText("");
    setError("");
  }

  return (
    <>
      <header className="hero">
        <h1>Entenda seu exame de sangue</h1>
        <p>
          Receba uma explicação em linguagem simples dos resultados do seu
          exame, em minutos.
        </p>
        <ul className="chips">
          <li>Análise instantânea</li>
          <li>Linguagem simples</li>
          <li>Dados anonimizados</li>
          <li>Nada é armazenado</li>
        </ul>
        <button
          className="btn primary"
          onClick={() =>
            cardRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Começar análise →
        </button>
      </header>

      <main>
        <section className="card" ref={cardRef} aria-labelledby="card-title">
          <h2 id="card-title" className="card-title">
            Análise de exame de sangue
          </h2>
          <div className="progress" aria-hidden="true">
            <div style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li
                key={s}
                className={step === i + 1 ? "active" : ""}
                aria-current={step === i + 1 ? "step" : undefined}
              >
                <span>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>

          <div className="privacy" role="note">
            <strong>Sua privacidade:</strong> o arquivo é lido no seu navegador
            e seu nome, CPF, contatos, datas e endereço são removidos antes do
            envio. Apenas o texto anonimizado é enviado ao Gemini (Google) para
            gerar a explicação. Nenhum dado é salvo em banco de dados ou disco;
            tudo existe só durante a execução.
          </div>

          {step === 1 && (
            <div className="panel">
              <h3>Envie o laudo do seu exame</h3>
              <p className="muted">Envie o laudo em PDF ou imagem.</p>
              <div
                className={`drop${dragging ? " drag" : ""}`}
                role="button"
                tabIndex={0}
                aria-label="Arraste o arquivo ou clique para escolher"
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  (e.preventDefault(), inputRef.current?.click())
                }
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pick(e.dataTransfer.files[0]);
                }}
              >
                <div className="icon" aria-hidden="true">
                  ⬆
                </div>
                <strong>
                  {file
                    ? file.name
                    : "Arraste o arquivo aqui ou clique para escolher"}
                </strong>
                <span className="muted">
                  Formatos: PDF, JPG, PNG (até {MAX_MB} MB)
                </span>
                <div className="tags" aria-hidden="true">
                  <span>PDF</span>
                  <span>JPG</span>
                  <span>PNG</span>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => pick(e.target.files?.[0])}
                />
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="btn primary block"
                disabled={!file}
                onClick={() => setStep(2)}
              >
                Próximo →
              </button>
            </div>
          )}

          {step === 2 && (
            <form
              className="panel"
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy) void run();
              }}
            >
              <h3>Qual é o seu nome?</h3>
              <p className="muted">
                Usamos o nome apenas neste dispositivo, para localizá-lo e
                removê-lo do laudo. Ele nunca é enviado.
              </p>
              <label htmlFor="name">Nome completo</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                required
                minLength={3}
              />
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              {busy && (
                <p className="status" role="status">
                  {busy}
                </p>
              )}
              <div className="row">
                <button
                  type="button"
                  className="btn ghost"
                  disabled={!!busy}
                  onClick={() => setStep(1)}
                >
                  Voltar
                </button>
                <button
                  className="btn primary"
                  disabled={!!busy || name.trim().length < 3}
                >
                  Analisar →
                </button>
              </div>
            </form>
          )}

          {step === 3 && result && (
            <div className="panel">
              <h3>Resultado{name.trim() ? ` de ${name.trim()}` : ""}</h3>
              <p>{result.summary}</p>
              <div className="items">
                {result.items.map((it, i) => (
                  <article key={i} className={`item ${it.status}`}>
                    <div className="item-head">
                      <strong>{it.name}</strong>
                      <span className="badge">
                        {STATUS_LABEL[it.status] ?? STATUS_LABEL.unknown}
                      </span>
                    </div>
                    <p className="value">
                      {it.value} {it.unit}{" "}
                      <span className="muted">
                        · Referência: {it.reference || "não informada"}
                      </span>
                    </p>
                    <p>{it.explanation}</p>
                  </article>
                ))}
              </div>
              {!!result.questions_for_doctor?.length && (
                <>
                  <h4>Perguntas para levar ao seu médico</h4>
                  <ul>
                    {result.questions_for_doctor.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </>
              )}
              <details>
                <summary>Ver o texto anonimizado que foi enviado</summary>
                <pre>{sentText}</pre>
              </details>
              <p className="disclaimer">
                Esta explicação é educativa. Não é diagnóstico nem prescrição e
                não substitui um profissional de saúde.
              </p>
              <button className="btn primary block" onClick={restart}>
                Analisar outro exame
              </button>
            </div>
          )}
        </section>
      </main>
      <footer>
        Anonimização no navegador · Sem armazenamento de dados · Demonstração
        gratuita
      </footer>
    </>
  );
}
