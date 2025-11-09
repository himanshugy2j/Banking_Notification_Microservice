# Banking Notification Service

The **Banking Notification Service** provides notifications for all banking transactions in a modern microservices-based architecture.  
It subscribes to transaction events published via **RabbitMQ**, persists them in its own **PostgreSQL** database, and exposes REST APIs to query notifications. The service is designed for decoupled communication and can be readily extended to deliver notifications via email, SMS, or push.

---

## ✨ Features

- Subscribes to transaction events from RabbitMQ (`transaction_events` queue)
- Stores notifications in PostgreSQL
- REST API for retrieving notifications
- Flexible structure to support future notification channels (email, SMS, push)

---

## 📁 Project Structure

```
.
├── .env
├── docker-compose.yml
├── Dockerfile
├── package.json
├── scripts/
│   └── init.sql
├── src/
│   ├── index.js                  # Entry point
│   ├── db/
│   │   └── connection.js         # PostgreSQL setup
│   ├── routes/
│   │   └── notifications.js      # REST endpoints
│   └── services/
│       ├── eventSubscriber.js    # RabbitMQ consumer logic
│       └── notificationSender.js # Notification delivery stub
```

---

## 🧩 Prerequisites

- Node.js **>= 20**
- npm
- Docker & Docker Compose
- RabbitMQ (included in docker-compose)

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure as needed:

```env
PORT=3003
DB_HOST=notification-db
DB_USER=postgres
DB_PASS=postgres
DB_NAME=notification_db
DB_PORT=5432
RABBITMQ_URL=amqp://admin:Password@transaction-rabbitmq:5672/
```

---

## 🗄️ Database Schema

Notifications are persisted in PostgreSQL.  
The schema is initialized by [`scripts/init.sql`](scripts/init.sql).

| Column           | Type           | Description                  |
|------------------|----------------|------------------------------|
| notification_id  | SERIAL         | Primary key                  |
| event_type       | VARCHAR(255)   | Type of transaction event    |
| account_id       | INTEGER        | Related account ID           |
| amount           | NUMERIC(15,2)  | Transaction amount           |
| message          | TEXT           | Notification message         |
| created_at       | TIMESTAMP      | Auto-generated timestamp     |

---

## 🐳 Running with Docker Compose

### Build and Start All Services

Starts:
- PostgreSQL DB
- RabbitMQ
- Notification Service

```sh
docker-compose up --build
# To run in background:
docker-compose up -d
```

### View Logs

```sh
docker logs -f notification-service
```

Expected output:
- Notifications table ready
- Notification service running on port 3003

---

## 🧠 Running Locally (Without Docker)

1. Install dependencies  
   ```sh
   npm install
   ```
2. Start the service  
   ```sh
   npm run dev
   ```

> Ensure PostgreSQL and RabbitMQ are running and accessible per your `.env` config.

---

## 🌐 API Endpoints

| Method | Endpoint         | Description                  |
|--------|-----------------|------------------------------|
| GET    | /notifications  | List all notifications       |

#### Example

```sh
curl http://localhost:3003/notifications
```

Sample response:
```json
[
  {
    "notification_id": 1,
    "event_type": "DEPOSIT",
    "account_id": 1,
    "amount": 1000,
    "message": "Deposit of 1000 successful",
    "created_at": "2025-11-09T09:30:00.000Z"
  }
]
```

---

## 🔄 Event Flow

1. **Transaction Service** publishes events (`Deposit`, `Withdraw`, `Transfer`)
2. **RabbitMQ** receives events into the `transaction_events` queue
3. **Notification Service** (`eventSubscriber.js`) consumes queue messages
4. Notifications are persisted in **PostgreSQL**
5. (Future) Notifications can be sent externally (email/SMS/push)

```plaintext
Transaction Service → RabbitMQ → Notification Service → PostgreSQL
```

---

## 🧩 Extending Notifications

To integrate real notification channels (email, SMS, push):

Implement logic in `src/services/notificationSender.js`.  
Example stub:

```js
export const sendEmailNotification = (message) => {
  console.log(`📧 Sending email: ${message}`);
};
```

Possible integrations:
- Twilio (SMS)
- SendGrid or AWS SES (Email)
- Firebase Cloud Messaging (Push notifications)

---

## 🧪 Testing

- Run tests with [Jest](https://jestjs.io/):

  ```sh
  npm test
  ```

  > Ensure RabbitMQ and PostgreSQL are running for integration tests.

- If encountering  
  ```
  SyntaxError: Cannot use import statement outside a module
  ```
  add `"type": "module"` to `package.json`.

---

## 🧭 Quick Start

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd notification-service
   ```
2. **Setup environment**
   ```sh
   cp .env.example .env
   # Edit .env as needed
   ```
3. **Run via Docker**
   ```sh
   docker-compose up --build
   ```
4. **Test API**
   ```sh
   curl http://localhost:3003/notifications
   ```

---

## 📜 License

MIT License

---

## 👤 Author

Himanshu S Gautam  
Student ID: 2024TM93048
