from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Literal

from pydantic import BaseModel, Field

from .anonymize import anonymize
from .config import settings
from .gemini import GeminiError, explain_exam

app = FastAPI(title="LêExame API", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.frontend_origin.split(",")],
    allow_origin_regex=settings.frontend_origin_regex or None,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


class AnalyzeRequest(BaseModel):
    # Texto anonimizado no navegador; nunca recebemos arquivo nem nome.
    text: str = Field(min_length=20, max_length=40000)
    age: int = Field(ge=0, le=120)
    gender: Literal["feminino", "masculino", "outro", "nao_informar"]


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(body: AnalyzeRequest) -> dict:
    clean = anonymize(body.text)  # segunda camada; nada é gravado em disco ou banco
    try:
        result = await explain_exam(clean, body.age, body.gender)
    except GeminiError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from None
    if not result.get("items"):
        raise HTTPException(status_code=422, detail="Não encontramos resultados de exame no arquivo.")
    return result
