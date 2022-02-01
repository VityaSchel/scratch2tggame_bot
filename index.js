import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'

const TOKEN = process.env.TELEGRAM_TOKEN
let url = 'https://scratch2tggame.utidteam.com'
const port = 9223

import fastify from 'fastify'
// const path = require('path')

const bot = new TelegramBot(TOKEN)
const app = fastify()

bot.setWebHook(`${url}/bot${TOKEN}`)

// Basic configurations
// app.set('view engine', 'ejs')
//
// if (url === '0') {
//   const ngrok = require('ngrok')
//   ngrok.connect(port, function onConnect(error, u) {
//     if (error) throw error
//     url = u
//     console.log(`Game tunneled at ${url}`)
//   })
// }

const localization = {
  ru: {
    greetings: 'Привет\\! С помощью этого бота вы сможете играть в игры с сайта [scratch\\.mit\\.edu](https://scratch.mit.edu) в [Telegram](https://telegram.org/blog/games)\\. Бот использует [Turbowarp](https://github.com/TurboWarp/packager/) как компилятор файлов sb3\\. \n\nЧтобы начать игру, зайдите в любой чат, напишите `@scratch2tggame_bot` и через пробел ссылку на игру на сайте scratch, например `@scratch2tggame_bot https:\\/\\/scratch\\.mit\\.edu\\/projects\\/178966496` и нажмите на кнопку играть\\.'
  },
  default: {

  }
}
const translate = (language, key) => (localization[language] ?? localization.default)[key]

bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, translate(msg.from.language_code, 'greetings'), { parse_mode: 'MarkdownV2' })
})

bot.on('inline_query', callbackQuery => {
  bot.answerInlineQuery(callbackQuery.id, [{ type: 'game', id: 0, game_short_name: 'dungeondash' }])
})
//callback_game
bot.on('callback_query', callbackQuery => {
  bot.answerCallbackQuery(callbackQuery.id, { url: 'https://scratch2tggame.utidteam.com/' })
})

app.get('/', (req, res) => {
  // res.sendFile(path.join(__dirname, 'game.html'))
  res.code(200).send('ok')
})

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body)
  res.code(200).send('ok')
})

app.listen(port).then(() => console.log(`Server is listening at http://localhost:${port}`))
