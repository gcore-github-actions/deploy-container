/**
 * Unit tests for the action's custom credential handler, src/auth.ts
 */

import * as httpifm from '@actions/http-client/lib/interfaces'
import { ApiTokenCredentialHandler } from '../src/auth'

describe('api token credential handler', () => {
  let handler: ApiTokenCredentialHandler

  beforeEach(() => {
    handler = new ApiTokenCredentialHandler('a64b72')
  })

  it('can be created', () => {
    expect(handler).toBeInstanceOf(ApiTokenCredentialHandler)
    expect(handler.token).toEqual('a64b72')
  })

  it('throws when authorization header cannot be added (pre-auth)', () => {
    expect(() => handler.prepareRequest({})).toThrow()
  })

  it('adds authorization header to requests (pre-auth)', () => {
    const options: httpifm.RequestOptions = { headers: {} }
    handler.prepareRequest(options)
    expect(options.headers?.authorization).toEqual('APIKey a64b72')
  })

  it('rejects 401 auth requests', async () => {
    expect(handler.canHandleAuthentication()).toBe(false)
    await expect(handler.handleAuthentication).rejects.toBeInstanceOf(Error)
  })
})
