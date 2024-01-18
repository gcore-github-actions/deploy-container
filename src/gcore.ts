import * as core from '@actions/core'
import * as httpm from '@actions/http-client'
import { ApiTokenCredentialHandler } from './auth'

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
    core.debug(`Get container ${name}`)
    const response = await this.httpClient.getJson<Container>(this.containersUrl(name))
    return response.result
  }

  async createContainer(params: Container): Promise<Container | null> {
    core.debug(`Create container ${params.name} with params: ${JSON.stringify(params)}`)
    const response = await this.httpClient.post(this.containersUrl(), JSON.stringify(params))
    const result = await this.parseResponse<Tasks>(response)
    const task_id = result.tasks.pop()
    if (!task_id) {
      throw new Error(`could not find task id in response`)
    }
    await this.waitForTask(task_id ?? '')
    return await this.getContainer(params.name ?? '')
  }

  async updateContainer(name: string, params: Container): Promise<Container | null> {
    core.debug(`Update container ${name} with params: ${JSON.stringify(params)}`)
    const response = await this.httpClient.patch(this.containersUrl(name), JSON.stringify(params))
    const result = await this.parseResponse<Tasks>(response)
    const task_id = result.tasks.pop()
    if (!task_id) {
      throw new Error(`could not find task id in response`)
    }
    await this.waitForTask(task_id ?? '')
    return await this.getContainer(name)
  }

  private async waitForTask(id: string): Promise<void> {
    core.debug(`Waiting for task ${id}`)
    for (;;) {
      const response = await this.httpClient.get(this.tasksUrl(id))
      const task = await this.parseResponse<Task>(response)
      if (task.state === 'FINISHED') {
        return
      } else if (task.state === 'ERROR' || task.error) {
        throw new Error(`task is in error state: ${task.error}`)
      }
      await this.sleep(2000)
    }
  }

  private async parseResponse<Type>(response: httpm.HttpClientResponse): Promise<Type> {
    const body = await response.readBody()
    const statusCode = response.message.statusCode ?? 0
    if (statusCode >= 400) {
      const error = JSON.parse(body)
      throw new Error(`request failed with ${response.message.statusCode}: ${error.message}`)
    }
    return JSON.parse(body) as Type
  }

  private async sleep(milliseconds: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
}
