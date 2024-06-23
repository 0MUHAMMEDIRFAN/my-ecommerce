const { MongoClient } = require("mongodb")
const dotenv = require('dotenv')

const state = {
    db: null
}

dotenv.config()

function connect(done) {
    const dbUrl = process.env.DATABASE_URI
    const dbname = process.env.DATABASE_NAME

    MongoClient.connect(dbUrl).then((data, err) => {
        if (err)
            return done(err)
        state.db = data.db(dbname)
    })

    done()
}

function get() {
    return state.db
}

module.exports = { connect, get }