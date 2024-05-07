import express from "express";
import pg from "pg";
import cors from "cors";
import bodyParser from "body-parser";

export const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "wallet",
  password: "postgres",
  port: 5432,
});

const insertTransationQuery =
  "insert into wallet.transactions (wallet_id, transaction_type, amount, description, balance) values ($1, $2, $3, $4, $5) returning *";

app.get("/wallet/:id", async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) {
      res.status(400).json({ error: "Enter a valid id" });
      return;
    }
    const query = "Select * from wallet.wallet_details where id=$1";
    const { rows } = await pool.query(query, [id]);
    const walletDetails = rows.map((w) => ({
      wallet_id: w?.id,
      name: w?.name,
      balance: w?.balance,
      createdDate: new Date(w?.created_at),
      updatedDate: new Date(w?.updated_at),
    }));
    res.status(200).json({ body: walletDetails });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/transactions", async (req, res) => {
  try {
    const limit = +req.query.limit;
    const skip = +req.query.skip || 0;
    const walletId = +req.query.walletId;

    if (!walletId) {
      res.status(400).json({ error: "Enter a valid wallet id" });
      return;
    }

    const recordsCountQuery =
      "select count(*) as count from wallet.transactions where wallet_id = $1";
    const countVal = await pool.query(recordsCountQuery, [walletId]);
    const count = countVal?.rows?.[0]?.count;

    let transactionsQuery =
      "SELECT * FROM wallet.transactions WHERE wallet_id = $1 ORDER BY id DESC OFFSET $2";
    transactionsQuery = !!limit
      ? `${transactionsQuery} LIMIT $3`
      : transactionsQuery;
    const { rows } = await pool.query(
      transactionsQuery,
      !!limit ? [walletId, skip, limit] : [walletId, skip]
    );
    const transactionData = rows?.map((t) => ({
      id: t.id,
      walletId: t.wallet_id,
      amount: t.amount,
      date: t.transaction_date,
      balance: t.balance,
      description: t.description,
      type: t.transaction_type,
    }));
    res.status(200).json({ body: { transactionData, count } });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: "Error while getting transactions" });
  }
});

app.post("/setup", async (req, res) => {
  try {
    const { name, balance } = req.body;

    if (!name) {
      res
        .status(400)
        .json({ error: "Provide wallet name to create a new wallet" });
      return;
    }

    const createWalletQuery =
      "insert into wallet.wallet_details (name, balance) values ($1, $2) returning *";
    const { rows } = await pool.query(createWalletQuery, [name, balance]);
    const transationData = await pool.query(insertTransationQuery, [
      rows?.[0]?.id,
      "credit",
      rows[0]?.balance,
      "Initial Transation",
      rows[0]?.balance,
    ]);
    4;
    const transationRows = transationData?.rows?.[0];
    const setUpDetails = {
      id: rows?.[0]?.id,
      balance: rows?.[0]?.balance,
      transationId: transationRows?.id,
      name: rows?.[0]?.name,
    };
    res.status(200).json({ body: setUpDetails });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: "Error while making transactions" });
  }
});

app.post("/transact/:walletId", async (req, res) => {
  try {
    const walletId = req.params.walletId;
    const description = req.body?.description;
    const amount = +req.body?.amount;
    const getWalletBalanceQuery =
      "select balance from wallet.wallet_details where id = $1";
    const walletData = await pool.query(getWalletBalanceQuery, [walletId]);
    const presentBalance = +walletData?.rows?.[0]?.balance;
    const finalBalance = presentBalance + amount;
    let transactionType;
    if (amount < 0) {
      transactionType = "debit";
    } else {
      transactionType = "credit";
    }
    if (transactionType === "debit" && presentBalance < -amount) {
      console.log();
      res
        .status(400)
        .json({ error: "The debit amount is execeeding the balance" });
      return;
    }

    const transationData = await pool.query(insertTransationQuery, [
      walletId,
      transactionType,
      Math.abs(amount),
      description,
      finalBalance,
    ]);
    const transationRows = transationData?.rows?.[0];
    const updateBalanaceQuery =
      "update wallet.wallet_details set balance = $1 where id = $2 returning balance";
    const updatedWalletData = await pool.query(updateBalanaceQuery, [
      finalBalance,
      walletId,
    ]);
    const output = {
      transactionId: transationRows?.id,
      balance: updatedWalletData?.rows?.[0]?.balance,
    };
    res.status(200).json({ body: output });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: "Error while getting transactions" });
  }
});

app.listen(port, () => {
  console.log("The server is running at port: ", port);
});

// create table wallet.wallet_details (
// 	"id" serial primary key,
// 	"name" varchar(100) not null,
// 	"balance" decimal(15,4) not null,
// 	"created_at" timestamp default current_timestamp,
// 	"updated_at" timestamp default current_timestamp
// )

// CREATE TABLE wallet.transactions (
//     id SERIAL PRIMARY KEY,
//     wallet_id INT NOT NULL,
//     transaction_type VARCHAR(10) NOT NULL,
//     amount DECIMAL(15, 4) NOT NULL,
//     description TEXT,
//     transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );

// const myHeaders = new Headers();
// myHeaders.append("Content-Type", "application/json");

// const raw = JSON.stringify({
//   name: "Alpha",
//   balance: 200
// });

// const requestOptions = {
//   method: "POST",
//   headers: myHeaders,
//   body: raw,
//   redirect: "follow"
// };

// fetch("http://localhost:3000/setup", requestOptions)
//   .then((response) => response.text())
//   .then((result) => console.log(result))
//   .catch((error) => console.error(error));

// const myHeaders = new Headers();
// myHeaders.append("Content-Type", "application/json");

// const raw = JSON.stringify({
//   description: "Testing with API1",
//   amount: 200
// });

// const requestOptions = {
//   method: "POST",
//   headers: myHeaders,
//   body: raw,
//   redirect: "follow"
// };

// fetch("http://localhost:3000/transact/10", requestOptions)
//   .then((response) => response.text())
//   .then((result) => console.log(result))
//   .catch((error) => console.error(error));

// http://localhost:3000/transactions?walletId&limit=0&skip=0
