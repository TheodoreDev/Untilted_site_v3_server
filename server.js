const express = require("express");
const app = express();
const cors = require('cors')
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require('method-override')
const multer = require("multer")

const config = require("./config.json");

const initializePassport = require('./functions/passport-config')
initializePassport(
  passport,
  username => users.find(user => user.username === username),
  id => users.find(user => user.id === id)
)

const users = []

app.use(cors())
app.use(express.json())
app.use(flash())
app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

let db = new sqlite3.Database(`./Ressources/DB/${config.dbNAME}.db`, err => {
    if(err){
        throw err
    }else {
        console.log(`Database ${config.dbNAME} started.`)
    }
})
db.all('SELECT * FROM users', [], (error, rows) => {
    if(error){
        throw error
    }
    rows.forEach((row) => {
        users.push({
            username: row.username,
            password: row.password,
            email: row.email,
            admin: row.admin,
            id: row.id,
            birthday: row.birthday,
            theme: row.theme,
            pp_status: row.pp_status
        })
    })
})

app.get("/api", (req, res) => {
    res.json({})
})

app.post('/login', async (req, res) => {
    const user = users.find(user => user.username === req.body.username)
    if (!user) {
        return "Login Failed"
    } else {
        if(await bcrypt.compare(req.body.password, user.password)) {
            return res.json(user)
        } else {
            return "Login Failed"
        }
    }
})

app.listen(config.devPort, () => {
    console.log(`Listen on port ${config.devPort}`)
})