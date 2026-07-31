const requiredVariables = [
  "MONGODB_ROOT_USERNAME",
  "MONGODB_ROOT_PASSWORD",
  "MONGODB_APP_USERNAME",
  "MONGODB_APP_PASSWORD",
  "MONGODB_DATABASE",
]

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`${variable} is required`)
  }
}

const adminDatabase = db.getSiblingDB("admin")

if (!adminDatabase.getUser(process.env.MONGODB_ROOT_USERNAME)) {
  adminDatabase.createUser({
    user: process.env.MONGODB_ROOT_USERNAME,
    pwd: process.env.MONGODB_ROOT_PASSWORD,
    roles: [{ role: "root", db: "admin" }],
  })
}

const appDatabase = db.getSiblingDB(process.env.MONGODB_DATABASE)

if (!appDatabase.getUser(process.env.MONGODB_APP_USERNAME)) {
  appDatabase.createUser({
    user: process.env.MONGODB_APP_USERNAME,
    pwd: process.env.MONGODB_APP_PASSWORD,
    roles: [{ role: "readWrite", db: appDatabase.getName() }],
  })
}
