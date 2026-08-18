# FastAPI JWT Auth

Простой REST API с регистрацией и авторизацией через JWT.

## Стек
- Python 3.11
- FastAPI
- JWT (PyJWT)
- PostgreSQL (или SQLite, если на нём)

## Как запустить
1. Установить зависимости: `pip install -r requirements.txt`
2. Запустить: `uvicorn main:app --reload`
3. Открыть документацию: `http://localhost:8000/docs`

## Эндпоинты
- `POST /register` — регистрация нового пользователя
- `POST /login` — получение JWT-токена
- `GET /protected` — защищённый маршрут (требуется токен)
