const core = require('@actions/core')
const { wait } = require('./wait')
const tc = require('@actions/tool-cache')
const cache = require('@actions/cache')
const exec = require('@actions/exec')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    const methodCalls = []

    for (const param of tools()) {
      // methodCalls.push(downloadTool(param))
    }
    //methodCalls.push(installHelm())
    methodCalls.push(installSSH())
    await Promise.all(methodCalls)
  } catch (error) {
    // Fail the workflow run if an error occurs
    core.setFailed(error.message)
  }
}

function tools() {
  return [
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

async function installHelm() {
  const version = '3.6.3'
  const path = `tools/helm/${version}`
  const pluginPath = `tools/helm/${version}/plugins`
  const url = `https://get.helm.sh/helm-v${version}-linux-amd64.tar.gz`
  const pathToExecutable = 'linux-amd64'
  const pluginUrl =
    'https://github.com/databus23/helm-diff/releases/download/v3.9.4/helm-diff-linux-amd64.tgz'

  if ((await cache.restoreCache([path], path, [])) === undefined) {
    await tc.extractTar(await tc.downloadTool(url), path)
    await tc.extractTar(await tc.downloadTool(pluginUrl), pluginPath)
    await cache.saveCache([path], path)
  }

  const cachedPath = await tc.cacheDir(path, 'helm', version)
  core.addPath(`${cachedPath}/${pathToExecutable}`)
  core.exportVariable('HELM_PLUGINS', `${cachedPath}/plugins`)
}

async function installSSH() {
  const version = '9.6'
  const name = 'openssh'

  const path = 'tools/${name}/${version}'
  if ((await cache.restoreCache([path], path, [])) === undefined) {
    await tc.extractTar(
      await tc.downloadTool(
        'https://ftp.openbsd.org/pub/OpenBSD/OpenSSH/openssh-9.6.tar.gz'
      ),
      path
    )
    await cache.saveCache([path], path)
  }

  await exec.exec("${path}/ssh/make obj")
  await exec.exec("${path}/ssh/make cleandir")
  await exec.exec("${path}/ssh/make depend")

  await exec.exec("${path}/ssh/make")
  await exec.exec("${path}/ssh/make install")
  core.addPath('${path}/ssh')
}

async function downloadTool(tool) {
  const path = `tools/${tool.name}/${tool.version}`
  if ((await cache.restoreCache([path], tool.url, [])) === undefined) {
    await tc.extractTar(await tc.downloadTool(tool.url), path)
    await cache.saveCache([path], tool.url)
  }
  const cachedPath = await tc.cacheDir(path, tool.name, tool.version)
  core.addPath(`${cachedPath}/${tool.pathToExecutable}`)
  if (tool.environmentVariable) {
    const env = tool.environmentVariable.replace('CACHED_PATH', cachedPath)
    core.exportVariable(env.split('=')[0], env.split('=')[1])
  }
}

module.exports = {
  run
}
