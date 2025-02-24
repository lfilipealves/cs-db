const express = require("express");
const axios = require("axios");
const authenticateToken = require("./midleware");
const { users } = require("./database");

const router = express.Router();

// Função para buscar endereço pelo CEP
const searchAddress = async (cep) => {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (response.data.erro) return null;

    return {
      logradouro: response.data.logradouro,
      cidade: response.data.localidade,
      estado: response.data.uf,
    };
  } catch (error) {
    console.error("Erro ao buscar CEP:", error.message);
    return null;
  }
};

// Rota protegida para buscar todos os usuários
router.get("/", authenticateToken, async (req, res) => {
  try {
    const usersWithState = await Promise.all(
      users.map(async (user) => {
        const endereco = await searchAddress(user.cep);
        return {
          ...user,
          logradouro: endereco?.logradouro,
          cidade: endereco?.cidade,
          estado: endereco?.estado,
        };
      })
    );

    res.json(usersWithState);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// Rota pública para buscar um usuário específico

router.get("/:id", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const endereco = user.logradouro
    ? { logradouro: user.logradouro, cidade: user.cidade, estado: user.estado }
    : await searchAddress(user.cep);

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    cep: user.cep,
    logradouro: endereco?.logradouro || "Endereço não encontrado",
    cidade: endereco?.cidade || "Cidade não encontrada",
    estado: endereco?.estado || "Estado não encontrado",
  });
});

// Rota protegida para adicionar usuário
router.post("/addUser", authenticateToken, async (req, res) => {
  console.log("Corpo da requisição recebido:", req.body);

  const { name, email, cep } = req.body;
  if (!name || !email || !cep) {
    return res.status(400).json({ error: "Por favor insira nome e email" });
  }

  const endereco = await searchAddress(cep);
  if (!endereco)
    return res.status(400).json({ error: "Cep inválido ou não existe" });

  const newID = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;
  const newUser = {
    id: newID,
    name,
    email,
    cep,
    logradouro: endereco.logradouro,
    cidade: endereco.cidade,
    estado: endereco.estado,
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// Rota protegida para atualizar usuário
router.put("/:id", authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, cep } = req.body;

  const userIndex = users.findIndex((u) => u.id === id);
  if (userIndex === -1)
    return res.status(404).json({ error: "Usuário não encontrado" });

  if (!name || !email || !cep) {
    return res.status(400).json({ error: "Por favor insira nome e email" });
  }

  const endereco = await searchAddress(cep);
  if (!endereco)
    return res.status(400).json({ error: "Cep inválido ou não existe" });

  users[userIndex] = {
    id,
    name,
    email,
    cep,
    logradouro: endereco.logradouro,
    cidade: endereco.cidade,
    estado: endereco.estado,
  };

  res.json(users[userIndex]);
});

module.exports = router;
