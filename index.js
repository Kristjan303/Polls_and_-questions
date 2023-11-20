const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const swaggerDocument = yamlJs.load('./swagger.yaml');
const mysql = require('mysql2')
const bcrypt = require('bcrypt');
const swaggerJSDoc = require('swagger-jsdoc'); // Import swagger-jsdoc
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const bodyParser = require('body-parser');
const cors = require('cors');
const {join} = require("path");


// Use the cors middleware with default options
app.use(cors());

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
// Create a route to serve the profile page



con.connect(function (err){
    if (err) throw err
    console.log("Connected polls db");
})

const sessions = [];
const uuid = require('uuid'); // Make sure to install this library

app.post('/sessions', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send({ error: "One or more parameters missing" });
    }

    con.query('SELECT id, username, password, profile_pic, bio FROM polls.accounts WHERE username = ?', [username], (error, results) => {
        if (error) {
            console.error('Error in login query:', error);
            return res.status(500).send({ error: "Internal Server Error" });
        }

        if (results.length > 0) {
            const user = results[0];
            const hashedPassword = user.password;

            if (bcrypt.compareSync(password, hashedPassword)) {
                const sessionId = uuid.v4(); // Generate a unique session ID

                const session = { id: sessionId, user: username };
                sessions.push(session);

                const profile_pic = user.profile_pic;
                const url = decodeURIComponent(profile_pic);
                const imageData = url.substring(url.indexOf(',') + 1);
                const bio = user.bio;

                const sessionData = {
                    id: sessionId,
                    user: username,
                    bio: bio,
                    profile_pic: 'data:image/jpeg;base64,' + imageData
                };

                return res.status(201).send({
                    success: true,
                    loggedIn: true,
                    sessionData: sessionData
                });
            } else {
                return res.status(401).send({ error: "Invalid username or password" });
            }
        } else {
            return res.status(401).send({ error: "Invalid username or password" });
        }
    });
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

            const defaultBio = '';

            // Read image file and encode it into base64
            const imagePath = 'public/images/important.png';
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Image = imageBuffer.toString('base64');

            // Insert new user into accounts table with the base64-encoded image
            const newAccount = { username, password: hashedPassword, bio: defaultBio, profile_pic: base64Image };
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
    if (!req.body.username || !req.body.sessionId) {
        // If any parameter is missing, return a 400 Bad Request response with an error message.
        return res.status(400).send({ error: "One or more parameters missing" });
    } else {
        // You can skip session verification here and directly log out the user by removing the parameters from the sessions array.
        const index = sessions.findIndex(element => element.user === req.body.username && element.id === req.body.sessionId);
        if (index !== -1) {
            // If a matching session is found, remove it from the sessions array and return a 201 Created response with a success message.
            sessions.splice(index, 1);
            return res.status(201).send({ success: true });
        } else {
            // You can still return a success response even if the session doesn't exist to allow users to "log out" without verifying the session.
            // return res.status(401).send({ error: "Invalid sessionId or username" });
            return res.status(201).send({ success: true });
        }
    }
});

// Endpoint to handle adding a friend
app.use(bodyParser.json());
app.post('/addFriend', (req, res) => {
    const { username, sessionId, friendUsername } = req.body;

    // Verify the session ID and username
    const validSession = sessions.find(session => session.id == sessionId && session.user === username);

    if (!validSession) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Now, you can use the user information from the session
    const user1 = validSession.user;

    // Continue with the rest of your logic
    const checkUserQuery = 'SELECT id FROM polls.accounts WHERE username = ?';
    con.query(checkUserQuery, [user1], (err, results) => {
        if (err) {
            console.error('Error checking logged-in user:', err);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }

        if (results.length === 0) {
            // Logged-in user not found
            return res.json({ success: false, error: 'Logged-in user not found' });
        } else {
            // Logged-in user found, use the id for user1
            const user1Id = results[0].id;

            // Now, check the friend's username
            con.query(checkUserQuery, [friendUsername], (err, friendResults) => {
                if (err) {
                    console.error('Error checking friend username:', err);
                    return res.status(500).json({ success: false, error: 'Internal Server Error' });
                }

                if (friendResults.length === 0) {
                    // Friend username not found
                    return res.json({ success: false, error: 'Friend username not found' });
                } else {
                    // Friend username found, add a row to the "friends" table
                    const befriendedId = friendResults[0].id;

                    // Check if user1 and user2 are the same
                    if (user1Id === befriendedId) {
                        return res.json({ success: false, error: 'You can\'t be friends with yourself 😜' });
                    }

                    // Use the stored procedure to insert the friend relationship
                    const insertFriendProcedure = 'CALL insert_friend(?, ?)';
                    con.query(insertFriendProcedure, [user1Id, befriendedId], (err, result) => {
                        if (err) {
                            if (err.code === 'ER_DUP_ENTRY') {
                                // Duplicate entry error, user is already a friend
                                return res.json({ success: false, error: 'You are already friends with this user' });
                            } else {
                                console.error('Error adding friend:', err);
                                return res.status(500).json({ success: false, error: 'Internal Server Error' });
                            }
                        } else {
                            return res.json({ success: true });
                        }
                    });
                }
            });
        }
    });
});




// Endpoint to fetch account names and related data
app.get('/accountNames', (req, res) => {
    const { username, sessionId } = req.query;

    // Verify the session ID and username
    const validSession = sessions.find(session => session.id == sessionId && session.user === username);

    if (!validSession) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Now, you can use the user information from the session
    const user1 = validSession.user;

    // Continue with the rest of your logic
    const getFriendsQuery = `
        SELECT friends.user2, accounts.username, accounts.profile_pic, accounts.bio
        FROM friends
                 JOIN accounts ON friends.user2 = accounts.id
        WHERE friends.user1 = (
            SELECT id FROM accounts WHERE username = ?
        )
    `;

    con.query(getFriendsQuery, [user1], (err, results) => {
        if (err) {
            console.error('Error fetching account names:', err);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }

        const accountNames = results.map(row => {
            // Encode the profile_pic into base64
            const url = decodeURIComponent(row.profile_pic);
            const imageData = url.substring(url.indexOf(',') + 1);
            const base64Image = 'data:image/jpeg;base64,' + imageData;
            const bio = row.bio;

            return {
                username: row.username,
                friendId: row.id,
                profile_pic: base64Image,
                bio: bio
            };
        });

        return res.json({ success: true, accountNames });
    });
});

// Endpoint to remove a friend from the database

app.delete('/removeFriend', (req, res) => {
    const { username, sessionId, friendUsername } = req.query;

    // Verify the session ID and username
    const validSession = sessions.find(session => session.id == sessionId && session.user === username);

    if (!validSession) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Now, you can use the user information from the session
    const user1 = validSession.user;

    // Find the user1's ID
    const getUser1IdQuery = 'SELECT id FROM accounts WHERE username = ?';
    con.query(getUser1IdQuery, [user1], (err, user1Results) => {
        if (err) {
            console.error('Error getting user1 ID:', err);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }

        if (user1Results.length === 0) {
            return res.json({ success: false, error: 'User1 not found' });
        }

        const user1Id = user1Results[0].id;

        // Find the friend's ID
        const getUser2IdQuery = 'SELECT id FROM accounts WHERE username = ?';
        con.query(getUser2IdQuery, [friendUsername], (err, user2Results) => {
            if (err) {
                console.error('Error getting user2 ID:', err);
                return res.status(500).json({ success: false, error: 'Internal Server Error' });
            }

            if (user2Results.length === 0) {
                return res.json({ success: false, error: 'Friend not found' });
            }

            const user2Id = user2Results[0].id;

            // Remove all rows with user1 and user2 or user2 and user1
            const removeFriendQuery = 'DELETE FROM friends WHERE (user1 = ? AND user2 = ?) OR (user1 = ? AND user2 = ?)';
            con.query(removeFriendQuery, [user1Id, user2Id, user2Id, user1Id], (err, result) => {
                if (err) {
                    console.error('Error removing friend:', err);
                    return res.status(500).json({ success: false, error: 'Internal Server Error' });
                }

                return res.json({ success: true });
            });
        });
    });
});



app.get('/profile', (req, res) => {
    const profilePagePath = join(__dirname, 'public', 'profile.html'); // Get the full path to the HTML file
    res.sendFile(profilePagePath); // Serve the HTML file
});

app.get('/friends', (req, res) => {
    const friendsPagePath = join(__dirname, 'public', 'friends.html');
    res.sendFile(friendsPagePath);
});

app.post('/save-profile', (req, res) => {
    const { sessionId, username, bio, profile_pic } = req.body;

    // Verify the session ID and username
    const validSession = sessions.find(session => session.id == sessionId && session.user === username);

    if (!validSession) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    // Update the user's profile in the database
    con.query('UPDATE polls.accounts SET bio = ?, profile_pic = ? WHERE username = ?', [bio, profile_pic, username], (updateError, updateResults) => {
        if (updateError) {
            console.error(updateError);
            res.status(500).json({ error: 'Error saving profile' });
        } else {
            res.status(200).json({ message: 'Profile saved successfully' });
        }
    });
});


// Endpoint to create a new chat
app.post('/createChat', (req, res) => {
    const { username, sessionId, chatName } = req.body;

    // Verify the session ID and username
    const validSession = sessions.find(session => session.id == sessionId && session.user === username);

    if (!validSession) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Now, you can use the user information from the session
    const owner = validSession.user;

    // Get the user ID based on the owner (username)
    const getUserIdQuery = 'SELECT id FROM polls.accounts WHERE username = ?';
    con.query(getUserIdQuery, [owner], (err, userResult) => {
        if (err) {
            console.error('Error getting user ID:', err);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }

        // Check if the user was found
        if (userResult.length === 0) {
            return res.status(500).json({ success: false, error: 'User not found' });
        }

        // Retrieve the user ID
        const userId = userResult[0].id;

        // Check if chatName is provided
        if (!chatName) {
            return res.status(400).json({ success: false, error: 'Chat name is required' });
        }

        // Insert a new chat into the 'chats' table
        const createChatQuery = 'INSERT INTO chats (chat_name, owner_id) VALUES (?, ?)';
        con.query(createChatQuery, [chatName, userId], (err, result) => {
            if (err) {
                console.error('Error creating chat:', err);
                return res.status(500).json({ success: false, error: 'Internal Server Error' });
            }

            // Get the chat_id of the newly created chat
            const chatId = result.insertId;

            // Insert the user who created the chat as a member of the chat
            const addOwnerToChatQuery = 'INSERT INTO chat_members (userId, chat_id) VALUES (?, ?)';
            con.query(addOwnerToChatQuery, [userId, chatId], (err, result) => {
                if (err) {
                    console.error('Error adding owner to chat:', err);
                    return res.status(500).json({ success: false, error: 'Internal Server Error' });
                }

                return res.json({ success: true, chatId });
            });
        });
    });
});


app.get('/fetchChats', (req, res) => {
    const { username, sessionId } = req.query;

    // Verify the session ID and username
    const validSession = sessions.find(session => session.id == sessionId && session.user === username);

    if (!validSession) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Now, you can use the user information from the session
    const owner = validSession.user;

    // Get the user ID based on the owner (username)
    const getUserIdQuery = 'SELECT id FROM polls.accounts WHERE username = ?';
    con.query(getUserIdQuery, [owner], (err, userResult) => {
        if (err) {
            console.error('Error getting user ID:', err);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }

        // Check if the user was found
        if (userResult.length === 0) {
            return res.status(500).json({ success: false, error: 'User not found' });
        }

        // Retrieve the user ID
        const userId = userResult[0].id;

        // Fetch the user's chat data
        const fetchChatsQuery = 'SELECT chat_name FROM chats WHERE owner_id = ?';
        con.query(fetchChatsQuery, [userId], (err, chatsResult) => {
            if (err) {
                console.error('Error fetching user chats:', err);
                return res.status(500).json({ success: false, error: 'Internal Server Error' });
            }

            // Send the chat data to the frontend
            const userChats = chatsResult.map(chat => ({ chatName: chat.chat_name }));
            return res.json(userChats);
        });
    });
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

// Fetch account names and its endpoint


