import * as httpm from '@actions/http-client'
import * as httpifm from '@actions/http-client/lib/interfaces'

export interface Container {
  name?: string
  image?: string
  listening_port?: number
  description?: string
  envs?: { [key: string]: string }
  timeout?: number
  flavor?: string
  scale?: ContainerScale
  is_disabled?: boolean
  is_api_key_auth?: boolean
  pull_secret?: string
  status?: string
  status_message?: string
  namespace?: string
  address?: string
  deploy_status?: DeployStatus
}

export interface ContainerScale {
  min: number
  max: number
}

export interface DeployStatus {
  total: number
  ready: number
}

interface Task {
  id: string
  state: string
  error?: string
}

interface Tasks {
  tasks: string[]
}

export class GcoreClient {
  url: string
  projectId: string
  regionId: string
  httpClient: httpm.HttpClient

  constructor(url: string, projectId: string, regionId: string, token: string) {
    this.url = url
    this.projectId = projectId
    this.regionId = regionId
    this.httpClient = new httpm.HttpClient(
      `gcore-github-actions:deploy-container`,
      [new ApiTokenCredentialHandler(token)],
      {
        socketTimeout: 1000,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )
  }

  private containersUrl = (name?: string): string => {
    return `${this.url}/v1/caas/${this.projectId}/${this.regionId}/containers${name ? `/${name}` : ''}`
  }

  private tasksUrl = (id?: string): string => `${this.url}/v1/tasks${id ? `/${id}` : ''}`

  async getContainer(name: string): Promise<Container | null> {
    const response = await this.httpClient.getJson<Container>(this.containersUrl(name))
    return response.result
  }

  async createContainer(params: Container): Promise<Container | null> {
    const response = await this.httpClient.postJson<Tasks>(this.containersUrl(), params)
    const task = response.result?.tasks.pop()
    await this.waitForTask(task ?? '')
    return await this.getContainer(params.name ?? '')
  }

  async updateContainer(name: string, params: Container): Promise<Container | null> {
    const response = await this.httpClient.patchJson<Tasks>(this.containersUrl(name), params)
    const task = response.result?.tasks.pop()
    await this.waitForTask(task ?? '')
    return await this.getContainer(name)
  }

  private async waitForTask(id: string): Promise<void> {
    for (;;) {
      const response = await this.httpClient.getJson<Task>(this.tasksUrl(id))
      const task = response.result
      if (!task) {
        throw new Error(`cannot find task with id: ${id}`)
      }
      if (task?.state === 'FINISHED') {
        return
      } else if (task?.state === 'ERROR' || task?.error) {
        throw new Error(`task is in error state: ${task?.error}`)
      }
      await this.sleep(2000)
    }
  }

  private async sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}

class ApiTokenCredentialHandler implements httpifm.RequestHandler {
  token: string

  constructor(token: string) {
    this.token = token
  }

  prepareRequest(options: httpifm.RequestOptions): void {
    if (!options.headers) {
      throw Error('The request has no headers')
    }
    options.headers['Authorization'] = `APIKey ${this.token}`
  }

  canHandleAuthentication(): boolean {
    return false
  }

  async handleAuthentication(): Promise<httpm.HttpClientResponse> {
    return Promise.reject(new Error('not implemented'))
  }
}
