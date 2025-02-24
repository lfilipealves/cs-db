const jwt = require("jsonwebtoken");
require("dotenv").config();



const secretKey = process.env.JWT_SECRET || "seuSegredoSeguro";

const login = (req, res) => {
  const { email } = req.body;

  // Usuario existe no banco de dados?

  const user = users.find((u) => u.email === email);

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
};

module.exports = { login };
