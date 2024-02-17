const core = require('@actions/core')
const { wait } = require('./wait')
const tc = require('@actions/tool-cache')
const cache = require('@actions/cache')

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

    await Promise.all([downloadHelm(), downloadJava(), downloadMaven()])
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

async function downloadHelm() {
  await cache.restoreCache(['tools/helm/3.14.1'], 'helm-3.14.1-linux-amd64', [])
  if (
    (await cache.restoreCache(
      ['tools/helm/3.14.1'],
      'helm-3.14.1-linux-amd64',
      []
    )) === undefined
  ) {
    core.info('Cache not found, downloading helm')
    const helmURL = 'https://get.helm.sh/helm-v3.14.1-linux-amd64.tar.gz'
    const helmPath = await tc.downloadTool(helmURL)
    await tc.extractTar(helmPath, 'tools/helm/3.14.1')
    const cachedPath = await tc.cacheDir('tools/helm/3.14.1', 'helm', '3.14.1')
    await cache.saveCache(['tools/helm/3.14.1'], 'helm-3.14.1-linux-amd64')
    core.addPath(`${cachedPath}/linux-amd64`)
  } else {
    core.info('Cache found, using cached helm')
  }
}

async function downloadJava() {
  const url =
    'https://download.java.net/java/GA/jdk21.0.2/f2283984656d49d69e91c558476027ac/13/GPL/openjdk-21.0.2_linux-x64_bin.tar.gz'
  const path = await tc.downloadTool(url)
  const extractedFolder = await tc.extractTar(path, 'tools/java/21.0.2')
  const cachedPath = await tc.cacheDir(extractedFolder, 'java', '21.0.2')
  core.info('cache path: ' + cachedPath)
  core.addPath(`${cachedPath}/jdk-21.0.2/bin`)
  core.exportVariable('JAVA_HOME', `${cachedPath}/jdk-21.0.2/`)
}

async function downloadMaven() {
  const url =
    'https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz'
  const path = await tc.downloadTool(url)
  const extractedFolder = await tc.extractTar(path, 'tools/maven/3.9.6')
  const cachedPath = await tc.cacheDir(extractedFolder, 'maven', '3.9.6')
  core.addPath(`${cachedPath}/apache-maven-3.9.6/bin`)
}

module.exports = {
  run
}
