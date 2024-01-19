# deploy-container

[![GitHub Super-Linter](https://github.com/gcore-github-actions/deploy-container/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/gcore-github-actions/deploy-container/actions/workflows/ci.yml/badge.svg)
[![Check dist](https://github.com/gcore-github-actions/deploy-container/actions/workflows/check-dist.yml/badge.svg)](https://github.com/gcore-github-actions/deploy-container/actions/workflows/check-dist.yml)
[![CodeQL](https://github.com/gcore-github-actions/deploy-container/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/gcore-github-actions/deploy-container/actions/workflows/codeql-analysis.yml)
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

The `deploy-container` GitHub Action deploys a container image to Gcore Container as a Service (CaaS). The container status and endpoint address are available as GitHub Action outputs for use in future steps.

## Usage

> [!IMPORTANT]
>
> A Gcore [permanent API token](https://gcore.com/docs/account-settings/create-use-or-delete-a-permanent-api-token) is required to authorize access to the Gcore API.

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    name: deploy
    runs-on: ubuntu-latest

    steps:
      - id: deploy
        uses: gcore-github-actions/deploy-container@v1
        with:
          api-token: ${{ secrets.GCLOUD_API_TOKEN }}
          project-id: ${{ vars.GCLOUD_PROJECT }}
          region-id: ${{ vars.GCLOUD_REGION }}
          name: my-container
          image: nginx:latest

      - name: Use output
        run: echo "${{ steps.deploy.outputs.address }}"
```

> [!NOTE]
>
> This action runs using Node 20. If you are using self-hosted GitHub Actions runners, you must use a [runner version](https://github.com/actions/runner) that supports this version or newer.

## Inputs

- `api-token` - (required) A permanent API token that will authenticate the GitHub action to Gcore API.
- `project-id` - (required) The ID of the Gcore project in which the container should be deployed.
- `region-id` - (required) The ID of the region in which the container should be deployed.
- `name` - (required) The name of the container to deploy.
- `image` - (required) The name of the container image to deploy (e.g. docker.io/nginx:latest).
- `listening-port` - (optional) The port on which the container will be listening for network connections. The default value is `80`.
- `description` - (optional) A custom description of the container.
- `envs` - (optional) List of newline-separated key-value pairs to set as environment variables.

   ```yaml
    with:
      envs: |
        FOO=bar
        BAZ=biz
    ```

- `flavor` - (optional) The container flavor determining the amount of memory and cpu allocated to each container instance. The default value is `80mCPU-128MB`.
- `timeout` - (optional) The duration in seconds to wait before scaling down container instances. The default value is `60`.
- `scale-min` - (optional) The minimum number of instances to run. When set to `0`, the container will scale down to zero running instances when it receives no traffic for the duration of `timeout`. The default value is `1`.
- `scale-max` - (optional) The maximum number of instances to run. The value must be greater than or equal to scale-min. The default value is `1`.
- `is-disabled` - (optional) When set to `true`, the container is disabled and any running instances are shut down. The default value is `false`.
- `is-api-key-auth` - (optional) When set to `true`, enables API key authentication for the container endpoint address. API keys can be created and assigned to the container in Gcore dashboard. The default value is `false`.
- `pull-secret` - (optional) The name of the private registry credentials to use when fetching the container image. The credentials must already be configured in Gcore dashboard.

## Outputs

- `address`: The endpoint address of your container.
- `status`:  The status of your container (e.g. Pending, Deploying, Ready, Error).
- `status-message`: The last message associated with current container status. Can be useful for troubleshooting deployment issues.

## Development

1. Install [act](https://github.com/nektos/act#installation)
1. Create a `.secrets` file with your `GCLOUD_API_TOKEN` value.
1. Create a `.vars` file with your `GCLOUD_API_URL`, `GCLOUD_PROJECT` and `GCLOUD_REGION` values.
1. Run `npm run local` after any change to test it using the `test-local-action` workflow.

> [!NOTE]
>
> Remember to call `npm run all` before committing your changes and pushing them to remote.

## Releasing

1. Run the `./script/release` script to create and push a new tag.
1. A workflow will run and generate a new draft release for you based on the tag you entered.
1. Open the [Releases](https://github.com/gcore-github-actions/deploy-container/releases) page and go to the draft release.
1. Make sure the `Publish this release to the GitHub Marketplace` checkbox is checked and changelog is correct.
1. Publish the new release.
1. Move the major version tag (e.g. v1) to the latest patch release.
