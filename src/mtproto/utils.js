export async function getUser() {
  try {
    const user = await global.mtprotoapi.call('users.getFullUser', {
      id: {
        _: 'inputUserSelf',
      },
    })

    return user
  } catch (error) {
    return null
  }
}

export function sendCode(phone) {
  return global.mtprotoapi.call('auth.sendCode', {
    phone_number: phone,
    settings: { _: 'codeSettings' }
  })
}

export function signIn({ code, phone, phone_code_hash }) {
  return global.mtprotoapi.call('auth.signIn', {
    phone_code: code,
    phone_number: phone,
    phone_code_hash: phone_code_hash,
  })
}

export function signUp({ phone, phone_code_hash }) {
  return global.mtprotoapi.call('auth.signUp', {
    phone_number: phone,
    phone_code_hash: phone_code_hash,
    first_name: 'MTProto',
    last_name: 'Core',
  })
}

export function getPassword() {
  return global.mtprotoapi.call('account.getPassword')
}

export function checkPassword({ srp_id, A, M1 }) {
  return global.mtprotoapi.call('auth.checkPassword', {
    password: {
      _: 'inputCheckPasswordSRP',
      srp_id,
      A,
      M1,
    },
  })
}

export function close() {
  global.mtprotoapi.call = () => {
    throw new Error('MTProto has been closed.')
  }

  for (let rpc of Object.values(global.mtprotoapi.rpcs)) {
    rpc.transport.connect = () => {}
    rpc.transport.socket.destroy()
  }
}

export function randomInt() {
  return Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff)
}

export function randomLong() {
  let long = ''
  for(let i = 0; i < 19; ++i) long += Math.floor(Math.random() * 10)
  return long
}
