# ExpliLab POC

POC de uma aplicação para o usuário enviar resultados de exames laboratoriais e receber uma explicação em linguagem simples gerada por IA.

## Escopo atual

- Front-end em React + TypeScript + Vite.
- Backend em Python + FastAPI.
- Persistência em MySQL usando Peewee.
- Login e cadastro com e-mail e senha.
- Envio do resultado como texto.
- Análise pela OpenAI API.
- Separação entre texto original e análise gerada.

Este é um POC educacional. A explicação não é diagnóstico, não substitui consulta médica e não deve ser usada para alterar tratamentos por conta própria.

## Estrutura

- `backend/`: API FastAPI, modelos Peewee e integração com a OpenAI.
- `frontend/`: aplicação React com TypeScript.
- `docs/`: arquitetura, API e decisões do projeto.

## Pré-requisitos

- Python 3.11+.
- Node.js 20+ e npm.
- MySQL 8+ já instalado e em execução.
- Uma chave da OpenAI, caso a análise real seja habilitada.

## Configuração do banco

Crie um banco vazio no MySQL:

```sql
CREATE DATABASE explilab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

O projeto não usa migrações. As tabelas iniciais são criadas pelo script `backend/create_tables.py`.

## Executando o backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python create_tables.py
uvicorn app.main:app --reload --port 8000
```

No Windows, ative o ambiente virtual com `.venv\\Scripts\\activate`.

## Executando o frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação ficará disponível na URL exibida pelo Vite, normalmente `http://localhost:5173`.

## Variáveis do backend

Consulte `backend/.env.example`. A `OPENAI_API_KEY` deve permanecer somente no backend e nunca ser exposta ao navegador.

## Próximos passos

1. Implementar os endpoints de autenticação e exames.
2. Implementar o fluxo de login no React.
3. Adicionar validação da resposta estruturada da IA.
4. Adicionar testes unitários e de integração.
5. Substituir o texto livre por upload de arquivos somente depois de validar o fluxo principal.

## Aviso de privacidade

Resultados de exames são dados pessoais sensíveis. Mesmo em um POC, use dados fictícios ou anonimizados. Antes de qualquer uso real, revise segurança, retenção, base legal e contratos com fornecedores.
