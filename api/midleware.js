const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET || "seuSegredoSeguro";

// Middleware para autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acesso negado! Token não fornecido." });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido!" });
    }
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
