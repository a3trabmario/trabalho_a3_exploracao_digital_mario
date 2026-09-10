# API inicial

Base local: `http://localhost:8000`

## `POST /auth/register`

Cria um usuário.

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "senha-forte"
}
```

## `POST /auth/login`

Autentica um usuário e retorna um token Bearer.

```json
{
  "email": "maria@example.com",
  "password": "senha-forte"
}
```

## `POST /exams`

Cria e analisa um exame. Requer `Authorization: Bearer <token>`.

```json
{
  "title": "Hemograma",
  "exam_date": "2026-09-10",
  "content": "Hemoglobina: 11,2 g/dL. Referência: 12,0 a 15,5 g/dL."
}
```

## `GET /exams`

Lista somente exames do usuário autenticado.

## `GET /exams/{exam_id}`

Retorna o texto original e a análise da IA do exame informado, somente se ele pertencer ao usuário autenticado.

## Erros principais

- `400`: dados de entrada inválidos.
- `401`: token ausente ou inválido.
- `404`: recurso não encontrado ou não pertencente ao usuário.
- `409`: e-mail já cadastrado.
- `502`: falha na comunicação com a OpenAI API.
