const axios = require('axios');
const crypto = require('crypto');

const API_URL = 'https://api.heleket.com/v1/payment';

function sign(bodyObj, apiKey) {
  const json = JSON.stringify(bodyObj);
  const b64 = Buffer.from(json, 'utf8').toString('base64');
  return crypto.createHash('md5').update(b64 + apiKey).digest('hex');
}

async function createInvoice({ orderId, amountUsd, callbackUrl, returnUrl, payerEmail }) {
  const merchant = process.env.HELEKET_MERCHANT_ID;
  const apiKey = process.env.HELEKET_API_KEY;
  if (!merchant || !apiKey) throw new Error('Heleket credentials missing');

  const body = {
    amount: Number(amountUsd).toFixed(2),
    currency: 'USD',
    order_id: orderId,
    lifetime: 3600,
    url_callback: callbackUrl,
    url_return: returnUrl,
    url_success: returnUrl,
  };
  if (payerEmail) body.payer_email = payerEmail;

  const signature = sign(body, apiKey);

  const { data } = await axios.post(API_URL, body, {
    headers: {
      merchant,
      sign: signature,
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });
  return data?.result || data;
}

function verifyWebhook(payload, apiKey) {
  if (!payload || typeof payload !== 'object' || !payload.sign) return false;
  const { sign: received, ...rest } = payload;
  const expected = sign(rest, apiKey);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

module.exports = { createInvoice, verifyWebhook, sign };
