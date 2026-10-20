import json

import httpx

from .config import settings

_URL = "https://generativelanguage.googleapis.com/v1beta/interactions"

_PROMPT = """Você explica resultados de exames de sangue em português brasileiro, com linguagem simples, acolhedora e não alarmista.
O texto abaixo foi anonimizado; marcadores como [CPF] ou [REMOVIDO] indicam dados pessoais retirados. Ignore-os e nunca tente inferir identidade.
Regras: não dê diagnóstico, não prescreva, não recomende mudança de tratamento ou medicação; sugira conversar com um profissional de saúde.
Use somente valores presentes no texto. Se não houver resultados de exame, retorne "items" vazio.
Responda apenas em JSON com este formato:
{"summary": string, "items": [{"name": string, "value": string, "unit": string, "reference": string, "status": "low"|"normal"|"high"|"unknown", "explanation": string}], "questions_for_doctor": [string]}

Texto do exame:
"""


class GeminiError(Exception):
    pass


async def explain_exam(text: str) -> dict:
    if not settings.gemini_api_key:
        raise GeminiError("Serviço de análise não configurado.")

    # payload = {
    #     "contents": [{"parts": [{"text": _PROMPT + text}]}],
    #     "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
    # }
    payload = {
        'model': settings.gemini_model,
        'input':  _PROMPT + text
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                _URL.format(model='gemini-3.8-flash'),
                headers={"x-goog-api-key": settings.gemini_api_key, 
                         "Content-Type": "application/json"},
                json=payload,
            )
        resp.raise_for_status()
        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw)
    except (httpx.HTTPError, KeyError, IndexError, ValueError):
        raise GeminiError("Não foi possível analisar o exame agora.") from None
