import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dateKey, isDate, normalizeTask, validateTask, validateProject, validateWorkspace, filterTasks, groupTasks, summarize, isOverdue } from '../src/shared/lib/taskModel.js'
import { DEFAULT_FILTERS, PROJECT_COLORS } from '../src/shared/config/constants.js'
const seed = JSON.parse(await readFile(new URL('../public/data/workspace.json', import.meta.url), 'utf8'))
const sample = seed.tasks[0]
test('the bundled workspace passes complete validation', () => assert.equal(validateWorkspace(seed), seed))
test('date keys use the local calendar', () => assert.equal(dateKey(new Date(2026, 0, 2, 23)), '2026-01-02'))
test('leap dates are validated rather than normalized silently', () => { assert.ok(isDate('2024-02-29')); assert.equal(isDate('2025-02-29'), false) })
test('invalid date strings are rejected', () => { for (const value of ['', '2026-13-01', '2026-04-31', '2026-1-2', null, 123]) assert.equal(isDate(value), false) })
test('normalization trims fields and removes duplicate tags', () => { const result = normalizeTask({ ...sample, title: '  Work  ', tags: ' one, two,one, ' }); assert.equal(result.title, 'Work'); assert.deepEqual(result.tags, ['one', 'two']) })
test('normalization does not mutate its input or copy arbitrary fields', () => { const before = structuredClone(sample); const result = normalizeTask(sample); assert.deepEqual(sample, before); assert.equal(result.createdAt, undefined) })
test('valid task has no validation errors', () => assert.deepEqual(validateTask(normalizeTask(sample), seed.projects), {}))
test('task errors identify every invalid field', () => { const result = validateTask({ title: '', description: 'x'.repeat(3001), projectId: 'missing', status: 'wrong', priority: 'wrong', dueDate: '2026-02-30', tags: Array(6).fill('x') }, seed.projects); assert.equal(Object.keys(result).length, 7) })
test('project name uniqueness is case-insensitive and excludes the edited project', () => { const project = seed.projects[0]; assert.equal(validateProject(project, seed.projects), null); assert.ok(validateProject({ name: project.name.toUpperCase(), color: PROJECT_COLORS[0] }, seed.projects)) })
test('project name and color boundaries are checked', () => { assert.ok(validateProject({ name: 'a', color: PROJECT_COLORS[0] })); assert.ok(validateProject({ name: 'valid', color: 'red' })) })
test('workspace rejects duplicate project identifiers', () => assert.throws(() => validateWorkspace({ ...seed, projects: [...seed.projects, seed.projects[0]] })))
test('workspace rejects duplicate task identifiers', () => assert.throws(() => validateWorkspace({ ...seed, tasks: [...seed.tasks, sample] })))
test('workspace rejects orphan tasks and invalid timestamps', () => { assert.throws(() => validateWorkspace({ ...seed, tasks: [{ ...sample, projectId: 'missing' }] })); assert.throws(() => validateWorkspace({ ...seed, tasks: [{ ...sample, updatedAt: 'bad' }] })) })
test('workspace rejects malformed outer data', () => { for (const value of [null, [], {}, { ...seed, version: 2 }]) assert.throws(() => validateWorkspace(value)) })
test('filters combine project, status, priority and search', () => { const result = filterTasks(seed.tasks, { ...DEFAULT_FILTERS, query: sample.title.toUpperCase(), status: sample.status, priority: sample.priority }, sample.projectId); assert.deepEqual(result, [sample]) })
test('search finds tags', () => { const item = seed.tasks.find(task => task.tags.length); assert.ok(filterTasks(seed.tasks, { ...DEFAULT_FILTERS, query: item.tags[0] }).some(task => task.id === item.id)) })
test('empty results remain empty', () => assert.deepEqual(filterTasks(seed.tasks, { ...DEFAULT_FILTERS, query: 'never-exists-3498' }), []))
test('sorting by deadline places missing deadlines last', () => { const result = filterTasks([{ ...sample, id: 'b', dueDate: '' }, { ...sample, id: 'a', dueDate: '2026-01-01' }], { ...DEFAULT_FILTERS, sort: 'due' }); assert.equal(result[0].id, 'a') })
test('priority sorting is high to low', () => { const result = filterTasks(['low', 'high', 'normal'].map(priority => ({ ...sample, id: priority, priority })), { ...DEFAULT_FILTERS, sort: 'priority' }); assert.deepEqual(result.map(task => task.priority), ['high', 'normal', 'low']) })
test('filtering leaves input untouched', () => { const before = structuredClone(seed.tasks); filterTasks(seed.tasks); assert.deepEqual(seed.tasks, before) })
test('grouping preserves every task exactly once', () => assert.equal(Object.values(groupTasks(seed.tasks)).flat().length, seed.tasks.length))
test('overdue excludes completed tasks and current-day deadlines', () => { assert.ok(isOverdue({ ...sample, status: 'todo', dueDate: '2026-01-01' }, '2026-01-02')); assert.equal(isOverdue({ ...sample, status: 'done', dueDate: '2026-01-01' }, '2026-01-02'), false); assert.equal(isOverdue({ ...sample, status: 'todo', dueDate: '2026-01-02' }, '2026-01-02'), false) })
test('analytics totals and project totals agree', () => { const result = summarize(seed.tasks, seed.projects, '2026-10-25'); assert.equal(result.todo + result.doing + result.done, result.total); assert.equal(result.projects.reduce((sum, project) => sum + project.total, 0), result.total) })
test('empty workspace analytics do not divide by zero', () => assert.deepEqual(summarize([], []), { total: 0, todo: 0, doing: 0, done: 0, overdue: 0, projects: [] }))
