import fetch from 'node-fetch'
import Packager from '@turbowarp/packager'
import _ from 'lodash'
import arrayToBuffer from 'arraybuffer-to-buffer'
import unzipper from 'unzipper'
import path from 'path'
const __dirname = new URL('.', import.meta.url).pathname

export async function retrieveInfo(projectID) {
  const projectDataResponse = await fetch(`https://api.scratch.mit.edu/projects/${projectID}`)
  if(projectDataResponse.status === 404) throw { code: 'scratchBot', botMessage: 'gameNotFound' }
  const projectData = await projectDataResponse.json()
  const projectFileResponse = await fetch(`https://projects.scratch.mit.edu/${projectID}`)
  const projectFile = await projectFileResponse.arrayBuffer()
  return { projectFile, projectData }
}

export async function pack(projectFile) {
  const loadedProject = await Packager.loadProject(projectFile, console.log)
  const packager = new Packager.Packager()
  packager.project = loadedProject
  _.merge(packager.options, {
    autoplay: true,
    username: 'scratch2tggame_bot',
    target: 'zip',
    custom: {
      js: ''
    },
    controls: {
      greenFlag: { enabled: false },
      stopAll: { enabled: false },
      fullscreen: { enabled: false },
      pause: { enabled: false },
    },
    cloudVariables: {
      mode: 'ws',
      cloudHost: 'wss://clouddata.turbowarp.org',
      custom: {},
      specialCloudBehaviors: false,
      unsafeCloudBehaviors: false,
    },
  })
  const result = await packager.package()
  return arrayToBuffer(result.data)
}

const scriptJsFileSize = 1024 * 1024 * 2.4
const gameMaxSize = 1024 * 1024 * 5
export async function saveGame(projectID, zip) {
  const projectZipBuffer = zip
  const filesize = Buffer.byteLength(projectZipBuffer)
  if(filesize - scriptJsFileSize > gameMaxSize) throw { code: 'scratchBot', botMessage: 'gameIsTooBig' }
  const gameZipBuffer = await unzipper.Open.buffer(projectZipBuffer)
  await gameZipBuffer.extract({ path: path.join(__dirname, `../website/${projectID}`) })
}
