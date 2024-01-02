import * as httpm from '@actions/http-client'
import * as httpifm from '@actions/http-client/lib/interfaces'

export class ApiTokenCredentialHandler implements httpifm.RequestHandler {
  token: string

  constructor(token: string) {
    this.token = token
  }

  prepareRequest(options: httpifm.RequestOptions): void {
    if (!options.headers) {
      throw Error('The request has no headers')
    }
    options.headers.authorization = `APIKey ${this.token}`
  }

  canHandleAuthentication(): boolean {
    return false
  }

  async handleAuthentication(): Promise<httpm.HttpClientResponse> {
    return Promise.reject(new Error('not implemented'))
  }
}
