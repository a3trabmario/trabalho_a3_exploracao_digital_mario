// Mantém apenas dados clínicos; roda no navegador antes de qualquer envio.
const ACCENTS: Record<string, string> = {
  a: "aáàâãä",
  e: "eéèêë",
  i: "iíìîï",
  o: "oóòôõö",
  u: "uúùûü",
  c: "cç",
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordPattern(word: string) {
  return [...word.toLowerCase()]
    .map((ch) => (ACCENTS[ch] ? `[${ACCENTS[ch]}]` : escapeRegex(ch)))
    .join("");
}

const LABEL_LINE =
  /^(\s*(?:paciente|nome(?:\s+do\s+paciente)?|m[eé]dico(?:\s+solicitante)?|solicitante|respons[aá]vel(?:\s+t[eé]cnico)?|endere[cç]o|logradouro|bairro|cidade|munic[ií]pio|conv[eê]nio|carteirinha|prontu[aá]rio|registro|protocolo|m[aã]e|pai|data\s+de\s+nascimento|nascimento|dn)\s*[:-]\s*).+$/gim;

const PATTERNS: [RegExp, string][] = [
  [/\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g, "[EMAIL]"],
  [/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "[CNPJ]"],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]"],
  [/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dXx]\b/g, "[RG]"],
  [/(?:\+?55\s*)?\(?\b\d{2}\)?\s*9?\d{4}[-\s]?\d{4}\b/g, "[TELEFONE]"],
  [/\b\d{5}-?\d{3}\b/g, "[CEP]"],
  [/\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, "[DATA]"],
  [
    /\b(?:CRM|CRBM|CRF|CRBio|COREN)(?:[-/\s]*[A-Z]{2})?[\s:-]*\d[\d.]*/gi,
    "[REGISTRO PROFISSIONAL]",
  ],
];

export function anonymize(text: string, fullName: string): string {
  let out = text.replace(LABEL_LINE, "$1[REMOVIDO]");
  for (const [re, token] of PATTERNS) out = out.replace(re, token);
  for (const word of fullName.split(/\s+/).filter((w) => w.length >= 3)) {
    out = out.replace(
      new RegExp(`(?<![\\p{L}])${wordPattern(word)}(?![\\p{L}])`, "giu"),
      "[PACIENTE]",
    );
  }
  return out;
}
