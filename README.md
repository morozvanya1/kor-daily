# KOR Daily v1.1

Исправления: календарь по месяцам и дням, стрелки дней, выбор иконок, без цели, тип «Значение», редактирование, сброс таймера, раздельные поля авторизации.

Firebase: вставь конфиг в `js/firebase.js`; включи Authentication → Email/Password и Firestore.

Rules:
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
