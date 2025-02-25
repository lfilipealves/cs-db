const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client")
require("dotenv").config();


const prisma = new PrismaClient();
const secretKey = process.env.JWT_SECRET || "seuSegredoSeguro";

const login = async (req, res) => {
  const { email } = req.body;

  // Usuario existe no banco de dados?
  try {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  // Gera o token
  const token = jwt.sign(
    { id: user.id, nome: user.name, email: user.email },
    secretKey,
    {
      expiresIn: "1h",
    }
  );

  res.json({ message: "Login realizado com sucesso!", token });
} catch (error) {
  console.error("Erro no login:", error);
  res.status(500).json({error: "Erro no servidor"});
}
};

module.exports = { login };
