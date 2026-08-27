# KOR Daily v1.0

Компактный трекер ежедневных и запланированных заданий KOR.RU.

## Структура

- `index.html` — разметка
- `css/style.css` — интерфейс
- `js/firebase.js` — конфигурация Firebase
- `js/auth.js` — регистрация/вход
- `js/state.js` — состояние приложения
- `js/tasks.js` — задания Firestore
- `js/ui.js` — отрисовка
- `js/app.js` — логика приложения
- `manifest.json` — PWA

## Установка

1. Создай Firebase Web App.
2. Включи Authentication → Email/Password.
3. Создай Firestore Database.
4. В `js/firebase.js` замени `YOUR_*` на свой `firebaseConfig`.
5. В Firestore Rules используй:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write:
        if request.auth != null
        && request.auth.uid == userId;
    }
  }
}
```

6. Загрузи папку в GitHub.
7. Включи GitHub Pages: Settings → Pages → Deploy from branch → `main` → `/root`.

## Примечание

Firebase Web config не является секретом. Не публикуй сервисные аккаунты, private keys или Admin SDK credentials.
