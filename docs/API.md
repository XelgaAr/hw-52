# API рабочего пространства

## Режимы

Пустой VITE_API_URL означает demo: GET файла data/workspace.json, затем чтение/запись localStorage. При непустом VITE_API_URL используется REST API; демоданные и локальное хранилище в этом режиме не подставляются. Адрес задаётся без обязательного завершающего слеша.

Локально: .env.local. На GitHub: Settings → Secrets and variables → Actions → Variables → VITE_API_URL. Workflow передаёт переменную только финальной production-сборке. Никакие ключи/токены не помещайте в VITE_*: эти значения видны клиенту. Сервер должен разрешать CORS для origin страницы и методы GET, POST, PATCH, DELETE, заголовок Content-Type. Для HTTPS Pages нужен HTTPS API.

## Ресурсы

| Метод и путь | Тело запроса | Успешный ответ |
|---|---|---|
| GET /workspace | — | { version: 1, projects: Project[], tasks: Task[] } |
| POST /projects | { name, color } | Project с id и createdAt |
| PATCH /projects/:id | { id, name, color } | полное обновлённое Project |
| DELETE /projects/:id | — | 204; сервер также удаляет все задачи проекта |
| POST /tasks | TaskInput без id | полный Task |
| PATCH /tasks/:id | TaskInput с id | полный обновлённый Task |
| DELETE /tasks/:id | — | 204 |

Пути добавляются к VITE_API_URL; например https://api.example.test/api + /tasks. Идентификатор сегмента кодируется encodeURIComponent. Создание/изменение возвращает JSON с HTTP 2xx. Ошибки — HTTP 4xx/5xx. Клиент не считает DELETE успешным до подтверждения сервера.

```json
{
  "version": 1,
  "projects": [{
    "id": "project-1",
    "name": "Сайт",
    "color": "#345dc4",
    "createdAt": "2026-10-25T09:00:00Z"
  }],
  "tasks": [{
    "id": "task-1",
    "projectId": "project-1",
    "title": "Подготовить макет",
    "description": "Согласовать структуру страницы",
    "status": "todo",
    "priority": "normal",
    "dueDate": "2026-11-01",
    "tags": ["design"],
    "createdAt": "2026-10-25T09:00:00Z",
    "updatedAt": "2026-10-25T09:00:00Z"
  }]
}
```

TaskInput — title, description, projectId, status, priority, dueDate, tags и опциональный id. Время createdAt/updatedAt формирует сервер (в demo — адаптер). status: todo/doing/done; priority: high/normal/low. Название задачи 3–100 символов, описание до 3000, до 5 тегов по 24 символа, dueDate — пустая строка или действительная YYYY-MM-DD. Имя проекта 2–60 символов. Цвет — один из PROJECT_COLORS в shared/config/constants.js. ID уникальны и непусты, каждая задача ссылается на существующий проект.

## Ошибки и конкурентность

Таймаут запроса — 10 секунд, AbortSignal передаётся через контроллер. Ответ целиком проверяется при загрузке, отдельные сущности — после сохранения. Ошибки хранилища/HTTP не приводят к ложному обновлению Redux. В UI мутации блокируются на время текущей операции; демоадаптер дополнительно сериализует записи.

Повреждённые локальные данные не очищаются молча. Для восстановления можно изучить/скопировать localStorage в DevTools и затем выполнить подтверждённый сброс демо. Экспорт JSON выгружает текущее валидное состояние; импорт намеренно не заявлен как функция.

В будущем сервер должен самостоятельно обеспечивать валидацию, права доступа, аутентификацию и транзакционное каскадное удаление. Клиентские проверки не заменяют серверные. Эти серверные функции не входят в данную frontend-работу.
