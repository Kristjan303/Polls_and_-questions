
## Installing dependencies

- run ```npm install``` to install all dependencies



## Database setup

- [Download](https://dev.mysql.com/downloads/installer) link for MYSQL installer. Only server required.

- Create a database called ```polls``` with accounts table inside it: 
```sh
mysql -u root -e "create database polls; use polls; CREATE TABLE accounts (  id INT AUTO_INCREMENT PRIMARY KEY,  username VARCHAR(255) NOT NULL,  password VARCHAR(255) NOT NULL);"
```

## Running the app

- run ```npm start``` to start the app

## Accessing the website

To access the website follow this link:
```
http://localhost:3000/
```

## Documentation

Documentation is located at:
```
http://localhost:3000/docs/
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- [Express](https://expressjs.com/) for the web framework.
- [Node.js](https://nodejs.org/en/) for the JavaScript runtime.
- [NPM](https://www.npmjs.com/) for the package manager.
- [Dotenv](https://www.npmjs.com/package/dotenv) for the environment variables.
- [Bcrypt](https://www.npmjs.com/package/bcrypt) for the password hashing.
