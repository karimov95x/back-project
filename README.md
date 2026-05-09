# Radiomed Backend

Backend часть проекта Radiomed построена на NestJS, Prisma и PostgreSQL. API предназначен для обмена медицинскими исследованиями между клиниками и врачами, управления пользователями и хранения статусов исследований.

## Стек

- NestJS 11
- Prisma ORM
- PostgreSQL / Neon
- JWT authentication
- Swagger OpenAPI
- Railway deployment
- Neon PostgreSQL

## Основные сущности

- `User` — пользователь системы с ролями `ADMIN`, `DOCTOR`, `CLINIC`
- `Study` — медицинское исследование пациента
- `StudyFile` — связанные файлы исследования
- `StudyViewer` — связь многие-ко-многим для истории просмотров врачами

## Запуск локально

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run migrate:dev -- --name init
npm run prisma:seed
npm run start:dev
```

## Обязательные переменные окружения

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
PORT=3002
CORS_ORIGIN=http://localhost:3001,https://your-frontend.vercel.app
NODE_ENV=production
```

Дополнительно для автосоздания администратора можно задать:

```env
ADMIN_EMAIL=admin@radiomed.app
ADMIN_PASSWORD=ChangeMe12345
ADMIN_NAME=Radiomed Admin
```

## Swagger

Документация доступна по адресу:

```text
/api/docs
```

Healthcheck Railway:

```text
/api/health
```

## Основные маршруты

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/users`
- `POST /api/users`
- `GET /api/studies`
- `POST /api/studies`
- `GET /api/studies/:id`
- `PATCH /api/studies/:id`
- `DELETE /api/studies/:id`
- `PATCH /api/studies/:id/take`
- `PATCH /api/studies/:id/reject`
- `PATCH /api/studies/:id/release`
- `PATCH /api/studies/:id/complete`
- `PATCH /api/studies/:id/reopen`

## Роли и доступ

- `ADMIN` — полный доступ к пользователям и исследованиям
- `CLINIC` — создаёт и редактирует только свои исследования
- `DOCTOR` — видит новые исследования и назначенные ему, может брать в работу, отказываться и завершать

## Seed данные

После выполнения `npm run prisma:seed` будут созданы тестовые пользователи:

- `admin@radiomed.local / Admin12345`
- `clinic@radiomed.local / Clinic12345`
- `doctor@radiomed.local / Doctor12345`

## Production Deploy

- Railway service root: `back-project`
- Railway стартует через [railway.toml](./railway.toml) и выполняет `npm run start:migrate`
- База данных: Neon PostgreSQL
- Swagger после деплоя: `https://<railway-domain>/api/docs`

Полная инструкция: [../DEPLOY.md](../DEPLOY.md)
