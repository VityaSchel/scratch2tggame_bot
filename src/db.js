import mongodb from 'mongodb'

const mongodbPort = 9224
export async function init(dbName = 'scratch2tggame_bot') {
  const url = `mongodb://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASSWORD}@localhost:${mongodbPort}`
  const client = new mongodb.MongoClient(url)
  const connection = await client.connect()
  global.db = connection.db(dbName)
  return client
}

export async function insertToDB(projectID, title, description, size, gameAuthorID, adderID) {
  return await global.db.collection('games')
    .insertOne({ _id: projectID, title, description, size, gameAuthorID, adderID, addedAt: Date.now() })
}

export async function queryGame(term) {
  return await global.db.collection('games')
    .find({ $text: { $search: term } })
    .limit(50)
    .toArray()
}

export async function isGameExists(projectID) {
  return await global.db.collection('games')
    .find({ _id: projectID }, { _id: projectID })
    .limit(1)
    .hasNext()
}