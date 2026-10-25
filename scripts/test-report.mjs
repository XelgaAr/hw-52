import { spawnSync } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
await mkdir('reports', { recursive: true })
await rm('reports/vitest.json', { force: true })
const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--reporter=default', '--reporter=json', '--outputFile=reports/vitest.json'], { encoding: 'utf8', env: { ...process.env, NO_COLOR: '1' } })
const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`
process.stdout.write(output)
await writeFile('reports/test-output.txt', output)
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
let data
try { data = JSON.parse(await readFile('reports/vitest.json', 'utf8')) } catch { data = null }
const passed = result.status === 0 && data?.success === true
const html = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Отчёт тестирования</title><style>body{font:16px/1.6 system-ui;background:#f3f5f8;color:#203045;margin:0;padding:40px}main{max-width:1100px;margin:auto}h1{font-size:32px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#142337;color:#e6effb;padding:24px;border-radius:12px;font:14px/1.6 monospace}.status{padding:16px;background:${passed ? '#dff5e8' : '#ffe8e8'};border-radius:10px}a{color:#245dc1}</style><main><p>VITEST · ${escape(new Date().toISOString())}</p><h1>${passed ? 'Все тесты пройдены' : 'Проверки не завершились успешно'}</h1><p class="status">${data ? `Пройдено: ${data.numPassedTests} · Ошибок: ${data.numFailedTests} · Пропущено: ${data.numPendingTests}` : 'JSON-отчёт не получен.'}</p><p>Node.js ${escape(process.version)} · ${escape(process.platform)} · Код завершения: ${escape(result.status)}</p><pre>${escape(output)}</pre><p><a href="vitest.json">Исходный JSON</a> · <a href="test-output.txt">Вывод команды</a></p></main></html>`
await writeFile('reports/test-report.html', html)
try {
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.setContent(html)
  await page.screenshot({ path: 'reports/tests.png', fullPage: true })
  await browser.close()
} catch (error) {
  console.error(`Скриншот не создан. Выполните npx playwright install chromium. ${error.message}`)
  process.exitCode = 1
}
if (!passed) process.exitCode = result.status || 1
