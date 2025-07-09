const { MongoClient } = require("mongodb")
const dotenv = require('dotenv')

const state = {
    db: null
}

dotenv.config()

function connect(done) {
    const dbUrl = process.env.DATABASE_URI
    const dbname = process.env.DATABASE_NAME

    if (!dbUrl) {
        return done(new Error('DATABASE_URI is not defined in environment variables'))
    }

    MongoClient.connect(dbUrl).then((data) => {
        state.db = data.db(dbname)
        console.log('Database connected successfully')
        done()
    }).catch((err) => {
        console.error('Database connection error:', err)
        done(err)
    })
}

function get() {
    return state.db
}

module.exports = { connect, get }