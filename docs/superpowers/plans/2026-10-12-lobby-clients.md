# Етап 2: клієнти лобі (екран + геймпад)

## Контекст

Серверна половина Етапу 2 готова (PR #1): реєстр кімнат, `room:create` / `room:join` / `room:leave`,
`disconnect`, розсилка `room:state`. Бракує клієнтів: екран показує лише код, геймпад порожній.
Мета — закрити чотири пункти «Готово, коли…» Етапу 2 у `ROADMAP.md`.

## Глобальні обмеження

- Поза межами: zod, типізовані мапи подій, reconnect/токени (Етап 3); автотести (Vitest — Етап 4).
- Перевірка кожної задачі: `pnpm typecheck`. Наскрізна перевірка — вручну в браузері (Task 5).
- Версії залежностей фіксовані (без `^`), як у решті репозиторію.
- Тексти інтерфейсу українською (`lang="uk"` в `index.html`).

## Task 1: Dev-сетап

- `apps/gamepad/package.json`: скрипт `dev: vite`, залежність `socket.io-client` (та сама версія, що в `screen`).
- `apps/gamepad/.env.example` з `VITE_SERVER_URL`; `apps/gamepad/src/vite-env.d.ts`.
- `apps/screen/vite.config.ts`: `server: {host: true, port: 5173, strictPort: true}`.
- `apps/gamepad/vite.config.ts`: те саме з портом 5174.
- `apps/server/.env.example`: додати origin'и з портом 5174 у `CLIENT_ORIGINS`.
- `apps/screen`: змінна `VITE_GAMEPAD_URL` (`.env.example`, `vite-env.d.ts`), залежність `qrcode.react`.

Expected: `pnpm typecheck` проходить у всіх пакетах.

## Task 2: Протокол `player:buzz`

Produces:
- `packages/shared/main.ts`: `RoomError` + `'NOT_IN_ROOM'`; тип `BuzzAck = {ok: true} | {ok: false; error: RoomError}`;
  тип `PlayerBuzzed = {playerId: string}`.
- `apps/server/lib/room.ts`: `RoomRegistry.findPlayerRoomCode({socketId}): string | undefined` —
  код кімнати, якщо сокет є **гравцем** (не хостом).
- `apps/server/lib/room-handlers.ts`: обробник `player:buzz` → ack `BuzzAck`, розсилка `player:buzzed`
  з `PlayerBuzzed` у кімнату. Тіло обробника — `TODO(human)`.

Expected: `pnpm typecheck` проходить.

## Task 3: Екран

Consumes: `RoomState`, `RoomAck`, `PlayerBuzzed`, події `room:state`, `player:buzzed`.

- `apps/screen/src/App.tsx`: код кімнати, QR (`QRCodeSVG`) на `${VITE_GAMEPAD_URL}/?code=${code}`,
  список гравців із `room:state`, підсвітка гравця ~600 мс на `player:buzzed`.
- `useEffect`: знімати слухачі в cleanup, без залежності `[socket]`.

Expected: `pnpm typecheck` проходить.

## Task 4: Геймпад

Consumes: `RoomAck`, `BuzzAck`, `RoomError`, події `room:join`, `player:buzz`, `room:closed`.

- `apps/gamepad/src/App.tsx`: форма (код із `?code=`, ім'я) → `room:join`; після входу — ім'я і велика
  кнопка, що шле `player:buzz`. Помилки з ack — текстом. `room:closed` / `disconnect` → назад на форму.
- `apps/gamepad/src/main.tsx`: рендерити `App`.

Expected: `pnpm typecheck` проходить.

## Task 5: Наскрізна перевірка

- Arthur дописує `TODO(human)` з Task 2.
- `pnpm dev`; у браузері: екран + дві вкладки геймпада — вхід, список, кнопка, закриття вкладки.
- Вхід зі справжнього телефона через QR перевіряє Arthur; після цього — галочки в `ROADMAP.md`.
