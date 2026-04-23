const dotenv = require("dotenv");

dotenv.config();

const env = {

  
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),

  jwtSecret: process.env.JWT_SECRET || "123",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",

  db: {
    name: process.env.DB_NAME || "attendance_db",
    user: process.env.DB_USER || "username",
    password: process.env.DB_PASSWORD || "password",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    dialect: process.env.DB_DIALECT || "postgres",
  },

  syncDb: process.env.DB_SYNC === "true",
};

module.exports = env;