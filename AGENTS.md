# Instruções para agentes

## Contexto do projeto

- LêExame é um POC educacional para registrar resultados de exames e apresentá-los com explicações em linguagem simples.
- A interface usa React, TypeScript e Vite em `frontend/`.
- A API usa Python e FastAPI em `backend/`, integrada ao Gemini. Não há banco de dados: nenhum dado é persistido.
- A anonimização ocorre no navegador e novamente no backend; nunca envie arquivo ou nome ao servidor. Consulte `README.md` antes de alterar fluxos.

## Orientações gerais

- Preserve o idioma português brasileiro e o tom claro, acolhedor e não alarmista da interface.
- Faça mudanças pequenas e consistentes com a arquitetura atual. Não adicione dependências sem necessidade.
- Não exponha chaves, tokens, credenciais ou dados sensíveis no frontend, logs ou mensagens de erro.
- Resultados de exames são dados pessoais sensíveis. Prefira dados fictícios em exemplos e testes.
- Explicações de exames não são diagnóstico ou prescrição, não substituem profissionais de saúde e não devem recomendar mudanças de tratamento.

## Frontend

- Mantenha componentes em React + TypeScript e estilos em `frontend/src/styles.css`, salvo quando a organização existente justificar outra abordagem.
- Use a paleta definida no projeto: coral `#d6496c`, verde-sálvia `#7db8a2`, lima `#d6dd90`, creme `#fffad3` e ameixa `#7e638c`.
- Use Georgia para títulos e Avenir/Avenir Next/Avenir Light para texto corrido, com fallbacks locais.
- Priorize contraste WCAG AA para texto normal (mínimo 4,5:1), foco visível, navegação por teclado, rótulos acessíveis e layout responsivo. Não use as cores claras da paleta como texto pequeno sobre fundo branco.
- Após mudanças no frontend, valide com `cd frontend && npm run build`.

## Backend

- Preserve as responsabilidades existentes do FastAPI e Gemini.
- Valide entradas e trate erros sem revelar detalhes internos ou informações sensíveis.
- Mantenha credenciais e integração com serviços externos exclusivamente no backend.
- Siga o ambiente e as dependências declaradas em `backend/requirements.txt`.

## Ao concluir uma alteração

- Execute as verificações relevantes disponíveis para a área alterada.
- Informe brevemente o que mudou e quais verificações foram executadas; deixe claro se algo não pôde ser verificado.
