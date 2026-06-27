# Docker Setup

Start the full stack:

```bash
docker compose up --build
```

The app will be available at:

```text
http://localhost:3000
```

The Compose setup starts:

- `app`: Node/Express POS app
- `mysql`: MySQL 8.4 with persistent `mysql_data`
- `redis`: Redis 7 with persistent `redis_data`
- `uploads`: persistent invoice/photo uploads

Your local `.env` is used for app secrets such as `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, and `TELEGRAM_CHAT_ID`. Compose overrides database and Redis host settings so the app can reach the container services.

Useful commands:

```bash
docker compose logs -f app
docker compose down
docker compose down -v
```

Use `docker compose down -v` only when you want to remove the MySQL, Redis, and upload volumes.
