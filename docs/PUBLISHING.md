# Публикация в отдельном репозитории

## Подготовка

В корень нового репозитория поместите **содержимое папки проекта**, а не внешнюю папку с подборкой работ. Рядом должны находиться package.json, README.md, src и .github. При загрузке через файловый менеджер не пропускайте скрытую папку .github. Каждый проект публикуется отдельно.

Установите Node.js 24, выполните npm install, затем npm run check. Сохраните созданный package-lock.json в репозитории. Пока lockfile отсутствует, workflow использует npm install; после его появления автоматически использует npm ci. Не создавайте lockfile вручную.

Из корня проекта, заменив USERNAME и REPOSITORY:

```bash
git init -b main
git add .
git commit -m "Initial project"
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

Эти команды предназначены для нового пустого репозитория. При существующем репозитории используйте его обычный процесс работы; не переинициализируйте его и не включайте в commit посторонние изменения.

## GitHub Pages

В репозитории откройте **Settings → Pages → Build and deployment → Source → GitHub Actions**. Затем откройте **Actions**, выберите workflow публикации и запустите **Run workflow** для main. Последующие push в main запускают его автоматически. Pull request запускает проверки, но не публикует сайт.

После успешного deploy ссылка появится в Environment github-pages и в Settings → Pages. Типичный адрес:

```text
https://USERNAME.github.io/REPOSITORY/
```

В README замените шаблон ссылки на фактический адрес. Наличие workflow не означает, что репозиторий уже создан или сайт уже опубликован. Сборка и deploy останавливаются при ошибке проверок.

## Пути и ресурсы

React-проекты получают base из actions/configure-pages: вручную прописывать название репозитория не требуется. В Node.js-проектах ресурсы и demo.json подключены относительными путями. В курсовой используется HashRouter, поэтому прямое открытие и перезагрузка маршрута вида /REPOSITORY/#/tasks/ID не требуют серверных rewrite-правил.

На Pages нельзя исполнять серверный Node.js при каждом запросе. Для работ 54–56 workflow выполняет настоящий Node.js-код при сборке, сохраняет результат и публикует статическую страницу. Локальные команды npm start и npm run test:logic выполняют оригинальную серверную логику.

## Частые ошибки

**404 или пустая страница:** проверьте, что Source = GitHub Actions, workflow завершён успешно, файлы проекта находятся в корне репозитория, а адрес включает имя репозитория и завершающий слеш.

**Workflow не запускается:** проверьте название основной ветки main и наличие .github/workflows/pages.yml. Для другой ветки измените branches в workflow и настройки environment.

**npm ci сообщает об отсутствии lockfile:** сначала выполните npm install. Сгенерированный lockfile должен соответствовать package.json.

**Пакеты не устанавливаются:** проверьте доступ к npm registry и версии Node/npm. Не используйте --force или --legacy-peer-deps для сокрытия конфликта версий. Устраните причину ошибки из вывода npm.

**Скриншот отчёта не создаётся:** в React-проекте выполните npx playwright install chromium, затем npm run test:report. В GitHub Actions браузер устанавливается автоматически.

**Внешний API недоступен:** в 49 выберите «Локальный JSON». Для 52 оставьте VITE_API_URL пустым для автономного деморежима. Собственный API должен разрешать CORS для вашего Pages origin.

Официальная инструкция: https://vite.dev/guide/static-deploy ; описание Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
