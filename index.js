import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
import fastify from 'fastify'
import _ from 'lodash'
import { retreiveInfo, pack, saveGame } from './src/packager.js'
import { addGame } from './src/mtproto/botfather.js'
import ngrok from 'ngrok'
import localization from './src/localization.js'
import { getAPI } from './src/mtproto/setup.js'

const TOKEN = process.env.TELEGRAM_TOKEN
let url = 'https://scratch2tggame.utidteam.com'
const port = 9223

const bot = new TelegramBot(TOKEN)
const app = fastify()
await getAPI()

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
    const generatingMsg = await send(msg, 'generating.retreiving')
    bot.sendChatAction(msg.chat.id, 'upload_document')
    try {
      const { projectFile, projectData } = await retreiveInfo(projectID)
      await update(generatingMsg.message_id, msg, 'generating.processing')
      await bot.sendChatAction(msg.chat.id, 'upload_document')

      const zip = await pack(projectFile)
      await update(generatingMsg.message_id, msg, 'generating.uploading')
      await bot.sendChatAction(msg.chat.id, 'upload_document')

      await saveGame(projectID, zip)
      await update(generatingMsg.message_id, msg, 'generating.botfather')
      await bot.sendChatAction(msg.chat.id, 'upload_document')

      await addGame(projectID, title, description, photoBuffer)
      await update(generatingMsg.message_id, msg, 'generating.done')
      bot.sendGame(msg.message_id, projectID)
    } catch(e) {
      switch(e.botMessage) {
        case 'gameIsTooBig':
          update(generatingMsg.message_id, msg, 'generating.error.gameIsTooBig')
          break

        default:
          console.error(e)
          update(generatingMsg.message_id, msg, 'generating.error.default')
          break
      }
    }
  }
})

// bot.on('inline_query', async inlineQuery => {
//   bot.answerInlineQuery(inlineQuery.id, [
//     {
//       type: 'article', id: 0, title: 'your_game_placeholder', description: 'hello world',
//       input_message_content: {
//         message_text: `/play@scratch2tggame_bot ${inlineQuery.query}`
//       }
//     },
//     ...commonGames.map((gameShortName, i) => ({ type: 'game', id: i+1, game_short_name: gameShortName }))
//   ])
// })
//
// bot.on('callback_query', async callbackQuery => {
//   if(callbackQuery.game_short_name === 'custom') {
//     // const projectID = await db.get(callbackQuery.message.message_id)
//     bot.answerCallbackQuery(callbackQuery.id, { url: `https://scratch2tggame.utidteam.com/${projectID}` })
//   } else {
//     bot.answerCallbackQuery(callbackQuery.id, { url: `https://scratch2tggame.utidteam.com/${callbackQuery.game_short_name}` })
//   }
// })

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body)
  res.code(200).send('ok')
})

app.listen(port).then(() => console.log(`Server is listening at http://localhost:${port}`))
