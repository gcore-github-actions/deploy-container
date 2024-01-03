/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import * as core from '@actions/core'
import * as main from '../src/main'
import { GcoreClient } from '../src/gcore'

jest.mock('../src/gcore')
const gcoreClientMock = jest.mocked(GcoreClient)

const fakeInputs: { [key: string]: string } = {
  'api-url': 'https://api.gcore.com/cloud',
  'api-token': 'a64b72',
  'project-id': '1',
  'region-id': '7',
  name: 'foo',
  image: 'nginx:latest',
  'listening-port': '80',
  description: '',
  envs: '',
  timeout: '5',
  flavor: '250mCPU-512MB',
  'scale-min': '1',
  'scale-max': '1',
  'is-disabled': '',
  'is-api-key-auth': '',
  'pull-secret': ''
}

const fakeContainer = {
  name: 'foo',
  image: 'nginx:latest',
  listening_port: 80,
  description: '',
  envs: {},
  timeout: 5,
  flavor: '250mCPU-512MB',
  scale: {
    min: 1,
    max: 1
  },
  is_disabled: false,
  is_api_key_auth: false,
  pull_secret: '',
  status: 'Ready',
  status_message: '',
  namespace: '7-1',
  address: 'https://foo-7-1.example.com',
  created_at: '2024-01-01T00:00:00Z',
  deploy_status: {
    total: 1,
    ready: 1
  }
}

describe('action', () => {
  let setFailedMock: jest.SpyInstance
  let setOutputMock: jest.SpyInstance

  beforeEach(() => {
    clearInputValues()
    jest.clearAllMocks()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
  })

  it('configures gcore client', async () => {
    setInputValues()
    await main.run()
    expect(GcoreClient).toHaveBeenCalledWith('https://api.gcore.com/cloud', '1', '7', 'a64b72')
  })

  describe('deploy new container', () => {
    beforeEach(() => {
      gcoreClientMock.prototype.getContainer.mockReturnValue(Promise.resolve(null))
      gcoreClientMock.prototype.createContainer.mockReturnValue(Promise.resolve(fakeContainer))
    })

    it('calls create with required inputs', async () => {
      setInputValues()
      await main.run()

      expect(gcoreClientMock.mock.instances[0].getContainer).toHaveBeenCalled()
      expect(gcoreClientMock.mock.instances[0].createContainer).toHaveBeenCalledWith({
        name: 'foo',
        image: 'nginx:latest',
        listening_port: 80,
        flavor: '250mCPU-512MB',
        scale: {
          min: 1,
          max: 1
        },
        timeout: 5
      })

      expect(setOutputMock).toHaveBeenNthCalledWith(1, 'address', 'https://foo-7-1.example.com')
      expect(setOutputMock).toHaveBeenNthCalledWith(2, 'status', 'Ready')
      expect(setOutputMock).toHaveBeenNthCalledWith(3, 'status-message', '')
      expect(setFailedMock).not.toHaveBeenCalled()
    })

    it('sets optional description', async () => {
      setInputValues({ description: 'bar' })
      await main.run()
      const createContainerMock = (gcoreClientMock.mock.instances[0].createContainer as jest.Mock).mock
      expect(createContainerMock.calls[0][0]).toHaveProperty('description', 'bar')
    })

    it('sets optional envs', async () => {
      setInputValues({ envs: 'FOO=BAR\nBAZ=42' })
      await main.run()
      const createContainerMock = (gcoreClientMock.mock.instances[0].createContainer as jest.Mock).mock
      expect(createContainerMock.calls[0][0]).toHaveProperty('envs', { FOO: 'BAR', BAZ: '42' })
    })

    it('sets optional is_disabled', async () => {
      setInputValues({ 'is-disabled': 'true' })
      await main.run()
      const createContainerMock = (gcoreClientMock.mock.instances[0].createContainer as jest.Mock).mock
      expect(createContainerMock.calls[0][0]).toHaveProperty('is_disabled', true)
    })

    it('sets optional is_api_key_auth', async () => {
      setInputValues({ 'is-api-key-auth': 'true' })
      await main.run()
      const createContainerMock = (gcoreClientMock.mock.instances[0].createContainer as jest.Mock).mock
      expect(createContainerMock.calls[0][0]).toHaveProperty('is_api_key_auth', true)
    })

    it('sets optional pull_secret', async () => {
      setInputValues({ 'pull-secret': 'foo' })
      await main.run()
      const createContainerMock = (gcoreClientMock.mock.instances[0].createContainer as jest.Mock).mock
      expect(createContainerMock.calls[0][0]).toHaveProperty('pull_secret', 'foo')
    })

    it('throws error when create fails', async () => {
      setInputValues()
      gcoreClientMock.prototype.createContainer.mockReturnValue(Promise.reject(new Error('fubar')))
      await main.run()
      expect(setFailedMock).toHaveBeenCalledWith('fubar')
    })
  })

  describe('update existing container', () => {
    beforeEach(() => {
      gcoreClientMock.prototype.getContainer.mockReturnValue(Promise.resolve(fakeContainer))
      gcoreClientMock.prototype.updateContainer.mockReturnValue(Promise.resolve(fakeContainer))
    })

    it('calls update with required inputs', async () => {
      setInputValues()
      await main.run()

      expect(gcoreClientMock.mock.instances[0].getContainer).toHaveBeenCalled()
      expect(gcoreClientMock.mock.instances[0].updateContainer).toHaveBeenCalledWith('foo', {
        image: 'nginx:latest',
        listening_port: 80,
        flavor: '250mCPU-512MB',
        scale: {
          min: 1,
          max: 1
        },
        timeout: 5
      })

      expect(setOutputMock).toHaveBeenNthCalledWith(1, 'address', 'https://foo-7-1.example.com')
      expect(setOutputMock).toHaveBeenNthCalledWith(2, 'status', 'Ready')
      expect(setOutputMock).toHaveBeenNthCalledWith(3, 'status-message', '')
      expect(setFailedMock).not.toHaveBeenCalled()
    })

    it('sets optional description', async () => {
      setInputValues({ description: 'bar' })
      await main.run()
      const updateContainerMock = (gcoreClientMock.mock.instances[0].updateContainer as jest.Mock).mock
      expect(updateContainerMock.calls[0][1]).toHaveProperty('description', 'bar')
    })

    it('sets optional envs', async () => {
      setInputValues({ envs: 'FOO=BAR\nBAZ=42' })
      await main.run()
      const updateContainerMock = (gcoreClientMock.mock.instances[0].updateContainer as jest.Mock).mock
      expect(updateContainerMock.calls[0][1]).toHaveProperty('envs', { FOO: 'BAR', BAZ: '42' })
    })

    it('sets optional is_disabled', async () => {
      setInputValues({ 'is-disabled': 'true' })
      await main.run()
      const updateContainerMock = (gcoreClientMock.mock.instances[0].updateContainer as jest.Mock).mock
      expect(updateContainerMock.calls[0][1]).toHaveProperty('is_disabled', true)
    })

    it('sets optional is_api_key_auth', async () => {
      setInputValues({ 'is-api-key-auth': 'true' })
      await main.run()
      const updateContainerMock = (gcoreClientMock.mock.instances[0].updateContainer as jest.Mock).mock
      expect(updateContainerMock.calls[0][1]).toHaveProperty('is_api_key_auth', true)
    })

    it('sets optional pull_secret', async () => {
      setInputValues({ 'pull-secret': 'foo' })
      await main.run()
      const updateContainerMock = (gcoreClientMock.mock.instances[0].updateContainer as jest.Mock).mock
      expect(updateContainerMock.calls[0][1]).toHaveProperty('pull_secret', 'foo')
    })

    it('throws error when update fails', async () => {
      setInputValues()
      gcoreClientMock.prototype.updateContainer.mockReturnValue(Promise.reject(new Error('fubar')))
      await main.run()
      expect(setFailedMock).toHaveBeenCalledWith('fubar')
    })
  })
})

function setInputValues(overrides?: { [key: string]: string }): void {
  const inputs = Object.assign({}, fakeInputs, overrides)
  for (const key in inputs) {
    process.env[`INPUT_${key.toUpperCase()}`] = inputs[key]
  }
}

function clearInputValues(): void {
  for (const key in process.env) {
    if (key.startsWith('INPUT_')) {
      delete process.env[key]
    }
  }
}
