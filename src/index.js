import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {
  getTransactionsHandler,
  getWalletDetailsHandler,
  setWalletSetUpHandler,
  setWalletTransactionHandler,
} from "./handlers.js";

export const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

app.get("/wallet/:id", async (req, res) => {
  await getWalletDetailsHandler(req, res);
});

app.get("/transactions", async (req, res) => {
  await getTransactionsHandler(req, res);
});

app.post("/setup", async (req, res) => {
  await setWalletSetUpHandler(req, res);
});

app.post("/transact/:walletId", async (req, res) => {
  await setWalletTransactionHandler(req, res);
});

app.listen(port, () => {
  console.log("The server is running at port: ", port);
});
