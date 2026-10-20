import { useEffect, useRef, useState } from "react";
import type { MouseEvent, RefObject } from "react";
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
const STEPS = ["Arquivo", "Proteção", "Explicação"];
const ITEMS_PER_PAGE = 4;

type Page = "home" | "analysis";

function pageFromPath(): Page {
  return window.location.pathname === "/analisar" ? "analysis" : "home";
}

export default function App() {
  const [page, setPage] = useState<Page>(pageFromPath);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Analysis | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousStepRef = useRef(step);

  useEffect(() => {
    const handlePopState = () => setPage(pageFromPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (previousStepRef.current !== step) {
      panelHeadingRef.current?.focus();
      previousStepRef.current = step;
    }
  }, [step]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, nextPage: Page) {
    event.preventDefault();
    const path = nextPage === "analysis" ? "/analisar" : "/";
    window.history.pushState({}, "", path);
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function pick(nextFile: File | undefined) {
    if (!nextFile) return;
    if (!ACCEPTED.includes(nextFile.type)) {
      setError("Formato não suportado. Envie PDF, JPG ou PNG.");
      return;
    }
    if (nextFile.size > MAX_MB * 1024 * 1024) {
      setError(`O arquivo deve ter até ${MAX_MB} MB.`);
      return;
    }
    setError("");
    setFile(nextFile);
  }

  function clearFile() {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function run() {
    if (!file) return;
    setError("");
    let slowMessageTimer: number | undefined;
    try {
      setBusy("Lendo o arquivo neste dispositivo…");
      const raw = await extractText(file);
      if (raw.trim().length < 20) {
        throw new Error(
          "Não conseguimos ler o texto. Tente um PDF ou uma foto mais nítida.",
        );
      }
      setBusy("Removendo dados pessoais…");
      const clean = anonymize(raw, name);
      setBusy("Preparando uma explicação simples…");
      slowMessageTimer = window.setTimeout(
        () =>
          setBusy(
            "A análise está levando um pouco mais de tempo. Continuamos tentando com segurança…",
          ),
        12_000,
      );
      setResult(await analyze(clean));
      setStep(3);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Algo deu errado. Tente novamente.",
      );
    } finally {
      if (slowMessageTimer) window.clearTimeout(slowMessageTimer);
      setBusy("");
    }
  }

  function restart() {
    setStep(1);
    setFile(null);
    setName("");
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Ir para o conteúdo principal
      </a>

      <div className="topbar">
        <a
          className="brand"
          href="/"
          aria-label="LêExame — página inicial"
          onClick={(event) => navigate(event, "home")}
        >
          <span aria-hidden="true">Lê</span>Exame
        </a>
        {page === "home" ? (
          <nav className="topnav" aria-label="Navegação principal">
            <a href="#como-funciona">Como funciona</a>
            <a
              className="nav-cta"
              href="/analisar"
              onClick={(event) => navigate(event, "analysis")}
            >
              Analisar exame
            </a>
          </nav>
        ) : (
          <a
            className="back-link"
            href="/"
            onClick={(event) => navigate(event, "home")}
          >
            ← Voltar para o início
          </a>
        )}
      </div>

      {page === "home" ? (
        <LandingPage onNavigate={navigate} />
      ) : (
        <AnalysisPage
          step={step}
          file={file}
          name={name}
          busy={busy}
          error={error}
          result={result}
          dragging={dragging}
          inputRef={inputRef}
          panelHeadingRef={panelHeadingRef}
          onPick={pick}
          onClearFile={clearFile}
          onSetName={setName}
          onSetStep={setStep}
          onSetDragging={setDragging}
          onRun={run}
          onRestart={restart}
        />
      )}

      <footer>
        <strong>LêExame</strong>
        <span>Explicação educativa com auxílio de inteligência artificial.</span>
        <span>Anonimização no navegador · Sem armazenamento de dados</span>
      </footer>
    </>
  );
}

function LandingPage({
  onNavigate,
}: {
  onNavigate: (event: MouseEvent<HTMLAnchorElement>, page: Page) => void;
}) {
  return (
    <main id="main-content" tabIndex={-1}>
      <header className="hero">
        <p className="eyebrow">Informação clara antes da sua consulta</p>
        <h1>Seu exame, explicado de um jeito mais simples</h1>
        <p>
          Entenda termos, siglas e valores do laudo com uma explicação
          educativa, acolhedora e fácil de acompanhar.
        </p>
        <ul className="chips">
          <li>✓ Linguagem simples</li>
          <li>✓ Dados anonimizados</li>
          <li>✓ Sem armazenamento</li>
        </ul>
        <a
          className="btn primary hero-action"
          href="/analisar"
          onClick={(event) => onNavigate(event, "analysis")}
        >
          Começar a entender meu exame
        </a>
        <p className="hero-note">Envio gratuito para esta demonstração.</p>
      </header>

      <section className="how" id="como-funciona" aria-labelledby="how-title">
        <p className="section-kicker">Como funciona</p>
        <h2 id="how-title">Três passos, com seus dados protegidos</h2>
        <div className="how-grid">
          <article>
            <span aria-hidden="true">1</span>
            <h3>Envie o laudo</h3>
            <p>Escolha um PDF ou uma foto legível do exame.</p>
          </article>
          <article>
            <span aria-hidden="true">2</span>
            <h3>Nós protegemos</h3>
            <p>O navegador remove dados pessoais antes do envio.</p>
          </article>
          <article>
            <span aria-hidden="true">3</span>
            <h3>Leia com calma</h3>
            <p>Veja um resumo, perguntas e cada resultado explicado.</p>
          </article>
        </div>
      </section>

      <section className="landing-safety" aria-labelledby="safety-title">
        <div>
          <p className="section-kicker">Apoio, não diagnóstico</p>
          <h2 id="safety-title">Mais clareza para conversar com seu médico</h2>
        </div>
        <p>
          O LêExame explica as informações presentes no laudo, sem indicar
          tratamentos ou substituir a avaliação de um profissional de saúde.
        </p>
      </section>
    </main>
  );
}

interface AnalysisPageProps {
  step: number;
  file: File | null;
  name: string;
  busy: string;
  error: string;
  result: Analysis | null;
  dragging: boolean;
  inputRef: RefObject<HTMLInputElement>;
  panelHeadingRef: RefObject<HTMLHeadingElement>;
  onPick: (file: File | undefined) => void;
  onClearFile: () => void;
  onSetName: (name: string) => void;
  onSetStep: (step: number) => void;
  onSetDragging: (dragging: boolean) => void;
  onRun: () => Promise<void>;
  onRestart: () => void;
}

function AnalysisPage({
  step,
  file,
  name,
  busy,
  error,
  result,
  dragging,
  inputRef,
  panelHeadingRef,
  onPick,
  onClearFile,
  onSetName,
  onSetStep,
  onSetDragging,
  onRun,
  onRestart,
}: AnalysisPageProps) {
  const [itemQuery, setItemQuery] = useState("");
  const [itemPage, setItemPage] = useState(1);
  const normalizedQuery = itemQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredItems =
    result?.items.filter((item) => {
      const searchableText = [
        item.name,
        item.value,
        item.unit,
        item.reference,
        item.comparison,
        STATUS_LABEL[item.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");
      return searchableText.includes(normalizedQuery);
    }) ?? [];
  const totalItemPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE),
  );
  const visibleItems = filteredItems.slice(
    (itemPage - 1) * ITEMS_PER_PAGE,
    itemPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setItemQuery("");
    setItemPage(1);
  }, [result]);

  return (
    <main id="main-content" className="analysis-page" tabIndex={-1}>
      <header className="analysis-intro">
        <p className="section-kicker">Análise educativa</p>
        <h1>Envie seu exame com segurança</h1>
        <p>O arquivo é processado no navegador e não fica armazenado.</p>
      </header>

      <section
        className={`card analysis-card${step === 3 ? " results-card" : ""}`}
        aria-labelledby="card-title"
      >
        <h2 id="card-title" className="card-title">
          {step === 3 ? "Explicação do seu exame" : "Preparar exame para análise"}
        </h2>
        <div
          className="progress"
          role="progressbar"
          aria-label={`Etapa ${step} de ${STEPS.length}: ${STEPS[step - 1]}`}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step}
        >
          <div style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
        <nav aria-label="Etapas da análise">
          <ol className="steps">
            {STEPS.map((label, index) => (
              <li
                key={label}
                className={step === index + 1 ? "active" : ""}
                aria-current={step === index + 1 ? "step" : undefined}
              >
                <span aria-hidden="true">{index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </nav>

        {step !== 3 && (
          <>
            <div className="privacy" role="note">
              <span className="notice-icon" aria-hidden="true">
                ✓
              </span>
              <div>
                <strong>Seus dados ficam protegidos</strong>
                <p>
                  O arquivo é lido neste dispositivo. Dados pessoais são
                  removidos antes do envio e nada é armazenado.
                </p>
                <details>
                  <summary>Entenda como tratamos seus dados</summary>
                  <p>
                    Apenas o texto anonimizado segue para o backend, que
                    reaplica a proteção e consulta o Gemini. A chave de acesso
                    permanece no servidor.
                  </p>
                </details>
              </div>
            </div>

            <div className="medical-notice" role="note">
              <strong>Esta ferramenta é educativa.</strong> Ela não realiza
              diagnósticos, não indica tratamentos e não substitui a avaliação
              de um profissional de saúde.
            </div>
          </>
        )}

        {step === 1 && (
          <div className="panel upload-panel">
            <h3 ref={panelHeadingRef} tabIndex={-1}>
              Escolha o arquivo do seu exame
            </h3>
            <p className="muted" id="file-help">
              Use um PDF ou uma foto nítida, com todos os valores legíveis.
            </p>
            <button
              type="button"
              className={`drop${dragging ? " drag" : ""}`}
              aria-describedby="file-help"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                onSetDragging(true);
              }}
              onDragLeave={() => onSetDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                onSetDragging(false);
                onPick(event.dataTransfer.files[0]);
              }}
            >
              <div className="icon" aria-hidden="true">
                ↑
              </div>
              <strong>
                {file
                  ? file.name
                  : "Clique para escolher ou arraste o arquivo aqui"}
              </strong>
              <span className="muted">
                PDF, JPG ou PNG · tamanho máximo de {MAX_MB} MB
              </span>
              <div className="tags" aria-hidden="true">
                <span>PDF</span>
                <span>JPG</span>
                <span>PNG</span>
              </div>
            </button>
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              tabIndex={-1}
              accept=".pdf,.jpg,.jpeg,.png"
              aria-hidden="true"
              onChange={(event) => onPick(event.target.files?.[0])}
            />
            {file && (
              <button
                type="button"
                className="remove-file"
                onClick={onClearFile}
              >
                Remover arquivo selecionado
              </button>
            )}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button
              className="btn primary block"
              disabled={!file}
              onClick={() => onSetStep(2)}
            >
              Continuar com segurança
            </button>
          </div>
        )}

        {step === 2 && (
          <form
            className="panel identity-panel"
            aria-busy={!!busy}
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy) void onRun();
            }}
          >
            <h3 ref={panelHeadingRef} tabIndex={-1}>
              Proteja seu nome antes da análise
            </h3>
            <p className="muted" id="name-help">
              Usamos o nome somente neste dispositivo para encontrá-lo e
              removê-lo do laudo. Ele nunca é enviado.
            </p>
            <label htmlFor="name">Nome completo</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => onSetName(event.target.value)}
              autoComplete="off"
              required
              minLength={3}
              aria-describedby="name-help"
              aria-invalid={name.length > 0 && name.trim().length < 3}
            />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            {busy && (
              <p className="status" role="status" aria-live="polite">
                <span className="spinner" aria-hidden="true" />
                {busy}
              </p>
            )}
            <div className="row">
              <button
                type="button"
                className="btn ghost"
                disabled={!!busy}
                onClick={() => onSetStep(1)}
              >
                Voltar ao arquivo
              </button>
              <button
                className="btn primary"
                disabled={!!busy || name.trim().length < 3}
              >
                {error ? "Tentar novamente" : "Explicar meu exame"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && result && (
          <div className="panel result-panel">
            <section className="result-overview" aria-labelledby="summary-title">
              <p className="section-kicker">Resumo geral</p>
              <h3 id="summary-title" ref={panelHeadingRef} tabIndex={-1}>
                O que o exame mostra
              </h3>
              <p className="summary-text">{result.summary}</p>
              <p className="ai-origin">
                Explicação gerada com auxílio de inteligência artificial.
              </p>
            </section>

            {!!result.questions_for_doctor?.length && (
              <section className="questions-box" aria-labelledby="questions-title">
                <h3 id="questions-title">Perguntas para levar à consulta</h3>
                <ul>
                  {result.questions_for_doctor.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </section>
            )}

            <section className="detail-section" aria-labelledby="detail-title">
              <div className="detail-heading">
                <div>
                  <p className="section-kicker">Resultado detalhado</p>
                  <h3 id="detail-title">Entenda cada parte do exame</h3>
                </div>
                <p>As comparações usam a referência informada no próprio laudo.</p>
              </div>

              <div className="result-tools">
                <label htmlFor="result-search">Pesquisar marcador</label>
                <input
                  id="result-search"
                  type="search"
                  value={itemQuery}
                  placeholder="Ex.: leucócitos ou acima"
                  onChange={(event) => {
                    setItemQuery(event.target.value);
                    setItemPage(1);
                  }}
                />
                <p className="result-count" role="status" aria-live="polite">
                  {filteredItems.length === 1
                    ? "1 resultado encontrado"
                    : `${filteredItems.length} resultados encontrados`}
                </p>
              </div>

              <div className="items">
                {visibleItems.map((item, index) => (
                  <article
                    key={`${item.name}-${item.value}-${index}`}
                    className={`item ${item.status}`}
                  >
                    <div className="item-head">
                      <h4>{item.name}</h4>
                      <span className="badge">
                        {STATUS_LABEL[item.status] ?? STATUS_LABEL.unknown}
                      </span>
                    </div>
                    <p className="value">
                      {item.value} {item.unit}
                    </p>
                    <p className="reference">
                      Referência do laudo: {item.reference || "não informada"}
                    </p>
                    {item.comparison && (
                      <p className="item-comparison">{item.comparison}</p>
                    )}
                    <p>{item.explanation}</p>
                  </article>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <p className="empty-results">
                  Nenhum marcador corresponde à sua pesquisa.
                </p>
              )}

              {totalItemPages > 1 && (
                <nav className="pagination" aria-label="Páginas dos resultados">
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={itemPage === 1}
                    onClick={() => setItemPage((page) => Math.max(1, page - 1))}
                  >
                    ← Anterior
                  </button>
                  <span aria-live="polite">
                    Página {itemPage} de {totalItemPages}
                  </span>
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={itemPage === totalItemPages}
                    onClick={() =>
                      setItemPage((page) => Math.min(totalItemPages, page + 1))
                    }
                  >
                    Próxima →
                  </button>
                </nav>
              )}
            </section>

            <div className="medical-notice result-notice" role="note">
              <strong>Converse com um profissional de saúde.</strong> Esta
              explicação é educativa e não representa diagnóstico, avaliação de
              gravidade ou indicação de tratamento.
            </div>
            <button className="btn primary block" onClick={onRestart}>
              Analisar outro exame
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
