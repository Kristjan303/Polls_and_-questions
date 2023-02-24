
## 🔧 Installation

- run ```npm install``` to install all dependencies
- [Set up database](#database-setup)
- Run ```node index.js``` to start the server


## ⚙️ Database setup

[Download](https://dev.mysql.com/downloads/installer) link for MYSQL installer. Only server required.

MYSQL Accounts Table SQL Script
```sql
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL
);
```

## ✉️ Accessing the website

To access the website follow this link:
```
http://localhost:3000/index.html
```

Documentation located at:
```
http://localhost:3000/docs/
```

## 📃 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## 🕯 Acknowledgments

- [Express](https://expressjs.com/) for the web framework.
- [Node.js](https://nodejs.org/en/) for the JavaScript runtime.
- [NPM](https://www.npmjs.com/) for the package manager.
- [Dotenv](https://www.npmjs.com/package/dotenv) for the environment variables.
- [Bcrypt](https://www.npmjs.com/package/bcrypt) for the password hashing.
