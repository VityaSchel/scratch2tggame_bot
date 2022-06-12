# Scratch2TGGame Bot

Telegram bot, that accepts link to [scratch.mit.edu](https://scratch.mit.edu), converts it to webpage using [Turbowrap](https://turbowarp.org/), and adds to [Telegram Gaming Platform](https://core.telegram.org/bots/games) to play within messenger. Shortly, converts scratch games to telegram games. Written in JavaScript.


## Reason to abandon

This project is ARCHIVED and NOT MAINTAINED. This means you are not allowed to message me about it please. It was consuming way much resources to run on server and literally no one was using it. If you cool enough, try a challenge: run it in serverless function. Follow instructions in [How to use](#how-to-use) in order to make it work.

## How to use

1. Make sure you have prerequisites installed

### Prerequisites

- NodeJS (tested on v16) and npm/yarn
- MongoDB (tested on v4.4.4)
- Redis
- All dependencies (install with `npm i` or `yarn install`)

Also make sure patch for turbowarp is applied (patches are in /patches directory and applied with patch-package automatically during `npm install`)

2. Adjust settings right in code for your needs. Set port, useNgrok/staticURL variables.
3. Create bot in BotFather for Telegram
4. Grab token, put it into .env file (sample is in .env.example) for `TELEGRAM_TOKEN`
5. Replace all occurrences of `@scratch2tggame_bot` with your bot name. I would recommend you to manually replace each of them, because I'm not sure if this safe. This repository was not intended to be public!
6. Create [Telegram MTProto App](https://my.telegram.org/apps) **with your throwaway account**. Read [How it works](#how-it-works) for explanation for why it's needed.
7. Run `npm run dbstartlocal`, it starts MongoDB on 9224 port without authentification. Use MongoDB compass or mongosh to create `scratch2tggame_bot` database, `games` collection and user with password.
8. Fill up .env file using .env.example

Description of all .env keys:

Key|Description
---|---
TELEGRAM_TOKEN|BotFather Telegram Bot API token with numeric part in start, but without `bot`
NGROK|Ngrok API token, only used when `useNgrok` variable is set to true in index.js:14
TELEGRAM_API_ID|App api_id you grabbed in 6th step
TELEGRAM_API_HASH|App api_hash you grabbed in 6th step
TELEGRAM_PHONE|Phone of account that created app in 6th step
BOT_FATHER_ACCESS_HASH|Access hash of BotFather relative to your account, it looks like this: `565671792639213123`
DB_USER_NAME|MongoDB username of user that you created in 7th step
DB_USER_PASSWORD|MongoDB password of user that you created in 7th step

9. Run `node src/mtproto/setup.js --auth` and authentificate with account from 6th step. Keep session.json secretly!

10. Run `npm run dbstart`, `npm run botstart` and `npm run workerstart` in background from user that can write to ./website directory. Do not run multiple workers, they will interfere with each other! I used [pm2](https://pm2.keymetrics.io/), but you can create Docker container. As you can tell from `.js` extension on files instead of `.ts` I won't Dockerize this repository and improve it, at least for now...

## How it works

1. When you start bot, it listening for /play command, while worker is running redis jobs.
2. When user invokes /play [project id or url] command, bot adds it to queue.
3. When worker is available for processing this job, it runs all checks to make sure user is not hitting [limits](#bot-limits) and game can be added
4. Then it starts kill timeout (60 seconds) for game packaging (src/packager.js). Packaging is process of retreiving game's data from Scratch servers, downloading it and converting to webpage using Turbowarp.
5. After packaging is done and webpage that stored in Buffer is not exceeding size limit, it starts another kill timeout (30 seconds) for game extracting to file system, specifically into ./website/[projectID] directory
6. Finally, the game is added to BotFather and tested. If game can be successfully sent to chat, that means it's added to Telegram and everything is done. After that, the game is added to MongoDB and user receives it in chat.
7. After user presses "Play" button, Telegram opens in-app browser with specified link. Ideally, user should be able to play it on any device, even without keyboard and mouse. Try to modify packager.js script to inject keyboard and joystick widgets into webpages.

It is recommended to restart worker each 24 hours to keep away from Telegram API session bugs. Session is restored automatically if you authentificated and `session.json` is present.

## Information

### BotFather and scratch limits:

BotFather game name: 64 chars or less
BotFather game description: 500 chars or less

Scratch game name: 100 chars or less
Scratch description: 5000 chars or less

### Bot limits

In order to keep server up and avoid BotFather rate limits, bot has its own limits, that are easily adjustable in src/limits.js.

Type|Value
---|---
Daily created games by user|5 per user per day
Overall created games by user|25 per user
Overall max size of all games by user|50 MB per user
Max size of script.js file in game|2.4 MB per game
Max size of all game files (including script.js)|5 MB per game