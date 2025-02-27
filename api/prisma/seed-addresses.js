require("dotenv").config({ path: "../.env" });
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const prisma = new PrismaClient();

async function searchAddress(cep) {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (response.data.erro) return null;

    return {
      street: response.data.logradouro || "",
      neighborhood: response.data.bairro || "",
      city: response.data.localidade || "",
      state: response.data.uf || "",
      country: "Brasil",
    };
  } catch (error) {
    console.error("Erro ao buscar o CEP:", error.message);
    return null;
  }
}

async function main() {
  const addressesData = [
    {
      email: "luis.rufino@exemplo.com",
      addresses: [
        { cep: "37074010", title: "Casa", number: 250 },
        { cep: "37010640", title: "Trabalho", number: 147 },
      ],
    },

    {
      email: "ana.carolina@exemplo.com",
      addresses: [
        { cep: "37074010", title: "Casa", number: 250 },
        { cep: "37070450", title: "Escola", number: 155 },
      ],
    },
  ];

  for (const addressEntry of addressesData) {
    const user = await prisma.user.findUnique({
      where: { email: addressEntry.email },
      include: { addresses: true },
    });

    console.log(`Usuário encontrado:`, user ? user.id : "Não encontrado");

    if (!user) {
      console.warn(`Usuário com email ${addressEntry.email} não encontrado`);
      continue;
    }

    for (const address of addressEntry.addresses) {
      try {
        const endereco = await searchAddress(address.cep);
        if (!endereco) {
          console.warn(` Dados para o CEP ${address.cep} não encontrados`);
          continue;
        }
        require("dotenv").config({ path: "../.env" });

        console.log(
          `Endereço ${address.title} criado com sucesso: ID${newAddress.id}`
        );
      } catch (error) {
        console.error(`Erro ao criar endereço ${address.title}:`, error);
      }
    }

    const userWithAddresses = await prisma.user.findUnique({
      where: { id: user.id },
      include: { addresses: true },
    });

    console.log(
      `Endereços inseridos para ${user.name}:`,
      userWithAddresses.addresses.length > 0
        ? userWithAddresses.addresses
            .map((a) => `${a.title} (${a.id})`)
            .join(",")
        : "Nenhum endereço inserido!"
    );
  }

  console.log("Processo de seed de endereços concluído!");
}

console.log("Endereços inseridos com sucesso!");

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
