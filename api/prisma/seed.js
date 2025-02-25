const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function searchAddress(cep) {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (response.data.erro) return null;

    return {
      logradouro: response.data.logradouro,
      cidade: response.data.localidade,
      estado: response.data.uf,
    };
  } catch (error) {
    console.error("Erro ao buscar o CEP:", error.message);
    return null;
  }
}

async function main() {
  const Usersdata = [
    {
      name: "Luis Filipe",
      email: "luis.rufino@exemplo.com",
      cep: "37074010",
    },
    {
      name: "Ana Carolina",
      email: "ana.carolina@exemplo.com",
      cep: "37074010",
    },
  ];

  const userWithAddress = await Promise.all(
    Usersdata.map(async (user) => {
      const endereco = await searchAddress(user.cep);
      return {
        ...user,
        logradouro: endereco?.logradouro || null,
        cidade: endereco?.cidade || null,
        estado: endereco?.estado || null,
      };
    })
  );

  await prisma.user.createMany({
    data: userWithAddress,
  });
  console.log("Usuários inseridos!");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
