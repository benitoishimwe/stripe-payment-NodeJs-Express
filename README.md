# Stripe Payment — Node.js & Express

A Node.js and Express backend implementing Stripe payment processing — supports payment intents, webhook handling, and order management.

---

## How the Stripe Integration Works

The payment flow follows Stripe's recommended server-confirmed pattern:

```
1. Browser loads checkout page
       ↓
2. Frontend POSTs cart data to POST /stripe
       ↓
3. Server creates a PaymentIntent and returns clientSecret
       ↓
4. Stripe.js (frontend) collects card details and calls stripe.confirmCardPayment(clientSecret)
       ↓
5. Stripe processes the charge and POSTs a payment_intent.succeeded event to POST /webhook
       ↓
6. Server verifies the webhook signature and fulfils the order
```

The webhook is the authoritative confirmation step. The frontend result is optimistic only — order fulfilment must be triggered by the verified webhook event.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Runtime     | Node.js 14.x                      |
| Framework   | Express 4                         |
| Payments    | Stripe SDK v8 (`stripe` npm pkg)  |
| Frontend    | Vanilla JS + Stripe.js v3         |
| Config      | dotenv                            |
| Dev server  | nodemon                           |

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

| Variable               | Description                                              |
|------------------------|----------------------------------------------------------|
| `STRIPE_SECRET_KEY`    | Stripe secret key (starts with `sk_test_` or `sk_live_`) |
| `STRIPE_WEBHOOK_SECRET`| Webhook signing secret from Stripe CLI or Dashboard      |
| `PORT`                 | Port the server listens on (default: `5000`)             |

---

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in your keys
cp .env.example .env

# 3. Start the dev server
npm start
# → Server is listening on port 5000...

# 4. In a separate terminal, forward Stripe events to the local webhook endpoint
stripe listen --forward-to localhost:5000/webhook
# → Copy the "webhook signing secret" printed (whsec_...) and set it as STRIPE_WEBHOOK_SECRET in .env
```

Open [http://localhost:5000](http://localhost:5000) to see the checkout page.

---

## API Endpoints

| Method | Path       | Description                                          |
|--------|------------|------------------------------------------------------|
| POST   | `/stripe`  | Creates a PaymentIntent, returns `{ clientSecret }` |
| POST   | `/webhook` | Receives and verifies Stripe webhook events          |

### POST /stripe — Request Body

```json
{
  "purchase": [{ "id": "1", "name": "t-shirt", "price": 1999 }],
  "total_amount": 10998,
  "shipping_fee": 1099
}
```

All amounts are in **cents** (USD).

---

## Security

Webhook signature verification is implemented to prevent fraudulent payment confirmations. Every event received at `POST /webhook` is verified against the `STRIPE_WEBHOOK_SECRET` using `stripe.webhooks.constructEvent()` before any order action is taken. Requests with an invalid or missing signature are rejected with HTTP 400.

The webhook route uses `express.raw()` (not `express.json()`) so the raw request body is preserved — Stripe's signature check requires the unmodified body bytes.
