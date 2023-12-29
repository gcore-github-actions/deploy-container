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
jobs:
  deploy:
    name: deploy
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - id: deploy
        uses: gcore-github-actions/deploy-container@v1
        with:
          api_token: ${{ secrets.GCLOUD_API_TOKEN }}
          project: ${{ vars.GCLOUD_PROJECT }}
          region: ${{ vars.GCLOUD_REGION }}
          name: my-container
          image: nginx:latest

      - name: Use output
        run: curl "${{ steps.deploy.outputs.address }}"
```

> [!NOTE]
>
> This action runs using Node 20. If you are using self-hosted GitHub Actions runners, you must use a [runner version](https://github.com/actions/virtual-environments) that supports this version or newer.

## Inputs

## Outputs

* `address`: The endpoint address of your container.
* `status`:  The status of your container (e.g. Pending, Deploying, Ready, Error).
* `status-message`: The last message associated with current container status. Can be useful for troubleshooting deployment issues.

## Development

1. Install [act](https://github.com/nektos/act#installation)
1. Create a `.secrets` file with your `GCLOUD_API_TOKEN` value.
1. Create a `.vars` file with your `GCLOUD_API_URL`, `GCLOUD_PROJECT` and `GCLOUD_REGION` values.
1. Run `npm run local` after any change to test it using the `test-local-action` workflow.

> [!NOTE]
>
> Remember to call `npm run all` before committing your changes and pushing them to remote.

## Releasing

This project includes a helper script designed to streamline the process of
tagging and pushing new releases for GitHub Actions.

GitHub Actions allows users to select a specific version of the action to use,
based on release tags. Our script simplifies this process by performing the
following steps:

1. **Retrieving the latest release tag:** The script starts by fetching the most
   recent release tag by looking at the local data available in your repository.
1. **Prompting for a new release tag:** The user is then prompted to enter a new
   release tag. To assist with this, the script displays the latest release tag
   and provides a regular expression to validate the format of the new tag.
1. **Tagging the new release:** Once a valid new tag is entered, the script tags
   the new release.
1. **Pushing the new tag to the remote:** Finally, the script pushes the new tag
   to the remote repository. From here, you will need to create a new release in
   GitHub and users can easily reference the new tag in their workflows.
