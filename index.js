const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const swaggerDocument = yamlJs.load('./swagger.yaml');
const mysql = require('mysql2')
const bcrypt = require('bcrypt');
const swaggerJSDoc = require('swagger-jsdoc'); // Import swagger-jsdoc


require('dotenv').config();

const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Use the Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const swaggerDefinition = {
    info: {
        title: 'Your API Title',
        version: '1.0.0',
        description: 'Your API Description',
    },
    host: `localhost:${port}`,
    basePath: '/',
};

const options = {
    swaggerDefinition,
    apis: ['./index.js'], // Specify the path to your main application file
};

const swaggerSpec = swaggerJSDoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Middleware to parse JSON
app.use(express.json());

// create db connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    port: 3306,
    password: "qwerty",
    database: "polls"
})

con.connect(function (err){
    if (err) throw err
    console.log("Connected polls db");
})


const sessions = []

app.post('/sessions', (req, res) => {
    // Check if the request body contains both username and password
    if (!req.body.username || !req.body.password) {
        // If not, send an error response with status code 400
        return res.status(400).send({ error: "One or more parameters missing" })
    } else {
        // If both username and password are present, query the database to find a matching user
        con.query('SELECT password FROM polls.accounts WHERE username = ?', [req.body.username], function (error, results, fields) {
            if (error) throw error;

            // Check if the query returned any results
            if (results.length > 0) {
                // If so, compare the hashed password with the plain-text password entered by the user
                const hashedPassword = results[0].password;
                if (bcrypt.compareSync(req.body.password, hashedPassword)) {
                    // If the passwords match, create a new session with a random session ID
                    const sessionId = Math.round(Math.random() * 100000000)
                    const session = { id: sessionId, user: req.body.username }
                    sessions.push(session)

                    // Send a success response with status code 201, indicating that the user is logged in
                    return res.status(201).send({ success: true, loggedIn: true, sessionId: sessionId })
                } else {
                    // If the passwords do not match, send an error response with status code 401, indicating that the login credentials are invalid
                    return res.status(401).send({ error: "Invalid username or password" })
                }
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
    con.query('SELECT * FROM polls.accounts WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error(error);
            res.status(500).send('Error creating account');
        } else if (results.length > 0) {
            res.status(409).send('Username already exists');
        } else {
            // Check password requirements
            const passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z]).{6,16}$/;
            if (!passwordRegex.test(password)) {
                res.status(400).send({ error: 'Password must be at least 6-16 characters and contain at least 1 number' });
                return;
            }

            // Hash the password
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            // Insert new user into accounts table
            const newAccount = { username, password: hashedPassword };
            con.query('INSERT INTO polls.accounts SET ?', newAccount, (error, results) => {
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



