const express = require("express");
const prisma = require("./database");

const app = express();
const port = 3001;

app.use(express.json());

const routes = require("./routes");
const { login } = require("./login"); 
// const users = require("./database"); 



// app.post("/user/login", login);


app.use("/user", routes);


app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
