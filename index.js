const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const swaggerDocument = yamlJs.load('./swagger.yaml');
const mysql = require('mysql')

require('dotenv').config();

const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Use the Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware to parse JSON
app.use(express.json());

// create db connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "qwerty",
    database: "forum"
})

con.connect(function (err){
    if (err) throw err
    console.log("Connected to joga_mysql db");
})


const users = [{username: "admin", password: "admin", isAdmin: true},
    {username: "user", password: "password", isAdmin: false}]

const sessions = []


app.post('/sessions', (req,res) => {
    con.query("SELECT * FROM forum.accounts", (err, res) => {
        if (err) throw err;
        const row = res[0];
        const username = row.username;
        console.log(username)
        console.log(req.body.username)
    })
    if (!req.body.username || !req.body.password){
        return res.status(400).send({error: "One or more parameters missing"})
    } else {
        userMatched = 0
        checkAdmin = false
        users.forEach((element) => {
            if(element.username == req.body.username && element.password == req.body.password){
                userMatched += 1
                if (element.isAdmin == true){
                    checkAdmin = true
                }
                sessionId = Math.round(Math.random() * 100000000)
                session = {id: sessionId, user: req.body.username}
                sessions.push(session)
            }
        });
        if (userMatched == 0){
            return res.status(401).send({error: "Invalid username or password"})
        }
        else if (userMatched == 1){
            return res.status(201).send({success: true, isAdmin: checkAdmin, sessionId: sessionId})
        }
    }
});

app.post('/logout', (req, res) => {
    if (!req.body.username || !req.body.sessionId){
        return res.status(400).send({error: "One or more parameters missing"})
    } else {
        sessions.forEach((element) => {
            if (element.user == req.body.username || element.id == req.body.sessionId) {
                sessions.splice(element)
                return res.status(201).send({success: true})
            } else {
                return res.status(401).send({error: "Invalid sessionId or username"})
            }
        })
    }
});
// General error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    res.status(status).send(err.message);
})

app.listen(port, () => {
    console.log(`App running. Docs at http://localhost:${port}`);
})
