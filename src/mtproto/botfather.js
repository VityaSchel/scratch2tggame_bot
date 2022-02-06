import 'dotenv/config'
import { randomInt, randomLong } from './utils.js'
import sharp from 'sharp'
import _ from 'lodash'

export function addGame(projectID, title, description, photoBuffer, noConnectRetries = false) {
  return new Promise(async resolve => {
    if(noConnectRetries) throw 'Could not connect to Telegram API'
    try {
      await global.mtprotoapi.call('users.getUsers', { id: [{ _: 'inputUserSelf' }] })
    } catch(e) {
      return await addGame(...arguments, true)
    }

    const thumbnail = await sharp(photoBuffer).resize(640, 360).toBuffer()

    const commandQueue = [
      () => sendToBotFather('/newgame'),
      () => sendToBotFather('OK'),
      () => sendToBotFather('Accept'),
      () => sendToBotFather('@scratch2tggame_bot'),
      () => sendToBotFather(title),
      () => sendToBotFather(description),
      () => sendMediaToBotFather(thumbnail),
      () => sendToBotFather('/empty'),
      () => sendToBotFather(`id${projectID}`),
      () => resolve()
    ]

    async function stepQueue() {
      const func = await commandQueue.shift()
      if(func) {
        await func()
        setTimeout(() => stepQueue(), 500)
      }
    }
    stepQueue()
  })
}

const botFather = { id: '93372553', access_hash: process.env.BOT_FATHER_ACCESS_HASH }
const botFatherPeer = {
  _: 'inputPeerUser',
  user_id: botFather.id,
  access_hash: botFather.access_hash
}
async function sendToBotFather(text) {
  await global.mtprotoapi.call('messages.sendMessage', {
    peer: botFatherPeer,
    message: text,
    random_id: randomInt(),
  })
}

const partsSizes = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288]
async function sendMediaToBotFather(imageBuffer) {
  const fileID = randomLong()
  const imageSize = Buffer.byteLength(imageBuffer)
  const partMaxSize = imageSize >= _.last(partsSizes) ? _.last(partsSizes) : partsSizes.find(size => imageSize <= size)

  const chunks = Math.ceil(imageSize / partMaxSize)
  for(let i = 0; i < chunks; i++) {
    const partSize = i === chunks-1 ? imageSize % partMaxSize : partMaxSize
    const part = imageBuffer.slice(i*partMaxSize, i*partMaxSize + partSize)
    await global.mtprotoapi.call('upload.saveFilePart', {
      file_id: fileID,
      file_part: i,
      bytes: part
    })
  }

  await global.mtprotoapi.call('messages.sendMedia', {
    media: {
      _: 'inputMediaUploadedPhoto',
      file: {
        _: 'inputFile',
        id: fileID,
        parts: chunks,
        name: `${fileID}.png`,
        md5Checksum: ''
      }
    },
    peer: botFatherPeer,
    message: '',
    random_id: randomInt(),
  })
}
