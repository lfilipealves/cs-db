const express = require("express");
const prisma = require("./database");

const app = express();
const port = 3001;

app.use(express.json());

const routes = require("./routes");
const { login } = require("./login"); 
// const users = require("./database"); 

app.get("/db-test", async(req, res) => {
  try {
    const userCount = await prisma.user.count();
    const addressCount = await prisma.address.count();

    res.json({
      status: "Conectado ao banco de dados",
      userCount,
      addressCount
    });
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);
    res.status(500).json({error: "Erro ao conectar ao banco de dados"});
  }
});

app.post("/user/login", login);

app.use("/user", routes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
