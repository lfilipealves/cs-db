const express = require("express");
const app = express();
const port = 3001;

app.use(express.json());

const routes = require("./routes"); // Importando rotas
const { login } = require("./login"); // Importando login
const users = require("./database"); // Importando Usuários

// Rota pública para login
app.post("/user/login", login);

// Middleware de rotas protegidas
app.use("/user", routes);

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
