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
const nodemailer = require("nodemailer")

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

const transporter = nodemailer.createTransport({
    host: "outlook.com",
    secureConnection: false,
    port: 587,
    tls: {
        ciphers: "SSLv3"
    },
    auth: {
        user: config.email_bot.email,
        pass: config.email_bot.mdp
    }
})

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

app.post('/register', async (req, res) => {
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
                        theme: row.theme,
                        pp_status: row.pp_status
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
                theme: 0,
                pp_status: 0,
            })
            db.all(`INSERT INTO "users" VALUES ("${hashedPassword}", "${req.body.email}", 0, "${id}", ${null}, 0, "${req.body.username}", 0)`)
            is_user_existing = "User well created"
            const user = users.find(user => user.username === req.body.username)
            const mailOptions = {
                from: config.email_bot.email,
                to: user.email,
                subject: "Account created",
                text: `Hello ${user.username},
            Your accout was well created. Hope you can have good moments on our website.`
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error){
                    console.log(error)
                } else {
                    console.log("Email envoyé" + info.response)
                }
            })
            return res.json(user)
        }
    } catch {
        return "Register Failed"
    }
})

app.post('/change-theme', async (req, res) => {
    try {
        const act_user = users.indexOf(users.find(user => user.username === req.body.username))
        const user = users[act_user]
        var new_theme = 0
        if(req.body.classes.theme === 0) {
            new_theme = 1
        } else {
            new_theme = 0
        }
        users[act_user] = {
            username: user.username,
            password: user.password,
            email: user.email,
            admin: user.admin,
            id: user.id,
            birthday: user.birthday,
            theme: new_theme,
            pp_status: user.pp_status,
        }
        db.run(`UPDATE "users" SET theme = ${new_theme} WHERE id = '${users[act_user].id}'`)
        return(res.json(users[act_user]))
    } catch (error) {
        
    }
})

app.listen(config.devPort, () => {
    console.log(`Listen on port ${config.devPort}`)
})