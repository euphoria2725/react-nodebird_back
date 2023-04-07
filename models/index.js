const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  port: "3306",
  password: process.env.DB_PASSWORD,
  database: "react_nodebird",
});

module.exports = {
  pool: pool,
};
