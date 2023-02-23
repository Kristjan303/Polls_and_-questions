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
    console.log("Connected to forum db");
})


const sessions = []

app.post('/sessions', (req, res) => {
    // Check if the request body contains both username and password
    if (!req.body.username || !req.body.password) {
        // If not, send an error response with status code 400
        return res.status(400).send({ error: "One or more parameters missing" })
    } else {
        // If both username and password are present, query the database to find a matching user
        con.query('SELECT * FROM forum.accounts WHERE username = ? AND password = ?', [req.body.username, req.body.password], function (error, results, fields) {
            if (error) throw error;

            // Check if the query returned any results
            if (results.length > 0) {
                // If so, create a new session with a random session ID
                const sessionId = Math.round(Math.random() * 100000000)
                const session = { id: sessionId, user: req.body.username }
                sessions.push(session)

                // Send a success response with status code 201, indicating that the user is logged in
                return res.status(201).send({ success: true, loggedIn: true, sessionId: sessionId })
            } else {
                // If the query did not return any results, send an error response with status code 401, indicating that the login credentials are invalid
                return res.status(401).send({ error: "Invalid username or password" })
            }
        });
    }
});


// Create a new account
app.post('/registration', (req, res) => {
    const { username, password } = req.body;

    // Check if username or password is empty
    if (!username || !password) {
        res.status(400).send({ error: 'Both fields need to be filled' });
        return;
    }

    // Check if username already exists
    con.query('SELECT * FROM forum.accounts WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error creating account');
        } else if (results.length > 0) {
            res.status(409).send('Username already exists');
        } else {
            // Insert new user into accounts table
            const newAccount = { username, password};
            con.query('INSERT INTO forum.accounts SET ?', newAccount, (error, results) => {
                if (error) {
                    console.error(error);
                    res.status(500).send({error: 'Error creating account'});
                } else {
                    res.status(201).send({error: "Account created successfully"});
                }
            });
        }
    });
});

// This endpoint is for logging out a user. It expects a POST request with a JSON body containing the username and sessionId.
app.post('/logout', (req, res) => {
    // Check if the required parameters are present in the request body.
    if (!req.body.username || !req.body.sessionId){
        // If any parameter is missing, return a 400 Bad Request response with an error message.
        return res.status(400).send({error: "One or more parameters missing"})
    } else {
        // If all required parameters are present, iterate over the sessions array to find a matching session.
        sessions.forEach((element) => {
            if (element.user == req.body.username || element.id == req.body.sessionId) {
                // If a matching session is found, remove it from the sessions array and return a 201 Created response with a success message.
                sessions.splice(element)
                return res.status(201).send({success: true})
            } else {
                // If no matching session is found, return a 401 Unauthorized response with an error message.
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
