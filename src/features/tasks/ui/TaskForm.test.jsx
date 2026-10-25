import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { createAppStore } from '../../../app/store.js'
import { loadWorkspace } from '../../workspace/model/loadWorkspace.js'
import { workspaceApi } from '../../../services/api/workspaceApi.js'
import seed from '../../../../public/data/workspace.json'
import TaskForm from './TaskForm.jsx'
vi.mock('../../../services/api/workspaceApi.js', () => ({ workspaceApi: { load: vi.fn(), saveTask: vi.fn() } }))
beforeEach(() => {
  vi.resetAllMocks()
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open') }
  workspaceApi.load.mockResolvedValue(structuredClone(seed))
})
const setup = async () => { const store = createAppStore(); await store.dispatch(loadWorkspace()); const onClose = vi.fn(); render(<Provider store={store}><TaskForm onClose={onClose} /></Provider>); return { user: userEvent.setup(), onClose } }
it('displays field validation without sending invalid data', async () => { const { user } = await setup(); await user.click(screen.getByRole('button', { name: 'Сохранить задачу' })); expect(screen.getByText('Название: от 3 до 100 символов.')).toBeInTheDocument(); expect(workspaceApi.saveTask).not.toHaveBeenCalled() })
it('submits a normalized valid task and closes after success', async () => { const { user, onClose } = await setup(); workspaceApi.saveTask.mockImplementation(async value => ({ ...value, id: 'new-task', createdAt: '2026-10-25T00:00:00Z', updatedAt: '2026-10-25T00:00:00Z' })); await user.type(screen.getByLabelText('Название задачи'), '  New task  '); await user.click(screen.getByRole('button', { name: 'Сохранить задачу' })); expect(await screen.findByRole('dialog')).toBeInTheDocument(); expect(onClose).toHaveBeenCalledOnce(); expect(workspaceApi.saveTask.mock.calls[0][0].title).toBe('New task') })
it('keeps the form open when the API fails', async () => { const { user, onClose } = await setup(); workspaceApi.saveTask.mockRejectedValue(new Error('No connection')); await user.type(screen.getByLabelText('Название задачи'), 'New task'); await user.click(screen.getByRole('button', { name: 'Сохранить задачу' })); expect(await screen.findByRole('alert')).toHaveTextContent('No connection'); expect(onClose).not.toHaveBeenCalled() })
