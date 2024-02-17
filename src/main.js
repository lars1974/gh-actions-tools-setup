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
    const methodCalls = []

    for (const param of tools()) {
      methodCalls.push(downloadTool(param))
    }
    await Promise.all(methodCalls)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

function tools() {
  return [
    {
      name: 'helm',
      version: '3.14.1',
      url: 'https://get.helm.sh/helm-v3.14.1-linux-amd64.tar.gz',
      pathToExecutable: 'linux-amd64',
      verify: 'helm version'
    },
    {
      name: 'java',
      version: '21.0.2',
      url: 'https://download.java.net/java/GA/jdk21.0.2/f2283984656d49d69e91c558476027ac/13/GPL/openjdk-21.0.2_linux-x64_bin.tar.gz',
      pathToExecutable: 'jdk-21.0.2/bin',
      verify: 'java -version',
      environmentVariable: 'JAVA_HOME=CACHED_PATH/jdk-21.0.2/'
    },
    {
      name: 'maven',
      version: '3.9.6',
      url: 'https://dlcdn.apache.org/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz',
      pathToExecutable: 'apache-maven-3.9.6/bin',
      verify: 'mvn -version'
    }
  ]
}

async function downloadTool(tool) {
  const path = `tools/${tool.name}/${tool.version}`
  if ((await cache.restoreCache([path], tool.url, [])) === undefined) {
    await tc.extractTar(await tc.downloadTool(tool.url), path)
    await cache.saveCache([path], tool.url)
  }
  core.info('hmm1')
  const cachedPath = await tc.cacheDir(path, tool.name, tool.version)
  core.info('hmm2')
  core.addPath(`${cachedPath}/${tool.pathToExecutable}`)
  core.info('hmm3')
  if (tool.environmentVariable) {
    core.info(`hmm4 tool.environmentVariable: ${tool.environmentVariable}`)
    const env = tool.environmentVariable.replace('CACHED_PATH', cachedPath)

    core.exportVariable(env.split('=')[0], env.split('=')[1])
    core.info(
      `hmm5${tool.environmentVariable.split('=')[0]}${tool.environmentVariable.split('=')[1]}`
    )
  }
  core.info('hmm6')
  //await tool.exec(tool.verify)
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

  core.info(`cache path: ${cachedPath}`)
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
