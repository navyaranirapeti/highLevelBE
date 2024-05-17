import pgPromise from "pg-promise";
import {
  createWalletQuery,
  getRecordsCountQuery,
  getWalletDetailsQuery,
  insertTransationQuery,
  updateBalanaceQuery,
} from "./helpers/query.helpers.js";

const pgp = pgPromise();

const db = pgp({
  connectionString: "postgres://postgres:postgres@localhost:5432/wallet",
});

export const getWalletDetailsRepo = async (id) => {
  return db.oneOrNone(getWalletDetailsQuery, [id]);
};

export const setWalletSetUpRepo = async (name, balance) => {
  const transation = await db.tx(async (t) => {
    const walletDetails = await t.oneOrNone(createWalletQuery, [name, balance]);

    const transactionDetails = t.oneOrNone(insertTransationQuery, [
      walletDetails?.id,
      "credit",
      walletDetails?.balance,
      "Initial Transation",
      walletDetails?.balance,
    ]);

    return { walletDetails, transactionDetails };
  });
  return transation;
};

export const getTransactionsRepo = async (walletId, limit, skip) => {
  return await db.tx(async (t) => {
    const countVal = await t.one(getRecordsCountQuery, [walletId]);

    let transactionsQuery =
      "SELECT * FROM wallet.transactions WHERE wallet_id = $1 ORDER BY id DESC OFFSET $2";
    transactionsQuery = !!limit
      ? `${transactionsQuery} LIMIT $3`
      : transactionsQuery;

    const rows = await t.manyOrNone(
      transactionsQuery,
      !!limit ? [walletId, skip, limit] : [walletId, skip]
    );
    return { count: countVal?.count, rows: rows };
  });
};

export const setWalletTransactionRepo = async (
  walletId,
  transactionType,
  amount,
  description,
  finalBalance
) => {
  return await db.tx(async (t) => {
    const transationData = await t.oneOrNone(insertTransationQuery, [
      walletId,
      transactionType,
      Math.abs(amount),
      description,
      finalBalance,
    ]);

    const updatedWalletData = await t.oneOrNone(updateBalanaceQuery, [
      finalBalance,
      walletId,
    ]);

    return { transationData, updatedWalletData };
  });
};
