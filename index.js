import 'dotenv/config'
import _ from 'lodash'
    import ngrok from 'ngrok'
import fastify from 'fastify'
import fetch from 'node-fetch'
import TelegramBot from 'node-telegram-bot-api'
import arrayToBuffer from 'arraybuffer-to-buffer'
import localization from './src/localization.js'
import { addGame } from './src/mtproto/botfather.js'
import { getAPI } from './src/mtproto/setup.js'
import { close as closeTelegramMTProto } from './src/mtproto/utils.js'
import { retrieveInfo, pack, saveGame } from './src/packager.js'
import { init as initDB, insertToDB, queryGame, isGameExists } from './src/db.js'
import { checkLimits } from './src/limits.js'

const TOKEN = process.env.TELEGRAM_TOKEN
let url = 'https://scratch2tggame.utidteam.com'
const port = 9223

const bot = new TelegramBot(TOKEN)
const app = fastify()
await getAPI()
const dbClient = await initDB()

const ngrokurl = await ngrok.connect({ addr: port, authtoken: process.env.NGROK })
console.log(ngrokurl)
url = ngrokurl

bot.setWebHook(`${url}/bot${TOKEN}`)

const translate = (language, key) => _.get((localization[language] ?? localization.default), key)
const send = async (msg, textKey, options = {}) => {
  return await bot.sendMessage(msg.chat.id, translate(msg.from.language_code, textKey), _.merge({ parse_mode: 'HTML' }, options))
}
const update = async (updateID, originalMsg, textKey, options = {}) => {
  return await bot.editMessageText(
    translate(originalMsg.from.language_code, textKey),
    _.merge({ chat_id: originalMsg.chat.id, message_id: updateID, parse_mode: 'HTML' }, options)
  )
}

bot.onText(/^\/(start|help)/, msg => send(msg, 'greetings', { disable_web_page_preview: true }))
bot.onText(/^\/info/, msg => send(msg, 'technicalDetails', { disable_web_page_preview: true }))

const scratchProjectLinkRegex = /^(https:\/\/scratch.mit.edu\/projects\/)?(\d+)\/?$/
bot.onText(/\/play(@scratch2tggame_bot)? ?(.*)?/, async (msg, match) => {
  const arg = match[2]
  if(!scratchProjectLinkRegex.test(arg)) {
    send(msg, 'incorrectLink')
  } else {
    const projectID = arg.match(scratchProjectLinkRegex)[2]
    const generatingMsg = await send(msg, 'generating.check')
    bot.sendChatAction(msg.chat.id, 'upload_document')
    try {
      if(await isGameExists(projectID)) throw  { code: 'scratchBot', botMessage: 'gameExists' }
      await checkLimits(msg.from.id)
      await update(generatingMsg.message_id, msg, 'generating.retrieving')
      await bot.sendChatAction(msg.chat.id, 'upload_document')

      const { projectFile, projectData } = await retrieveInfo(projectID)
      await update(generatingMsg.message_id, msg, 'generating.processing')
      await bot.sendChatAction(msg.chat.id, 'upload_document')

      const zip = await pack(projectFile)
      await update(generatingMsg.message_id, msg, 'generating.uploading')
      await bot.sendChatAction(msg.chat.id, 'upload_document')

      await saveGame(projectID, zip)
      await update(generatingMsg.message_id, msg, 'generating.botfather')
      await bot.sendChatAction(msg.chat.id, 'upload_document')

      const { title, description, instructions, author, image } = projectData
      const projectImage = await fetch(image)
      const photoBuffer = arrayToBuffer(await projectImage.arrayBuffer())
      const gameAbout = `${instructions}\n${description}`
      const tgGame = {
        title: _.truncate(title, { length: 64 }),
        description: _.truncate(gameAbout, { length: 500 })
      }
      const size = Buffer.byteLength(zip)
      await addGame(projectID, tgGame.title, tgGame.description, photoBuffer)
      await insertToDB(projectID, title, gameAbout, size, author.id, msg.from.id)
      await bot.sendGame(msg.chat.id, `id${projectID}`)
      await update(generatingMsg.message_id, msg, 'generating.done')
    } catch (e) {
      const botErrors = Object.keys(localization.default.generating.error)
      switch (e.code) {
        case 'ETELEGRAM':
          switch (e.message) {
            case 'ETELEGRAM: 400 Bad Request: wrong game short name specified':
              update(generatingMsg.message_id, msg, 'generating.error.botFatherLimit')
              break

            default:
              console.error(e)
              update(generatingMsg.message_id, msg, 'generating.error.telegramAPI')
              break
          }
          break

        case 'scratchBot':
          update(
            generatingMsg.message_id, msg, 
            botErrors.includes(e.botMessage) ? `generating.error.${e.botMessage}` : 'generating.error.default'
          )
      }
    }
  }
})

const topGames = [178966496]
bot.on('inline_query', async inlineQuery => {
  const term = inlineQuery.query
  const answerInlineQuery = list => {
    bot.answerInlineQuery(
      inlineQuery.id, 
      list.map((gameId, i) => ({ type: 'game', id: i+1, game_short_name: `id${gameId}` }))
    )
  }
  if(term === '') {
    answerInlineQuery(topGames)
  } else {
    const resultList = await queryGame(term)
    answerInlineQuery(resultList.map(({ _id }) => _id))
  }
})

const gameShortNameRegex = /^id(\d+)$/
bot.on('callback_query', async callbackQuery => {
  const gameShortName = callbackQuery.game_short_name
  if(!gameShortNameRegex.test(gameShortName)) {
    bot.answerCallbackQuery(callbackQuery.id, { text: 'Неправильный ID игры', show_alert: true })
  } else {
    const projectID = gameShortName.match(gameShortNameRegex)[1]
    bot.answerCallbackQuery(callbackQuery.id, { url: `https://scratch2tggame.utidteam.com/${projectID}` })
  }
})

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body)
  res.code(200).send('ok')
})

app.listen(port).then(() => console.log(`Server is listening at http://localhost:${port}`))

process.on('SIGINT', async () => {
  await dbClient.close()
  closeTelegramMTProto()
  process.exit(0)
})
