const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const swaggerDocument = yamlJs.load('./swagger.yaml');

require('dotenv').config();

const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Use the Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware to parse JSON
app.use(express.json());

const users = [{username: "admin", password: "admin", isAdmin: true},
    {username: "user", password: "password", isAdmin: false}]

const sessions = []


app.post('/sessions', (req,res) => {
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

// General error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    res.status(status).send(err.message);
})

app.listen(port, () => {
    console.log(`App running. Docs at http://localhost:${port}`);
})
