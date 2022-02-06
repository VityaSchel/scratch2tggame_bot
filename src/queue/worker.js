import '../../dotenv.js'
import _ from 'lodash'
import fetch from 'node-fetch'
import arrayToBuffer from 'arraybuffer-to-buffer'
import { addGame } from '../mtproto/botfather.js'
import { getAPI } from '../mtproto/setup.js'
import { close as closeTelegramMTProto } from '../mtproto/utils.js'
import { retrieveInfo, pack, saveGame } from '../packager.js'
import { init as initDB, insertToDB, isGameExists } from '../db.js'
import { checkLimits } from '../limits.js'
import Queue from 'bee-queue'
const queue = new Queue('games-converting')

queue.on('ready', () => {
  console.log('Worker is ready to process')
  queue.process((job) => {
    return new Promise(resolve => processJob(job).then(resolve).catch(e => resolve(e)))
  })
})

async function processJob(job) {
  console.log('Processing job in queue', job.id)
  const projectID = job.data.projectID

  if(await isGameExists(projectID)) throw  { code: 'scratchBot', botMessage: 'gameExists' }
  await checkLimits(job.data.userID)
  
  job.reportProgress({ status: 'retrieving' })

  const { projectFile, projectData } = await retrieveInfo(projectID)
  job.reportProgress({ status: 'processing' })

  let killTimer = setTimeout(() => { throw { code: 'scratchBot', botMessage: 'timeout' } }, 60000)
  const zip = await pack(projectFile)
  clearTimeout(killTimer)
  job.reportProgress({ status: 'uploading' })

  killTimer = setTimeout(() => { throw { code: 'scratchBot', botMessage: 'timeout' } }, 30000)
  await saveGame(projectID, zip)
  clearTimeout(killTimer)
  job.reportProgress({ status: 'botfather' })

  const { title, description, instructions, author, image } = projectData
  const projectImage = await fetch(image)
  const photoBuffer = arrayToBuffer(await projectImage.arrayBuffer())
  let gameAbout = `${instructions || ''}\n${description || ''}`
  if(gameAbout === '\n') gameAbout = `https://scratch.mit.edu/projects/${projectID}`
  const tgGame = {
    title: _.truncate(title, { length: 64 }),
    description: _.truncate(gameAbout, { length: 500 })
  }
  await addGame(projectID, tgGame.title, tgGame.description, photoBuffer)
  const gameTestQuery = {
    chat_id: -1001797137196,
    game_short_name: `id${projectID}`
  }
  const testResults = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendGame?${new URLSearchParams(gameTestQuery)}`)
  if(testResults.status !== 200) throw { code: 'scratchBot', botMessage: 'botFatherLimit' }
  
  const size = Buffer.byteLength(zip)
  await insertToDB(projectID, title, gameAbout, size, author.id, job.data.userID)
}

process.on('SIGINT', async () => {
  await dbClient.close()
  closeTelegramMTProto()
  await queue.close(0)
  process.exit(0)
})

await getAPI()
const dbClient = await initDB()