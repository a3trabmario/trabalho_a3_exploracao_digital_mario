# Arquitetura do POC

## Visão geral

```text
React + TypeScript
        |
        | HTTP/JSON
        v
FastAPI (Python)
        |
        +--> Peewee --> MySQL
        |
        +--> OpenAI API
```

O POC usa uma API síncrona para manter a implementação pequena. A requisição de criação do exame aguarda a análise da IA. Em uma versão de produção, esse trabalho deve ser movido para uma fila e um worker.

## Componentes

### Front-end

Aplicação React responsável por cadastro, login, envio do resultado e apresentação separada do texto original e da explicação.

### Backend

FastAPI concentra autenticação, regras de negócio, persistência e integração com a OpenAI API. A chave da OpenAI nunca chega ao navegador.

### Banco

MySQL com três tabelas iniciais: usuários, exames e análises da IA. Peewee cria as tabelas por meio de `create_tables.py`; não há ferramenta de migração neste POC.

### IA

A aplicação envia o texto do exame para um prompt controlado e valida a resposta antes de armazená-la. A IA pode explicar termos e destacar informações presentes no texto, mas não deve diagnosticar ou prescrever.

## Fluxo principal

1. O usuário cria uma conta.
2. O backend armazena somente o hash da senha.
3. O usuário faz login e recebe um token.
4. O React envia o token nas requisições protegidas.
5. O usuário envia o texto do exame.
6. O backend associa o exame ao usuário autenticado.
7. O backend chama a OpenAI API.
8. A resposta é validada e salva separadamente.
9. O usuário acessa apenas os próprios exames.

## Limites do POC

Ficam fora desta etapa: integração automática com laboratórios, upload de PDF/imagem, OAuth, MFA, múltiplos tenants, filas, painel administrativo e migrações automáticas.

## Segurança mínima

- Senhas com hash seguro.
- JWT assinado com segredo mantido em variável de ambiente.
- Consultas de exames filtradas pelo usuário autenticado.
- CORS restrito ao endereço do front-end.
- Chave da OpenAI somente no backend.
- Uso de dados fictícios ou anonimizados durante o desenvolvimento.
