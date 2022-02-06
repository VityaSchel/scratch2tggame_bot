import '../../dotenv.js'
import _ from 'lodash'
import fetch from 'node-fetch'
import arrayToBuffer from 'arraybuffer-to-buffer'
import { addGame } from './src/mtproto/botfather.js'
import { getAPI } from './src/mtproto/setup.js'
import { close as closeTelegramMTProto } from './src/mtproto/utils.js'
import { retrieveInfo, pack, saveGame } from './src/packager.js'
import { init as initDB, insertToDB, isGameExists } from './src/db.js'
import { checkLimits } from './src/limits.js'
import Queue from 'bee-queue'
const queue = new Queue('games-converting')

await getAPI()
const dbClient = await initDB()

queue.on('ready', () => {
  queue.process(async (job) => {
    console.log('Processing job in queue', job.id)
    const projectID = job.data.projectID

    if(await isGameExists(projectID)) throw  { code: 'scratchBot', botMessage: 'gameExists' }
    await checkLimits(job.data.userID)
    
    job.reportProgress({ status: 'retrieving' })

    const { projectFile, projectData } = await retrieveInfo(projectID)
    job.reportProgress({ status: 'processing' })

    const zip = await pack(projectFile)
    job.reportProgress({ status: 'uploading' })

    await saveGame(projectID, zip)
    job.reportProgress({ status: 'botfather' })

    const { title, description, instructions, author, image } = projectData
    const projectImage = await fetch(image)
    const photoBuffer = arrayToBuffer(await projectImage.arrayBuffer())
    const gameAbout = `${instructions}\n${description}`
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
    return true
  })
})

process.on('SIGINT', async () => {
  await dbClient.close()
  closeTelegramMTProto()
  process.exit(0)
})