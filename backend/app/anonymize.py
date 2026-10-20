"""Remoção de dados pessoais do texto antes de qualquer envio ao Gemini.

O navegador já anonimiza o texto; esta é uma segunda camada de defesa.
"""
import re

_LABEL_LINE = re.compile(
    r"(?im)^(\s*(?:paciente|nome(?:\s+do\s+paciente)?|m[eé]dico(?:\s+solicitante)?|solicitante|"
    r"respons[aá]vel(?:\s+t[eé]cnico)?|endere[cç]o|logradouro|bairro|cidade|munic[ií]pio|"
    r"conv[eê]nio|carteirinha|prontu[aá]rio|registro|protocolo|m[aã]e|pai|"
    r"data\s+de\s+nascimento|nascimento|dn)\s*[:\-]\s*).+$"
)

_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b"), "[EMAIL]"),
    (re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b"), "[CNPJ]"),
    (re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"), "[CPF]"),
    (re.compile(r"\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dXx]\b"), "[RG]"),
    (re.compile(r"(?:\+?55\s*)?\(?\b\d{2}\)?\s*9?\d{4}[-\s]?\d{4}\b"), "[TELEFONE]"),
    (re.compile(r"\b\d{5}-?\d{3}\b"), "[CEP]"),
    (re.compile(r"\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b"), "[DATA]"),
    (re.compile(r"\b(?:CRM|CRBM|CRF|CRBio|COREN)(?:[-/\s]*[A-Z]{2})?[\s:-]*\d[\d.]*", re.I), "[REGISTRO PROFISSIONAL]"),
]


def anonymize(text: str) -> str:
    text = _LABEL_LINE.sub(lambda m: m.group(1) + "[REMOVIDO]", text)
    for pattern, token in _PATTERNS:
        text = pattern.sub(token, text)
    return text
