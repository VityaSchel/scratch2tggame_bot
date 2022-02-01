import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
import level from 'level'
import fastify from 'fastify'

const TOKEN = process.env.TELEGRAM_TOKEN
const url = 'https://scratch2tggame.utidteam.com'
const port = 9223

const bot = new TelegramBot(TOKEN)
const app = fastify()
const db = level('games')

bot.setWebHook(`${url}/bot${TOKEN}`)

const localization = {
  ru: {
    greetings: 'Привет\\! С помощью этого бота вы сможете играть в игры с сайта [scratch\\.mit\\.edu](https://scratch.mit.edu) в [Telegram](https://telegram.org/blog/games)\\. Бот использует [Turbowarp](https://github.com/TurboWarp/packager/) как компилятор файлов sb3\\. \n\nЧтобы начать игру, зайдите в любой чат и напишите `@scratch2tggame_bot`, после чего вы сможете выбрать любую из предустановленных игр\\. \n\nВы также можете играть в собственные игры со Scratch, которые не добавлены в бота по\\-умолчанию\\. Для этого введите `@scratch2tggame_bot [ссылка на проект]` в чате, где есть бот или в личных сообщениях\\. Например, `@scratch2tggame_bot https:\\/\\/scratch\\.mit\\.edu\\/projects\\/178966496` и нажмите на кнопку играть\\.',
    incorrectLink: 'Ссылка некорректная'
  },
  default: {

  }
}
const translate = (language, key) => (localization[language] ?? localization.default)[key]

bot.onText(/\/start/, msg => {
  bot.sendMessage(msg.chat.id, translate(msg.from.language_code, 'greetings'), { parse_mode: 'MarkdownV2' })
})

const scratchProjectLinkRegex = /^(https:\/\/scratch.mit.edu\/projects\/)?(\d+)\/?$/
bot.onText(/\/play(@scratch2tggame_bot)? ?(.*)?/, async (msg, match) => {
  const arg = match[2]
  if(!scratchProjectLinkRegex.test(arg)) {
    bot.sendMessage(msg.chat.id, translate(msg.from.language_code, 'incorrectLink'), { reply_to: msg.message_id })
  } else {
    const message = await bot.sendGame(msg.chat.id, 'custom')
    const projectID = arg.match(scratchProjectLinkRegex)[2]
    db.put(message.message_id, projectID)
  }
})

const commonGames = ['dungeondash']

bot.on('inline_query', async inlineQuery => {
  bot.answerInlineQuery(inlineQuery.id, [
    {
      type: 'article', id: 0, title: 'your_game_placeholder', description: 'hello world',
      input_message_content: {
        message_text: `/play@scratch2tggame_bot ${inlineQuery.query}`
      }
    },
    ...commonGames.map((gameShortName, i) => ({ type: 'game', id: i+1, game_short_name: gameShortName }))
  ])
})

bot.on('callback_query', async callbackQuery => {
  console.log(callbackQuery.inline_message_id)
  if(callbackQuery.game_short_name === 'custom') {
    const projectID = await db.get(callbackQuery.inline_message_id)
    bot.answerCallbackQuery(callbackQuery.id, { url: `https://scratch2tggame.utidteam.com/${projectID}` })
  } else {
    bot.answerCallbackQuery(callbackQuery.id, { url: `https://scratch2tggame.utidteam.com/${callbackQuery.game_short_name}` })
  }
})

app.get('*', (req, res) => {
  // res.sendFile(path.join(__dirname, 'game.html'))
  res.code(200).send(req.url)
})

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body)
  res.code(200).send('ok')
})

app.listen(port).then(() => console.log(`Server is listening at http://localhost:${port}`))
