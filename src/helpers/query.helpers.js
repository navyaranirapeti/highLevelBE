export const getWalletDetailsQuery =
  "Select * from wallet.wallet_details where id=$1";

export const createWalletQuery =
  "insert into wallet.wallet_details (name, balance) values ($1, $2) returning *";

export const insertTransationQuery =
  "insert into wallet.transactions (wallet_id, transaction_type, amount, description, balance) values ($1, $2, $3, $4, $5) returning *";
export const getRecordsCountQuery =
  "select count(*) as count from wallet.transactions where wallet_id = $1";

export const updateBalanaceQuery =
  "update wallet.wallet_details set balance = $1 where id = $2 returning balance";
