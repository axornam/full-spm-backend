const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

app.use(cors());
app.options("*", cors());

//middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errorHandler);

//Routes
const categoriesRoutes = require("./routes/categories");
const projectsRoutes = require("./routes/projects");
const usersRoutes = require("./routes/users");

const api = process.env.API_URL;

app.get(`/`, (req, res, err) => res.send("hello world"));
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/projects`, projectsRoutes);
app.use(`${api}/users`, usersRoutes);
// http://localhost:3000/api/v1/users

let connectionString = "";
const port = process.env.PORT || 3000;

if (process.env.ENV === "dev")
  connectionString = process.env.DB_CONNECTION_STRING;
else if (process.env.ENV === "prod")
  connectionString = process.env.PROD_DB_CONNECTION_STRING;
else return;

//Database
mongoose
  .connect(
    process.env.ENV == "dev"
      ? process.env.DB_CONNECTION_STRING
      : process.env.PROD_DB_CONNECTION_STRING,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "projects-database",
    }
  )
  .then(() => {
    console.log("Database Connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

//Server
app.listen(port, () => {
  console.log("server is running http://localhost:3000");
});
