const appDatabase = db.getSiblingDB(process.env.MONGODB_DATABASE || "timeful")

if (!process.env.MONGODB_APP_USERNAME || !process.env.MONGODB_APP_PASSWORD) {
  throw new Error("MONGODB_APP_USERNAME and MONGODB_APP_PASSWORD are required")
}

if (!appDatabase.getUser(process.env.MONGODB_APP_USERNAME)) {
  appDatabase.createUser({
    user: process.env.MONGODB_APP_USERNAME,
    pwd: process.env.MONGODB_APP_PASSWORD,
    roles: [{ role: "readWrite", db: appDatabase.getName() }],
  })
}
