/**
 * Unit tests for the action's gcore api client, src/gcore.ts
 */

import nock from 'nock'
import { GcoreClient } from '../src/gcore'

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

describe('gcore client', () => {
  let gcoreClient: GcoreClient

  beforeAll(() => {
    gcoreClient = new GcoreClient('https://example.com', '1', '7', 'a64b72')
  })

  it('can be created', async () => {
    expect(gcoreClient).toBeInstanceOf(GcoreClient)
    expect(gcoreClient.url).toEqual('https://example.com')
    expect(gcoreClient.projectId).toEqual('1')
    expect(gcoreClient.regionId).toEqual('7')
  })

  describe('get container', () => {
    it('returns an existing instance', async () => {
      nock('https://example.com').get('/v1/caas/1/7/containers/foo').reply(200, fakeContainer)
      await expect(gcoreClient.getContainer('foo')).resolves.toEqual(fakeContainer)
    })

    it('returns null for 404', async () => {
      nock('https://example.com').get('/v1/caas/1/7/containers/foo').reply(404)
      await expect(gcoreClient.getContainer('foo')).resolves.toBeNull()
    })

    it('fails on non-404 error', async () => {
      nock('https://example.com').get('/v1/caas/1/7/containers/foo').reply(500)
      await expect(gcoreClient.getContainer('foo')).rejects.toBeInstanceOf(Error)
    })
  })

  describe('create container', () => {
    const createParams = {
      name: 'foo',
      image: 'nginx:latest',
      listening_port: 80,
      timeout: 5,
      flavor: '250mCPU-512MB',
      scale: {
        min: 1,
        max: 1
      }
    }

    it('creates a new instance', async () => {
      nock('https://example.com')
        .post('/v1/caas/1/7/containers', createParams)
        .reply(200, { tasks: ['e35dc24f'] })
        .get('/v1/tasks/e35dc24f')
        .reply(200, { state: 'RUNNING' })
        .get('/v1/tasks/e35dc24f')
        .reply(200, { state: 'FINISHED' })
        .get('/v1/caas/1/7/containers/foo')
        .reply(200, fakeContainer)
      await expect(gcoreClient.createContainer(createParams)).resolves.toEqual(fakeContainer)
    })

    it('fails on create error', async () => {
      nock('https://example.com').post('/v1/caas/1/7/containers', createParams).reply(500)
      await expect(gcoreClient.createContainer(createParams)).rejects.toBeInstanceOf(Error)
    })

    it('fails on task error', async () => {
      nock('https://example.com')
        .post('/v1/caas/1/7/containers', createParams)
        .reply(200, { tasks: ['e35dc24f'] })
        .get('/v1/tasks/e35dc24f')
        .reply(200, { state: 'ERROR', error: 'task failed' })
      await expect(gcoreClient.createContainer(createParams)).rejects.toBeInstanceOf(Error)
    })
  })

  describe('update container', () => {
    const updateParams = {
      image: 'nginx:latest'
    }

    it('updates an existing instance', async () => {
      nock('https://example.com')
        .patch('/v1/caas/1/7/containers/foo', updateParams)
        .reply(200, { tasks: ['e35dc24f'] })
        .get('/v1/tasks/e35dc24f')
        .reply(200, { state: 'RUNNING' })
        .get('/v1/tasks/e35dc24f')
        .reply(200, { state: 'FINISHED' })
        .get('/v1/caas/1/7/containers/foo')
        .reply(200, fakeContainer)
      await expect(gcoreClient.updateContainer('foo', updateParams)).resolves.toEqual(fakeContainer)
    })

    it('fails on update error', async () => {
      nock('https://example.com').patch('/v1/caas/1/7/containers/foo', updateParams).reply(500)
      await expect(gcoreClient.updateContainer('foo', updateParams)).rejects.toBeInstanceOf(Error)
    })

    it('fails on task error', async () => {
      nock('https://example.com')
        .patch('/v1/caas/1/7/containers/foo', updateParams)
        .reply(200, { tasks: ['e35dc24f'] })
        .get('/v1/tasks/e35dc24f')
        .reply(200, { state: 'ERROR', error: 'task failed' })
      await expect(gcoreClient.updateContainer('foo', updateParams)).rejects.toBeInstanceOf(Error)
    })
  })
})
