import {
  getTransactionsRepo,
  getWalletDetailsRepo,
  setWalletSetUpRepo,
  setWalletTransactionRepo,
} from "./repo.js";

export const getWalletDetailsHandler = async (req, res) => {
  const id = req.params.id;
  try {
    if (!id) {
      res.status(400).json({ error: "Please enter a valid id" });
      return;
    }
    const walletDetails = await getWalletDetailsRepo(id);

    if (!walletDetails) {
      res
        .status(400)
        .json({ error: "Cannot find any wallet with the given id" });
      return;
    }

    res.status(200).json({
      body: {
        walletId: walletDetails?.id,
        name: walletDetails?.name,
        balance: walletDetails?.balance,
        createdDate: new Date(walletDetails?.created_at),
        updatedDate: new Date(walletDetails?.updated_at),
      },
    });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: "An error occurred" });
  }
};

export const getTransactionsHandler = async (req, res) => {
  try {
    const limit = +req.query.limit;
    const skip = +req.query.skip || 0;
    const walletId = +req.query.walletId;

    if (!walletId) {
      res.status(400).json({ error: "Enter a valid wallet id" });
      return;
    }
    const { rows, count } = await getTransactionsRepo(walletId, limit, skip);
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
};

export const setWalletSetUpHandler = async (req, res) => {
  try {
    const { name, balance } = req.body;

    if (!name) {
      res
        .status(400)
        .json({ error: "Provide wallet name to create a new wallet" });
      return;
    }

    const transation = await setWalletSetUpRepo(name, balance);

    const setUpDetails = {
      id: transation?.walletDetails?.id,
      balance: transation?.walletDetails?.balance,
      transationId: transation?.transactionDetails?.id,
      name: transation?.walletDetails?.name,
    };
    res.status(200).json({ body: setUpDetails });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: "Error while making transactions" });
  }
};

export const setWalletTransactionHandler = async (req, res) => {
  try {
    const walletId = req.params.walletId;
    const description = req.body?.description;
    const amount = +req.body?.amount;
    const walletData = await getWalletDetailsRepo(walletId);
    const presentBalance = +walletData?.balance;
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
    const { transationData, updatedWalletData } =
      await setWalletTransactionRepo(
        walletId,
        transactionType,
        amount,
        description,
        finalBalance
      );
    const output = {
      transactionId: transationData?.id,
      balance: updatedWalletData?.balance,
    };
    res.status(200).json({ body: output });
  } catch (error) {
    console.log("error: ", error);
    res.status(500).json({ error: "Error while getting transactions" });
  }
};
