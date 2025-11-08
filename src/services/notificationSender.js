import db from "../db/connection.js";

/**
 * Save notification to DB and log it (simulate SMS/email)
 */
export const sendNotification = async (eventType, accountId, amount, message) => {
  try {
    await db.query(
      `INSERT INTO notifications (event_type, account_id, amount, message)
       VALUES ($1, $2, $3, $4)`,
      [eventType, accountId, amount, message]
    );
    console.log(`📩 Notification for account ${accountId}: [${eventType}] ${message} (Amount: ${amount})`);
  } catch (err) {
    console.error("❌ Failed to send notification:", err);
  }
};

/**
 * Handle all transaction events
 */
export const handleTransactionEvent = async (event) => {
  const { txn, debitTxn, creditTxn, account_id, amount, reason, txn_type } = event.payload || {};
  const type = event.type;

  switch (type) {
    case "transaction.deposit":
      if (txn) await sendNotification("DEPOSIT", txn.account_id, txn.amount, `Deposit of ${txn.amount} successful`);
      break;

    case "transaction.withdraw":
      if (txn) await sendNotification("WITHDRAW", txn.account_id, txn.amount, `Withdrawal of ${txn.amount} successful`);
      break;

    case "transaction.transfer":
      if (debitTxn && creditTxn) {
        await sendNotification("TRANSFER_OUT", debitTxn.account_id, debitTxn.amount, `Transferred ${debitTxn.amount} to account ${creditTxn.account_id}`);
        await sendNotification("TRANSFER_IN", creditTxn.account_id, creditTxn.amount, `Received ${creditTxn.amount} from account ${debitTxn.account_id}`);
      }
      break;

    case "transaction.failed":
      if (account_id && amount && txn_type) {
        await sendNotification("FAILED_TRANSACTION", account_id, amount, `${txn_type} failed: ${reason}`);
      }
      break;

    default:
      console.warn("⚠️ Unhandled transaction event type:", type);
      break;
  }
};
