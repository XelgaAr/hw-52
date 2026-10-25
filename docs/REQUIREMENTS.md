# Сопоставление с HW52

Источник: hw-52-r15.pdf и приложенная лекция #15. Номера страниц относятся к заданию, а не лекции.

| Требование | Реализация |
|---|---|
| PDF, стр. 1: React и Redux Toolkit, тема средней/высокой сложности | Planova: проекты, задачи, Kanban, аналитика |
| PDF, стр. 2: готовность к будущему API | workspaceApi, VITE_API_URL и docs/API.md |
| PDF, стр. 2: slices и thunks | projects/tasks/filters slices и createAsyncThunk |
| PDF, стр. 3–4: документация, ESLint, публикация | README, eslint.config.js, .github/workflows/pages.yml |
| PDF, стр. 4–8: модульная структура | app, features, pages, widgets, services, shared; пример структуры адаптирован к выбранной теме |

Публикация на GitHub Pages выбрана по отдельному требованию; Vercel/Netlify в PDF приведены как варианты. Репозиторий создаётся владельцем, фактическая ссылка на демо добавляется после deploy. Проверки, требующие недоступных пакетов, перечислены отдельно в VERIFICATION.md.
