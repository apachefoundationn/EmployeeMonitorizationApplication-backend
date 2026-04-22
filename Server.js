
const app = require("./app");
const sequelize = require("./config/database");
const env = require("./config/env");
require("./models/TeamTask");
require("./models/TeamTaskResponse");
require("./models/ManagerTaskNotification");

const startServer = async () => {
  try {
    await sequelize.authenticate();
    if (env.syncDb) {
      await sequelize.sync({ alter: true });
      console.log("Database synced");
    }
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();