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
  const Usersdata = [
    {
      name: "Luis Filipe",
      email: "luis.rufino@exemplo.com",
      addresses: [
        { cep: "37074010", title: "Casa", number: 250 },

        { cep: "37010640", title: "Trabalho", number: 147 },
      ],
    },

    {
      name: "Ana Carolina",
      email: "ana.carolina@exemplo.com",
      addresses: [
        { cep: "37074010", title: "Casa", number: 250 },
        { cep: "37070450", title: "Escola", number: 155 },
      ],
    },
  ];

  for (const userData of Usersdata) {
    let user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!user) {
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          addresses: {
            create: await Promise.all(
              userData.addresses.map(async (addressData) => {
                const addressInfo = await searchAddress(addressData.cep);
                return {
                  zipcode: addressData.cep,
                  street: addressInfo.street,
                  neighborhood: addressInfo.neighborhood,
                  city: addressInfo.city,
                  state: addressInfo.state,
                  country: addressInfo.country,
                  number: addressData.number,
                  title: addressData.title,
                };
              })
            ),
          },
        },
        include: { addresses: true },
      });
      console.log(`Usuário ${user.name} inserido!`);
    }
  }
  console.log("Processo de seed concluído");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

// for (const addressData of userData.addresses){
//   const addressInfo = await searchAddress(addressData.cep)

//   if(addressInfo){
//     await prisma.address.create({
//       data: {
//         user: { connect: {id: user.id}},
//         zipcode: addressData.cep,
//         street: addressInfo.street,
//         neighborhood: addressInfo.neighborhood,
//         state: addressInfo.state,
//         country: addressInfo.country,
//         number: addressData.number,
//         title: addressData.title
//       }
//     }),

//     console.log(`Endereço ${addressData.title} inserido para ${user.name}`);
//   }
// }

//   const userWithAddress = await Promise.all(
//     Usersdata.map(async (user) => {
//       const updateAddresses = await Promise.all(
//       user.addresses.map(async (address) => {
//         const endereco = await searchAddress(address.cep);
//         return {
//           ...user,
//           street: endereco?.logradouro || null,
//           neighborhood: endereco?.bairro || null,
//           city: endereco?.cidade || null,
//           state: endereco?.estado || null,
//           country: endereco?.país || null
//         };
//       })

//     );

//     return {
//       ...user,
//       addresses: updateAddresses,
//     };

//     })

// );

//      for(const user of userWithAddress) {
//       const createdUser = await prisma.user.create({
//         data: {
//           name: user.name,
//           email: user.email,
//           addresses: {
//             create: user.addresses,
//           },
//         },
//       });

//       console.log(`Usuário ${createdUser.name} inserido!`);
//      }
//     }
//   await prisma.user.createMany({
//     data: userWithAddress,
//   });
//   console.log("Usuários inseridos!");
// }
