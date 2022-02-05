import 'dotenv/config'
import MTProto from '@mtproto/core'
import readlineSync from 'readline-sync'
import { getUser, sendCode, signIn, signUp, getPassword, checkPassword } from './utils.js'
const __dirname = new URL('.', import.meta.url).pathname

export async function getAPI() {
  const api = new MTProto({
    api_id: process.env.TELEGRAM_API_ID,
    api_hash: process.env.TELEGRAM_API_HASH,
    storageOptions: {
      path: __dirname+'session.json'
    },
  })

  global.mtprotoapi = api

  if(process.argv[2] === '--logout') await api.call('auth.logOut')

  async function authorize() {
    const user = await getUser()

    const phone = process.env.TELEGRAM_PHONE
    if (!user) {
      if(process.argv[2] !== '--auth') throw 'Session for Telegram user expired'

      const { phone_code_hash } = await sendCode(phone)
      const code = readlineSync.question('Код: ')

      try {
        const signInResult = await signIn({
          code,
          phone,
          phone_code_hash,
        })

        if (signInResult._ === 'auth.authorizationSignUpRequired') {
          await signUp({
            phone,
            phone_code_hash,
          })
        }
      } catch (error) {
        console.error('error!!!', error)
        if (error.error_message !== 'SESSION_PASSWORD_NEEDED') return console.log('error:', error)

        // 2FA
        const password = process.env.TELEGRAM_2FA_PASSWORD

        const { srp_id, current_algo, srp_B } = await getPassword()
        const { g, p, salt1, salt2 } = current_algo

        const { A, M1 } = await api.crypto.getSRPParams({
          g,
          p,
          salt1,
          salt2,
          gB: srp_B,
          password,
        })

        await checkPassword({ srp_id, A, M1 })
        return await getUser()
      }
    } else {
      return user
    }
  }

  await authorize()
  return api
}
