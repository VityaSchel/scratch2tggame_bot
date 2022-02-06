import './dotenv.js'
import _ from 'lodash'
import ngrok from 'ngrok'
import fastify from 'fastify'
import localization from './src/localization.js'
import TelegramBot from 'node-telegram-bot-api'
import { init as initDB, queryGame, isGameExists } from './src/db.js'
import { checkLimits } from './src/limits.js'
// import { insertToQueue, removeFromQueue } from './src/queue/manager.js'
import Queue from 'bee-queue'

const TOKEN = process.env.TELEGRAM_TOKEN
let url = 'https://utidteam.com/scratch2tggame_bot'
const port = 9223

const bot = new TelegramBot(TOKEN)
const app = fastify()
const dbClient = await initDB()
const queue = new Queue('games-converting')
await queue.destroy()

// const ngrokurl = await ngrok.connect({ addr: port, authtoken: process.env.NGROK })
// console.log(ngrokurl)
// url = ngrokurl

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
  let generatingMsg
  if(!scratchProjectLinkRegex.test(arg)) {
    send(msg, 'incorrectLink')
  } else {
    const projectID = arg.match(scratchProjectLinkRegex)[2]
    generatingMsg = await send(msg, 'generating.check')
    bot.sendChatAction(msg.chat.id, 'upload_document')
    try {
      if(await isGameExists(projectID)) throw  { code: 'scratchBot', botMessage: 'gameExists' }
      await checkLimits(msg.from.id)
      await update(generatingMsg.message_id, msg, 'generating.queue')

      const job = await queue.createJob({ projectID: projectID, userID: msg.from.id })
        .save()
      console.log('Added job to queue', job.id)

      job.on('progress', async progress => {
        await update(generatingMsg.message_id, msg, `generating.${progress.status}`)
        await bot.sendChatAction(msg.chat.id, 'upload_document')
      })

      job.on('succeeded', (err) => {
        if(err) return returnError(err)
        update(generatingMsg.message_id, msg, 'generating.done')
        bot.sendGame(msg.chat.id, `id${projectID}`)
      })
    } catch (e) {
      returnError(e)
    }
  }
  
  function returnError(e) {
    const botErrors = Object.keys(localization.default.generating.error)
    switch (e.code) {
      case 'ETELEGRAM':
        switch (e.message) {
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
        break

      default:
        console.error(e)
        update(generatingMsg.message_id, msg, 'generating.error.default') 
        break
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
    if(callbackQuery?.from?.id == 270882543) return bot.answerCallbackQuery(callbackQuery.id, { url: 'https://scratch2tggame.utidteam.com/debug.html' })
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
  await queue.close(0)
  process.exit(0)
})
