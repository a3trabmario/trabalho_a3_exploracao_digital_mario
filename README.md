# LêExame

POC educacional: envie o laudo de um exame de sangue (PDF, JPG ou PNG) e receba uma explicação em linguagem simples, gerada pelo Gemini.

## Privacidade e anonimização

- O arquivo é lido **no navegador** (pdf.js / Tesseract OCR); ele nunca é enviado ao servidor.
- O nome informado, CPF, RG, e-mail, telefone, CEP, datas, endereço e registros profissionais são removidos do texto **antes do envio**. O nome nunca sai do navegador.
- A idade e a opção de gênero/sexo informadas são enviadas junto ao texto anonimizado para contextualizar a explicação. É possível escolher “Outro / não sei” ou “Prefiro não informar”; esses dados não são armazenados.
- O backend aplica uma segunda camada de anonimização e só então chama o Gemini.
- **Nenhum dado é salvo** em banco de dados ou disco; tudo existe apenas durante a execução. Não há banco de dados.
- A interface mostra o texto anonimizado que foi enviado.

## Execução

```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # preencha GEMINI_API_KEY
uvicorn app.main:app --reload

cd frontend
npm install
npm run dev
```

Endpoints: `GET /api/health` e `POST /api/analyze` (`{"text": "<texto anonimizado>", "age": 35, "gender": "feminino"}`). Os valores aceitos para `gender` são `feminino`, `masculino`, `outro` e `nao_informar`.

As explicações são educativas e não substituem profissionais de saúde.
