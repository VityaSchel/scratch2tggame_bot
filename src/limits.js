export async function checkLimits(userID) {
  if(await dailyGamesCountLimit(userID)) throw { code: 'scratchBot', botMessage: 'dailyGamesCountLimit' }
  if(await overallAccountGamesCountLimit(userID)) throw { code: 'scratchBot', botMessage: 'overallAccountGamesCountLimit' }
  if(await overallAccountGamesSizeLimit(userID)) throw { code: 'scratchBot', botMessage: 'overallAccountGamesSizeLimit' }
}

async function dailyGamesCountLimit(userID) {
  const results = await global.db.collection('games')
    .find({ userID, addedAt: { $gte: Date.now() - 1000 * 60 * 60 * 24 } })
    .toArray()
  return results.length >= 5
}

async function overallAccountGamesCountLimit(userID) {
  const results = await global.db.collection('games')
    .find({ userID })
    .toArray()
  
  return results.length >= 25
}

const accountGamesMaxSize = 1024 * 1024 * 50
async function overallAccountGamesSizeLimit(userID) {
  const results = await global.db.collection('games')
    .find({ userID })
    .toArray()

  const overallSize = results.map(({ size }) => size).reduce((prev, cur) => prev+cur, 0)
  return overallSize >= accountGamesMaxSize
}