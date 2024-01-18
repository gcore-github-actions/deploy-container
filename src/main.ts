import * as core from '@actions/core'
import { Container, GcoreClient } from './gcore'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const apiUrl = core.getInput('api-url')
    const apiToken = core.getInput('api-token')
    const projectId = core.getInput('project-id')
    const regionId = core.getInput('region-id')
    const name = core.getInput('name')
    const image = core.getInput('image')
    const listeningPort = core.getInput('listening-port')
    const description = core.getInput('description')
    const envs = core.getInput('envs')
    const timeout = core.getInput('timeout')
    const flavor = core.getInput('flavor')
    const scaleMin = core.getInput('scale-min')
    const scaleMax = core.getInput('scale-max')
    const isDisabled = core.getInput('is-disabled')
    const isApiKeyAuth = core.getInput('is-api-key-auth')
    const pullSecret = core.getInput('pull-secret')

    // params required by the Gcore API
    const params: Container = {
      image,
      listening_port: parseInt(listeningPort),
      timeout: parseInt(timeout),
      flavor,
      scale: {
        min: parseInt(scaleMin),
        max: parseInt(scaleMax)
      }
    }

    if (description) {
      params.description = description
    }

    if (envs) {
      params.envs = parseEnvList(envs)
    }

    if (isDisabled) {
      params.is_disabled = core.getBooleanInput('is-disabled')
    }

    if (isApiKeyAuth) {
      params.is_api_key_auth = core.getBooleanInput('is-api-key-auth')
    }

    if (pullSecret) {
      params.pull_secret = pullSecret
    }

    const client = new GcoreClient(apiUrl, projectId, regionId, apiToken)
    core.info(`Checking if container ${name} exists`)
    let response = await client.getContainer(name)
    if (response) {
      core.info(`Updating container ${name}`)
      response = await client.updateContainer(name, params)
    } else {
      core.info(`Creating container ${name}`)
      params.name = name
      response = await client.createContainer(params)
    }
    core.info(`Done`)

    core.setOutput('address', response?.address)
    core.setOutput('status', response?.status)
    core.setOutput('status-message', response?.status_message)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function parseEnvList(envs: string): { [key: string]: string } {
  const result: { [key: string]: string } = {}
  for (const pair of envs.split('\n')) {
    const [key, val] = pair.split('=')
    result[key.trim()] = val.trim()
  }
  return result
}
