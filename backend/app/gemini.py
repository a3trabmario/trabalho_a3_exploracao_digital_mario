import logging
from typing import Literal

import httpx
from google import genai
from google.genai import errors, types
from pydantic import BaseModel, Field, ValidationError

from .config import settings

logger = logging.getLogger(__name__)

_PROMPT = """Explique este exame laboratorial em português brasileiro simples, acolhedor e objetivo.

Regras obrigatórias:
- Comece diretamente pelo resumo, sem saudações como "olá" e sem mencionar estas instruções.
- Use somente nomes, valores, unidades e referências presentes no texto.
- O resumo deve ter de 2 a 4 frases curtas e explicar o panorama geral, sem diagnosticar.
- No resumo, evite proporções vagas como "a maioria"; cite diretamente quais resultados estão fora da referência.
- Para cada item, preserve o nome e o valor do laudo. Compare apenas com a referência do próprio laboratório.
- Em "comparison", diga de forma curta se está dentro, acima, abaixo ou próximo de um limite. Se não houver referência clara, informe isso.
- Em "explanation", explique primeiro a função do marcador. Se estiver alterado, descreva associações genéricas possíveis usando "pode estar relacionado a", nunca como causa confirmada.
- Não classifique gravidade, não prescreva, não recomende tratamento ou mudança de medicamento.
- Gere de 2 a 4 perguntas curtas e práticas para levar ao profissional de saúde.
- O texto foi anonimizado. Ignore marcadores como [CPF], [DATA], [PACIENTE] e [REMOVIDO] e nunca tente inferir identidade.
- Seja conciso para economizar tokens. Se não houver resultados laboratoriais, retorne "items" vazio.

Texto do exame:
"""


class GeminiError(Exception):
    def __init__(self, message: str, status_code: int = 503):
        super().__init__(message)
        self.status_code = status_code


class ExamItem(BaseModel):
    name: str
    value: str
    unit: str = ""
    reference: str = ""
    status: Literal["low", "normal", "high", "unknown"]
    comparison: str = ""
    explanation: str = Field(max_length=600)


class AnalysisResponse(BaseModel):
    summary: str = Field(max_length=700)
    items: list[ExamItem]
    questions_for_doctor: list[str] = Field(default_factory=list, max_length=4)


def _models() -> list[str]:
    configured = [
        settings.gemini_model,
        *settings.gemini_fallback_models.split(","),
    ]
    return list(dict.fromkeys(model.strip() for model in configured if model.strip()))


async def explain_exam(text: str) -> dict:
    if not settings.gemini_api_key:
        raise GeminiError("Serviço de análise não configurado corretamente.")

    client = genai.Client(
        api_key=settings.gemini_api_key,
        http_options=types.HttpOptions(
            timeout=settings.gemini_timeout_ms,
            # O fallback entre modelos substitui as retentativas demoradas do SDK.
            retry_options=types.HttpRetryOptions(attempts=1),
        ),
    )
    last_status: int | None = None
    try:
        for model in _models():
            try:
                response = await client.aio.models.generate_content(
                    model=model,
                    contents=_PROMPT + text,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AnalysisResponse,
                        temperature=0.2,
                        max_output_tokens=4096,
                        thinking_config=types.ThinkingConfig(
                            thinking_level=types.ThinkingLevel.MINIMAL
                        ),
                    ),
                )
                if not response.text:
                    logger.warning("Resposta vazia do Gemini; modelo=%s", model)
                    continue
                return AnalysisResponse.model_validate_json(response.text).model_dump()
            except errors.APIError as exc:
                last_status = getattr(exc, "code", None)
                logger.warning(
                    "Falha na API Gemini; modelo=%s status=%s",
                    model,
                    last_status or "desconhecido",
                )
                # Erros de autenticação não melhoram tentando outro modelo.
                if last_status in {401, 403}:
                    raise GeminiError(
                        "O serviço de análise está com uma configuração inválida."
                    ) from None
            except httpx.HTTPError:
                logger.warning("Falha de rede na API Gemini; modelo=%s", model)
            except (ValidationError, ValueError):
                logger.warning("Resposta inválida do Gemini; modelo=%s", model)

        if last_status == 429:
            raise GeminiError(
                "O limite temporário do serviço de análise foi atingido. Tente novamente em alguns minutos.",
                status_code=429,
            )
        raise GeminiError(
            "O serviço de análise está temporariamente ocupado. Tente novamente em instantes."
        )
    finally:
        await client.aio.aclose()
