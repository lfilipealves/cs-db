const express = require("express");
const axios = require("axios");
const authenticateToken = require("./midleware");
const prisma = require("./database");
const app = express();

const router = express.Router();
app.use(express.json());


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
        },
        phones: true
      }
    });
  
    res.json(users);
  } catch (error) {console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// Rota para buscar somente os endereços

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
router.get("/addresses/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const addresses = await prisma.address.findMany({
      where: {
        userId: userId
      }
    });
    res.json(addresses);
  } catch (error) {
    console.error(`Erro ao buscar endereços do usuário ${req.params.id}:`, error);
    res.status(500).json({ error: "Erro ao buscar endereços do usuário" });
  }
});



// Rota para buscar o user pelo id

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {addresses: true, phones: true}
     

    });

    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
    
    console.log("Usuário encontrado", user.id, user.name);

    const userAddress = user.addresses[0];

    if (!userAddress) {
     return res.status(404).json({error: "Endereço do usuário não encontrado"});
    }

    console.log("Zipcode do usuário:", userAddress.zipcode)

    const enderecos = await Promise.all(
      user.addresses.map(async (address) => {
        const cepInfo = await searchAddress(address.zipcode);
        return {
          id: address.id,
          zipcode: address.zipcode,
          street: cepInfo?.street || "Endereço não encontrado",
          neighborhood: cepInfo?.neighborhood || "Bairro não encontrado",
          city: cepInfo?.city || "Cidade não encontrado",
          state: cepInfo?.state || "Estado não encontrado",
          country: "Brasil"
        };

      })
    );

  

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      addresses: enderecos,
      phones: user.phones
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Usado para adicionar um novo Usuário

router.post("/addUser", async (req, res) => {
  console.log("Corpo da requisição recebido:", req.body);

  try {
    const { name, email, zipcode } = req.body;

    if (!name || !email || !zipcode) {
      return res
        .status(400)
        .json({ error: "Por favor insira nome, email e cep" });
    }

    const endereco = await searchAddress(zipcode);
    if (!endereco) {
      return res.status(400).json({ error: "Cep inválido ou não existe" });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        zipcode,
        street: endereco.logradouro,
        neighborhood: endereco.bairro,
        city: endereco.cidade,
        state: endereco.estado,
        country: "Brasil"
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email } = req.body;

  try {
    // Busca o usuário e seus endereços
    const userExists = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!userExists) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Atualiza os dados do usuário
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name: name || userExists.name,
        email: email || userExists.email,
      },
      include: { addresses: true }, 
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar o usuário:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});


router.put("/:userId/address/:addressId", async (req, res) => {

  const userId = parseInt(req.params.userId);
  const addressId = parseInt(req.params.addressId);
  const { zipcode, street, number, neighborhood, city, state, country, title } = req.body;

  try {
    const addressExists = await prisma.address.findFirst({
      where: { id: addressId, userId: userId },
    });

    if (!addressExists) {
      return res.status(404).json({ error: "Endereço não encontrado para este usuário" });
    }

    let updateData = {
      zipcode: zipcode || addressExists.zipcode,
      street: street || addressExists.street,
      number: number || addressExists.number,
      neighborhood: neighborhood || addressExists.neighborhood,
      city: city || addressExists.city,
      state: state || addressExists.state,
      title: title || addressExists.title,
      country: "Brasil",
    };

    console.log("📦 Dados recebidos no body:", req.body);
    console.log("🔢 CEP recebido:", zipcode);
    console.log("📌 CEP no banco:", addressExists.zipcode);
    console.log("❓ CEPs são diferentes?", zipcode !== addressExists.zipcode);

    // Apenas busca um novo endereço se o CEP for diferente do banco
    if (zipcode) { 
      console.log("🟡 CEP diferente detectado! Buscando novo endereço para:", zipcode);

      const newAddress = await searchAddress(zipcode);
      console.log("🔍 Resultado da busca:", newAddress);

      if (!newAddress) {
        return res.status(400).json({ error: "CEP inválido ou não encontrado" });
      }

      updateData = {
        ...updateData,
        street: newAddress.street || addressExists.street,
        neighborhood: newAddress.neighborhood || addressExists.neighborhood,
        city: newAddress.city || addressExists.city,
        state: newAddress.state || addressExists.state,
      };
    }

    console.log("🟢 Dados antes da atualização:", updateData);

    const updateAddresses = await prisma.address.update({
      where: { id: addressId },
      data: updateData,
    });

    res.json(updateAddresses);
  } catch (error) {
    console.error("Erro ao atualizar o endereço:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});


router.post("/:userId/address", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const {zipcode, street, number, neighborhood, city, state, title} = req.body
  
  
  try {
    const userExists = await prisma.user.findUnique({
      where: { id: userId},
    });

    if(!userExists) {
      return res.status(404).json({error: "Usuário não encontrado"});

    }

    let addressData = {
      userId,
      zipcode,
      street,
      number,
      neighborhood,
      city,
      state,
      title: title || "Meu endereço",
      country: "Brasil",
    };

    console.log("Dados recebidos no body:", req.body);

    if(zipcode) {
      console.log("Buscando endereço para o CEP:", zipcode);

      const addressInfo = await searchAddress(zipcode);
      console.log("Resultado da busca:", addressInfo);

      if(!addressInfo){
        return res.status(400).json({error: "CEP inválido ou não encontrado"});
      }

      addressData = {
        ...addressData,
        street: street || addressInfo.street,
        neighborhood: neighborhood || addressInfo.neighborhood,
        city: city || addressInfo.city,
        state: state || addressInfo.state,
      };

    } else {
      if(!street || !city || !state) {
        return res.status(400).json({
          error: "É necessário fornecer CEP ou os campos: rua, cidade e estado"
        });
      }
    }
    
    const newAddress = await prisma.address.create({
      data: addressData
    });

    res.status(201).json(newAddress);
  } catch (error) {
    console.error("Erro ao adicionar endereço:", error);
    res.status(500).json({error: "Erro interno do servidor"})
  }
});

router.post("/:userId/phone", async(req, res)=> {
  const userId = parseInt(req.params.userId);
  const { phone, phoneTitle } = req.body;

  try {
    const userExists = await prisma.user.findUnique({
      where: {id: userId},

    });

    if(!userExists){
      return res.status(404).json({error: "Usuario não encontrado"});
    }

    if(!phone || phone.trim() === "") {
      return res.status(400).json({error: "Número de telefone é obrigatório"});
    }

   const newPhone = await prisma.phone.create({
    data: {
      userId,
      number: phone,
      type: phoneTitle || "celular"
    }
   });
   
   res.status(201).json(newPhone);
  } catch (error) {
    console.error("Erro ao adicionar telefone:", error);
    res.status(500).json({error: "Erro interno do servidor"});
  }
});

router.put("/:userId/phone/:phoneId", async (req,res) => {
  const userId = parseInt(req.params.userId);
  const phoneId = parseInt(req.params.phoneId);
  const {phone, phoneTitle} = req.body;

  try {
    const phoneExists = await prisma.phone.findUnique({
      where: {id: phoneId},
    });

    if(!phoneExists || phoneExists.userId !== userId){
      return res.status(404).json({error: "Telefone não encontrado para este usuário"});
    }

    if (!phone || phone.trim() === ""){
      return res.status(400).json({error: "Número de telefone é obrigatório"});
    }

    const updatePhone = await prisma.phone.update({
      where: {id: phoneId},
      data: {
        number: phone,
        type: phoneTitle || "Celular",
      },
    });

    res.status(200).json(updatePhone);
  } catch (error) {
    console.error("Erro ao atualizar telefone:", error);
    res.status(500).json({error: "Erro interno do servidor"});
  }
});

module.exports = router;