require("dotenv").config();
require("./database/database.js").connect();

const express = require("express");

const app = express();
const port = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send({ message: "hello world" });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
