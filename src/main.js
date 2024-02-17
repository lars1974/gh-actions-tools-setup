const core = require('@actions/core')
const { wait } = require('./wait')
const tc = require('@actions/tool-cache')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const ms = core.getInput('milliseconds', { required: true })

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Waiting ${ms} milliseconds ...`)

    // Log the current timestamp, wait, then log the new timestamp
    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    // Set outputs for other workflow steps to use
    core.setOutput('time', new Date().toTimeString())
    await downloadHelm()
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

async function downloadHelm() {
  const helmURL = 'https://get.helm.sh/helm-v3.14.1-linux-amd64.tar.gz'
  const helmPath = await tc.downloadTool(helmURL)
  const helmExtractedFolder = await tc.extractTar(helmPath, 'tools/helm/3.14.1')
  core.addPath(helmExtractedFolder)
}

module.exports = {
  run
}
