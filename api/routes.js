const express = require("express");
const axios = require("axios");
const authenticateToken = require("./midleware");
const prisma = require("./database");

const router = express.Router();

const searchAddress = async (cep) => {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (response.data.erro) return null;

    return {
      street: response.data.logradouro,
      neighborhood: response.data.bairro,
      city: response.data.localidade,
      state: response.data.uf,
    };
  } catch (error) {
    console.error("Erro ao buscar CEP:", error.message);
    return null;
  }
};

router.get("/", async (req, res) => {
  try {
    // Usando select para garantir que todos os campos sejam buscados corretamente
    const users = await prisma.user.findMany({
      include: {
        addresses: {
          select: {
            id: true,
            zipcode: true,
            street: true,
            neighborhood: true,
            number: true,
            state: true,
            country: true,
            title: true,
            created_At: true,
            updated_At: true

          }
        }
      }
    });
  
    res.json(users);
  } catch (error) {console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// Adicione uma rota para buscar os endereços separadamente para depuração
router.get("/addresses", async (req, res) => {
  try {
    const addresses = await prisma.address.findMany();
    res.json(addresses);
  } catch (error) {
    console.error("Erro ao buscar endereços:", error);
    res.status(500).json({ error: "Erro ao buscar endereços" });
  }
});

// Rota para verificar endereços por userId
// router.get("/user/:id/addresses", async (req, res) => {
//   try {
//     const userId = parseInt(req.params.id);
//     const addresses = await prisma.address.findMany({
//       where: {
//         userId: userId
//       }
//     });
//     res.json(addresses);
//   } catch (error) {
//     console.error(`Erro ao buscar endereços do usuário ${req.params.id}:`, error);
//     res.status(500).json({ error: "Erro ao buscar endereços do usuário" });
//   }
// });

module.exports = router;

// router.get("/:id", authenticateToken, async (req, res) => {
//   const id = parseInt(req.params.id);

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id },
//     });

//     if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

//     const endereco = await searchAddress(user.cep);

//     res.json({
//       id: user.id,
//       name: user.name,
//       email: user.email,
//       cep: user.cep,
//       logradouro: endereco?.logradouro || "Endereço não encontrado",
//       bairro: endereco?.bairro || "Bairro não encontrado",
//       cidade: endereco?.cidade || "Cidade não encontrada",
//       estado: endereco?.estado || "Estado não encontrado",
//     });
//   } catch (error) {
//     console.error("Erro ao buscar usuário:", error);
//     res.status(500).json({ error: "Erro interno do servidor" });
//   }
// });

// router.post("/addUser", authenticateToken, async (req, res) => {
//   console.log("Corpo da requisição recebido:", req.body);

//   try {
//     const { name, email, cep } = req.body;

//     if (!name || !email || !cep) {
//       return res
//         .status(400)
//         .json({ error: "Por favor insira nome, email e cep" });
//     }

//     const endereco = await searchAddress(cep);
//     if (!endereco) {
//       return res.status(400).json({ error: "Cep inválido ou não existe" });
//     }

//     const newUser = await prisma.user.create({
//       data: {
//         name,
//         email,
//         cep,
//         logradouro: endereco.logradouro,
//         bairro: endereco.bairro,
//         cidade: endereco.cidade,
//         estado: endereco.estado,
//       },
//     });

//     res.status(201).json(newUser);
//   } catch (error) {
//     console.error("Erro ao criar usuário:", error);
//     res.status(500).json({ error: "Erro interno do servidor" });
//   }
// });

// router.put("/:id", authenticateToken, async (req, res) => {
//   const id = parseInt(req.params.id);
//   const { name, email, cep } = req.body;

//   try {
//     const userExists = await prisma.user.findUnique({
//       where: { id: Number(id) },
//     });

//     if (!userExists) {
//       return res.status(404).json({ error: "Usuário não encontrado" });
//     }

//     let endereco = {
//       logradouro: userExists.logradouro,
//       bairro: userExists.bairro,
//       cidade: userExists.cidade,
//       estado: userExists.estado,
//     };

//     if (cep && cep !== userExists.cep) {
//       const novoEndereco = await searchAddress(cep);
//       if (!novoEndereco) {
//         return res
//           .status(400)
//           .json({ error: "CEP inválido ou não encontrado" });
//       }
//       endereco = novoEndereco;
//     }

//     const updateUser = await prisma.user.update({
//       where: { id: Number(id) },
//       data: {
//         name: name || userExists.name,
//         email: email || userExists.email,
//         cep: cep || userExists.cep,
//         logradouro: endereco.logradouro || userExists.logradouro,
//         bairro: endereco.bairro || userExists.bairro,
//         cidade: endereco.cidade || userExists.cidade,
//         estado: endereco.estado || userExists.estado,
//       },
//     });

//     res.json(updateUser);
//   } catch (error) {
//     console.error("Erro ao atualizar o usuário:", error);
//     res.status(500).json({ error: "Erro interno do servidor" });
//   }
// });

module.exports = router;

//   const userIndex = users.findIndex((u) => u.id === id);
//   if (userIndex === -1)
//     return res.status(404).json({ error: "Usuário não encontrado" });

//   if (!name || !email || !cep) {
//     return res.status(400).json({ error: "Por favor insira nome e email" });
//   }

//   const endereco = await searchAddress(cep);
//   if (!endereco)
//     return res.status(400).json({ error: "Cep inválido ou não existe" });

//   users[userIndex] = {
//     id,
//     name,
//     email,
//     cep,
//     logradouro: endereco.logradouro,
//     cidade: endereco.cidade,
//     estado: endereco.estado,
//   };

//   res.json(users[userIndex]);
// });
