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
const checkNotAuthenticated = require("./functions/Authenticate/checkNotAuthenticated")
const checkAuthenticated = require("./functions/Authenticate/checkAuthenticated")

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
            theme: row.theme
        })
    })
})

app.get("/api", (req, res) => {
    res.json({})
})

app.post('/login', checkNotAuthenticated, async (req, res) => {
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

app.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        db.all('SELECT * FROM users', [], (error, rows) => {
            if(error){
                throw error
            }
            rows.forEach((row) => {
                if(!users.find(user => user.username === row.username)) {
                    users.push({
                        username: row.username,
                        password: row.password,
                        email: row.email,
                        admin: row.admin,
                        id: row.id,
                        birthday: row.birthday,
                        theme: row.theme
                    })
                }
            })
        })
        if(users.find(user => user.username === req.body.username) 
           || users.find(user => user.email === req.body.email)){
            return "This user already exist"
        } else {
            const id = Date.now().toString()
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            users.push({
                username: req.body.username,
                password: hashedPassword,
                email: req.body.email,
                admin: 0,
                id: id,
                birthday: null,
                theme: 0
            })
            db.all(`INSERT INTO "users" VALUES ("${hashedPassword}", "${req.body.email}", 0, "${id}", ${null}, 0, "${req.body.username}")`)
            is_user_existing = "User well created"
            return res.json("User successfully registered !")
        }
    } catch {
        return "Register Failed"
    }
})

app.listen(config.devPort, () => {
    console.log(`Listen on port ${config.devPort}`)
})