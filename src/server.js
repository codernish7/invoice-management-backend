const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3000;

async function startServer(params) {
  try {
    await pool.query("SELECT NOW()");
    console.log("connected to pgsql db");
    app.listen(PORT, () => {
      console.log(`server is listening on port ${PORT}`);
    });
  } catch (error) {
    console.log("connection to db failed");
    console.log(error);
  }
}
startServer();
