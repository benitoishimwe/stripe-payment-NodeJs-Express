# Testing Guide

## Prerequisites

- Server running locally (`npm start`)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) installed and authenticated (`stripe login`)
- `.env` configured with your test keys

---

## 1. Start Webhook Forwarding

In a separate terminal:

```bash
stripe listen --forward-to localhost:5000/webhook
```

Copy the `whsec_...` secret printed and set it as `STRIPE_WEBHOOK_SECRET` in your `.env`, then restart the server.

---

## 2. Test Cards

All test cards use any future expiry date (e.g. `12/34`) and any 3-digit CVC.

| Scenario                        | Card Number           |
|---------------------------------|-----------------------|
| Successful payment              | `4242 4242 4242 4242` |
| Payment requires authentication | `4000 0025 0000 3155` |
| Card declined                   | `4000 0000 0000 9995` |
| Insufficient funds              | `4000 0000 0000 9995` |
| Incorrect CVC                   | `4000 0000 0000 0101` |

---

## 3. Manual Payment Flow

1. Open [http://localhost:5000](http://localhost:5000)
2. Enter test card `4242 4242 4242 4242`, any future expiry, any CVC
3. Click **Pay**
4. On success the page shows a link to the payment in the Stripe Dashboard

In your server terminal you should see:
```
PaymentIntent succeeded: pi_xxxxx
```

In the Stripe CLI terminal you should see:
```
--> payment_intent.created [evt_xxxxx]
--> payment_intent.succeeded [evt_xxxxx]
```

---

## 4. Trigger Webhook Events Manually

You can replay any event type without going through the UI:

```bash
stripe trigger payment_intent.succeeded
```

---

## 5. Verify Webhook Signature Rejection

Send a request with a bad signature to confirm the guard works:

```bash
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid" \
  -d '{"type":"payment_intent.succeeded"}'
```

Expected response: `HTTP 400 Webhook Error: No signatures found matching...`

---

## 6. Check Stripe Dashboard

All test payments appear at [https://dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments).
