import amqplib from "amqplib";
import { handleTransactionEvent } from "./notificationSender.js";

const RABBIT_URL = process.env.RABBITMQ_URL || "amqp://localhost";
const QUEUE_NAME = "transaction_events";
const DLQ_NAME = "transaction_events_dlq";
const MAX_RETRIES = 5;

export const startSubscriber = async () => {
  try {
    const connection = await amqplib.connect(RABBIT_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true });
    await channel.assertQueue(DLQ_NAME, { durable: true });
    console.log(`📩 Listening on queue: ${QUEUE_NAME}`);

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (!msg) return;

        const event = JSON.parse(msg.content.toString());
        let retryCount = msg.properties.headers?.["x-retry"] || 0;

        try {
          await handleTransactionEvent(event);
          channel.ack(msg);
        } catch (err) {
          console.error(`❌ Failed to process event type=${event.type} (attempt ${retryCount + 1}):`, err);

          if (retryCount < MAX_RETRIES) {
            // Requeue with incremented retry count
            channel.sendToQueue(
              QUEUE_NAME,
              Buffer.from(JSON.stringify(event)),
              { headers: { "x-retry": retryCount + 1 }, persistent: true }
            );
          } else {
            console.error("⚠️ Max retries reached. Sending to DLQ:", event);
            channel.sendToQueue(DLQ_NAME, Buffer.from(JSON.stringify(event)), { persistent: true });
          }

          channel.ack(msg); // ack original to avoid infinite loop
        }
      },
      { noAck: false }
    );
  } catch (err) {
    console.error("❌ Subscriber failed:", err);
  }
};
