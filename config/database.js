const { Sequelize } = require("sequelize");
const env = require("./env");

// const sequelize = new Sequelize(
//   env.db.name,
//   env.db.user,
//   env.db.password,
//   {
//     host: env.db.host,
//     port: env.db.port,
//     dialect: env.db.dialect,
//     logging: false,
//   }
// );




const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

module.exports = sequelize;