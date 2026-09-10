import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

function App() {
  return (
    <main>
      <h1>ExpliLab</h1>
      <p>POC para explicar resultados laboratoriais em linguagem simples.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
