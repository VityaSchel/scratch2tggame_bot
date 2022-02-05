import 'dotenv/config'
import fs from 'fs/promises'
import { getAPI } from './setup.js'
import md5file from 'md5-file'
import _ from 'lodash'

export async function addGame(projectID, title, description, photoBuffer, noConnectRetries = false) {
  if(noConnectRetries) throw 'Could not connect to Telegram API'
  try {
    await global.mtprotoapi.call('getAccountTTL')
  } catch(e) {
    return await addGame(...arguments, true)
  }

  await sendToBotFather('/newgame')
  await sendToBotFather('OK')
  await sendToBotFather('Accept')
  await sendToBotFather('@scratch2tggame_bot')
  await sendToBotFather(title)
  await sendToBotFather(description)
  await sendMediaToBotFather(photoBuffer)
  await sendToBotFather('/empty')
  await sendToBotFather(String(projectID))
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
    random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
  })
}

async function sendMediaToBotFather(imageBuffer) {
  let fileID = ''
  for(let i = 0; i < 19; ++i) fileID += Math.floor(Math.random() * 10)

  const imageSize = Buffer.byteLength(imageBuffer)
  const chunks = Math.ceil(imageSize / 1024)
  for(let i = 0; i < chunks; i++) {
    const partSize = i === chunks-1 ? imageSize % 1024 : 1024
    const part = imageBuffer.slice(i*1024, i*1024 + partSize)
    console.log(fileID, i, await global.mtprotoapi.call('upload.saveFilePart', {
      file_id: fileID,
      file_part: i,
      bytes: part
    }))
  }

  await global.mtprotoapi.call('messages.sendMedia', {
    media: {
      _: 'inputMediaUploadedPhoto',
      file: {
        _: 'inputFile',
        id: fileID,
        parts: chunks,
        name: fileID,
        md5Checksum: ''
      }
    },
    peer: botFatherPeer,
    message: '',
    random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
  })
}

// sendMediaToBotFather(Buffer.from(await fs.readFile('/Users/VITA/Desktop/sussmall.jpeg')))
