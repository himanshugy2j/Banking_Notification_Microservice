import express from "express";
import amqp from "amqplib";
import { handleTransactionEvent } from "./services/notificationSender.js";
import { initDB } from "./db/connection.js";

const app = express();
const PORT = process.env.PORT || 3003;
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const QUEUE_NAME = "transaction_events";
const DLQ_NAME = "transaction_events_dlq";
const MAX_RETRIES = 5;

app.use(express.json());

// ==============================
// RabbitMQ subscriber function
// ==============================
const startSubscriber = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Assert main queue and dead-letter queue
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.assertQueue(DLQ_NAME, { durable: true });

    console.log(`📥 Listening for events on queue: ${QUEUE_NAME}`);

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (!msg) return;

        const event = JSON.parse(msg.content.toString());
        let retryCount = msg.properties.headers?.["x-retry"] || 0;

        try {
          // Handle all transaction events (deposit, withdraw, transfer, failed)
          await handleTransactionEvent(event);
          channel.ack(msg); // mark message as processed
        } catch (err) {
          console.error(`❌ Failed to process event type=${event.type} (attempt ${retryCount + 1}):`, err);

          if (retryCount < MAX_RETRIES) {
            // Requeue with incremented retry count
            channel.sendToQueue(
              QUEUE_NAME,
              Buffer.from(JSON.stringify(event)),
              { headers: { "x-retry": retryCount + 1 }, persistent: true }
            );
            console.log(`🔄 Requeued event for retry #${retryCount + 1}`);
          } else {
            // Send to DLQ after max retries
            channel.sendToQueue(DLQ_NAME, Buffer.from(JSON.stringify(event)), { persistent: true });
            console.warn("⚠️ Max retries reached. Event sent to DLQ:", event);
          }

          channel.ack(msg); // ack original message to avoid infinite loop
        }
      },
      { noAck: false } // manual ack
    );
  } catch (err) {
    console.error("❌ Subscriber failed:", err);
    process.exit(1);
  }
};

// ==============================
// Start server and subscriber
// ==============================
const startServer = async () => {
  try {
    await initDB();
    console.log("✅ Connected to PostgreSQL");

    await startSubscriber();
    console.log("📩 RabbitMQ subscriber started");

    app.listen(PORT, () => {
      console.log(`🚀 Notification service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start Notification Service:", err);
    process.exit(1);
  }
};

startServer();
