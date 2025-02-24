const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;




// let users = [
//   {
//     id: 1,
//     name: "Luis Filipe",
//     email: "luis.rufino@exemplo.com",
//     cep: "37074010",
//   },
//   {
//     id: 2,
//     name: "Ana Carolina",
//     email: "ana.carolina@exemplo.com",
//     cep: "37074010",
//   },
// ];

// module.exports = { users };
