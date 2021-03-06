import d from 'dedent'

export default {
  ru: {
    greetings: d`Привет! С помощью этого бота вы сможете играть в игры с сайта \
    <a href="https://scratch.mit.edu">scratch.mit.edu</a> на \
    <a href="https://telegram.org/blog/games">Telegram Gaming Platform</a>. Также при конвертации бот добавляет адаптивные
    настройки для мобильных устройств, чтобы можно было управлять игрой без клавиатуры.

    🎮 Чтобы начать игру, зайдите в любой чат и напишите <pre>@scratch2tggame_bot</pre>, после чего вы сможете выбрать \
    любую из сгенерированных игр в выпадающем списке. Вы также можете отфильтровать игры по названию или их ID.

    🐱 Помимо существующих в боте игр вы можете играть в другие игры с сайта Scratch, которые не добавлены в бота \
    по-умолчанию. Для этого перейдите <a href="https://t.me/scratch2tggame_bot">в ЛС бота</a> и введите команду <pre>/play [ссылка на проект]</pre>. Например, \
    <pre>/play https://scratch.mit.edu/projects/178966496</pre>, после чего он появится в списке игр.

    ℹ️ Чтобы посмотреть информацию о компиляторе Scratch, информацию для правообладателей, копирайт, техническую \
    информацию и лимиты, отправьте команду /info`,
    incorrectLink: 'Ссылка некорректная',
    technicalDetails: d`Бот использует <a href="https://github.com/TurboWarp/packager/">Turbowarp</a> как компилятор файлов sb3.

    Лимиты:
    • До 5 сгенерированных игр в день на аккаунт
    • До 25 сгенерированных игр на аккаунт (попросите друга)
    • До 5 МБ на одну игру
    • До 50 МБ на все игры, сгенерированные аккаунтом
    Имейте в виду, что со временем большие по размеру игры, не пользующиеся особой популярностью, могут быть удалены, \
    а за нарушения и абьюз бота и сайта ваш аккаунт или игра могут быть заблокированы.

    Этот бот работает на двух языках: Русский и Английский, отвечая на языке, соответствующем параметру locale в Bot API, \
    поэтому для изменения языка вам необходимо поменять язык вашего клиента Телеграм.

    Бот создан @hlothdev. Автор не несет ответственности за любые размещенные материалы в играх. По всем вопросам, \
    связанным с авторскими правами, просьба обращаться к авторам игр на Scratch. ID проекта отображается над описанием в
    сообщении с кнопкой для начала игры. В будущем планируется автоматизация процесса удаления игр авторами, а пока что \
    вы можете обратиться ко мне для подтверждения владением проекта.`,
    generating: {
      check: '⏳ Проверка прав...',
      queue: '⏳ Вы в очереди...',
      retrieving: '⏳ [1/4] Получение информации об игре...',
      processing: '⏳ [2/4] Конвертация игры...',
      uploading: '⏳ [3/4] Загрузка на сервер...',
      botfather: '⏳ [4/4] Добавление в BotFather...',
      done: '✅ Игра добавлена в бота. Может потребоваться до 5 минут, прежде чем игра появится в списке.',
      error: {
        default: '❌ Ошибка при конвертации игры, попробуйте еще раз',
        alreadyQueued: '❌ Вы уже в очереди',
        gameIsTooBig: '❌ Размер игры превышает 5 МБ, поэтому её невозможно конвертировать',
        botFatherLimit: '❌ Ошибка при добавлении игры в BotFather. Возможно, бот перегружен, попробуйте через час или напишите @hlothdev',
        telegramAPI: '❌ Ошибка с Telegram API, попробуйте через несколько минут или напишите @hlothdev',
        gameNotFound: '❌ Игра не найдена, проверьте ссылку',
        gameExists: '❌ Игра уже создана, обновление игр пока не поддерживается',
        timeout: '❌ Генерация игры занимает слишком много времени, попробуйте еще раз или выберете менее сложную игру',
        dailyGamesCountLimit: '❌ Вы превысили дневной лимит на генерацию игр',
        overallAccountGamesCountLimit: '❌ Вы превысили лимит на создание игр на аккаунт. Попросите друга сгенерировать игру.',
        overallAccountGamesSizeLimit: '❌ Вы превысили лимит на размер игр на аккаунте, то есть суммарный размер всех сгенерированных вами игр превышает лимит. Попросите друга сгенерировать игру.',
      }
    }
  },
  default: {
    greetings: d`Hi! This bot allows you to play games from \
    <a href="https://scratch.mit.edu">scratch.mit.edu</a> on \
    <a href="https://telegram.org/blog/games">Telegram Gaming Platform</a>. This bot also adds adaptive controls \
    settings for mobile devices so that you can play from your smartphone!

    🎮 To start playing, go to any chat and type <pre>@scratch2tggame_bot</pre>, after that you can select any \
    of generated games in the list. You can also filter them by title and ID.

    🐱 If you can't find scratch game in list, you can convert it yourself! \
    Go to <a href="https://t.me/scratch2tggame_bot">bot's DM</a> and send me <pre>/play [project link]</pre> command. \
    For example, <pre>/play https://scratch.mit.edu/projects/178966496</pre>, then it will appear in the list.

    ℹ️ To display information about Scratch compilator, copyright, technical details and limits, please send me \
    /info command`,
    incorrectLink: 'Incorrect link format',
    technicalDetails: d`This bot uses <a href="https://github.com/TurboWarp/packager/">Turbowarp</a> as sb3 files compiler.

    Limits:
    • Up to 5 generated games per day per account
    • Up to 25 generated games per account (ask a friend)
    • Up to 5 MB per game
    • Up to 50 MB per account on all generated games
    Please keep in mind, that large games with no activity can be deleted, and accounts/games that abuse bot can be banned.

    This bot supports two languages: Russian and English, it decides which language to communicate using locale \
    parameter in Telegram API, please change your Telegram client langauge in order to change language in this bot.

    Bot created by @hlothdev. The author is not responsible for any any injuries, small or severe, that may happen \
    while trespassing on Freddy Fazbear's Pizza. Upon discovery of trespassing, the trespasser will swiftly be \
    reported to the police and banned from the restaurant. The author is also not materials posted in the games. \
    For all questions, related to copyright, please contact the authors of Scratch games. The project ID is displayed \
    above the description in message with a button to start the game. In the future, it is planned to automate the \
    process of deleting games by the authors, but for now you can contact me to confirm ownership of the project.`,
    generating: {
      check: '⏳ Checking rights...',
      queue: '⏳ You are in the queue...',
      retrieving: '⏳ [1/4] Retrieving info about project...',
      processing: '⏳ [2/4] Converting game...',
      uploading: '⏳ [3/4] Uploading to the server...',
      botfather: '⏳ [4/4] Adding to BotFather...',
      done: '✅ Game was successfully added to the bot. It may take up to 5 minutes before it appears in search results.',
      error: {
        default: '❌ Error while converting the game, please try again',
        alreadyQueued: '❌ You are already in queue',
        gameIsTooBig: '❌ Game\'s files size is more than 5 MB, thus we cannot convert it at the moment',
        botFatherLimit: '❌ Error while adding game to BotFather. Probably, the bot is too busy right now, please try again in 1 hour or contact @hlothdev',
        telegramAPI: '❌ Error while contacting Telegram API, please try again in few minutes or contact @hlothdev',
        gameNotFound: '❌ Game not found, check the link',
        gameExists: '❌ Game is already generated, updating is not supported at the moment',
        dailyGamesCountLimit: '❌ You have reached the daily limit of converting games',
        overallAccountGamesCountLimit: '❌ You have reached the overall account limit of converting games. Ask your friend to generate it.',
        overallAccountGamesSizeLimit: '❌ You have reached the overall account limit of size of converted games. Ask your friend to generate it.',
      }
    }
  }
}
