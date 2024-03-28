import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
import cors  from "cors";
import http from 'http';

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PORT
} = process.env;
const base = "https://api-m.sandbox.paypal.com";
const app = express();



// your express configuration here

var httpServer = http.createServer(app);

app.use(cors);
// host static files
app.use(express.static("client"));

// parse post params sent in body in json format
app.use(express.json());

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
    ).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

/**
 * Create a subscription for the customer
 * @see https://developer.paypal.com/docs/api/subscriptions/v1/#subscriptions_create
 */
const createSubscription = async (userAction = "SUBSCRIBE_NOW") => {
  const url = `${base}/v1/billing/subscriptions`;
  const accessToken = await generateAccessToken();
 // const {id} = await createPlan();
   const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${accessToken}`,
      Accept: "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      "plan_id": 'plan-5454545',
      "application_context": {
        "user_action": userAction,
      },
    }),
  });

  return handleResponse(response);
};

const handleResponse = async (response) => {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
};

app.post("/api/paypal/create-subscription", async (req, res) => {
  try {
    const { jsonResponse, httpStatusCode } = await createSubscription();
    res.status(httpStatusCode).json(jsonResponse);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

const createProduct = async (req, res) => {
  try{
    const url = `${base}/v1/catalogs/products`;
  
    const response  = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'PayPal-Request-Id': 'PRODUCT-18062019-001',
          'Prefer': 'return=representation'
      },
      body: JSON.stringify({ "name": "Video Streaming Service",
       "description": "Video streaming service",
        "type": "SERVICE",
        "category": "SOFTWARE",
         "image_url": "https://example.com/streaming.jpg", 
         "home_url": "https://example.com/home" })
  });    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
  
  }

app.get("/api/paypal/create-plan", async (req, res) => {
    console.log('plan api');
try{
  const {id} = await createProduct();
console.log('product id:', id);

  const url = `${base}/v1/billing/plans`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'PayPal-Request-Id': 'PLAN-18062019-001',
        'Prefer': 'return=representation'
    },
      body: JSON.stringify({ "product_id": id,
           "name": "Video Streaming Service Plan", 
            "description": "Video Streaming Service basic plan", 
              "status": "ACTIVE", 
              "billing_cycles": [ { "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
                   "tenure_type": "TRIAL", "sequence": 1, "total_cycles": 2, 
                   "pricing_scheme": { "fixed_price": { "value": "3", "currency_code": "USD" } } }, 
                   
                   { "frequency": { "interval_unit": "MONTH", "interval_count": 1 }, 
                   "tenure_type": "TRIAL", "sequence": 2, "total_cycles": 3,
                    "pricing_scheme": { "fixed_price": { "value": "6", "currency_code": "USD" } } },
                     { "frequency": { "interval_unit": "MONTH", "interval_count": 1 },
                      "tenure_type": "REGULAR", "sequence": 3, "total_cycles": 12, 
                      "pricing_scheme": { "fixed_price": { "value": "10", "currency_code": "USD" } } } ], 
                      "payment_preferences": { "auto_bill_outstanding": true, 
                      "setup_fee": { "value": "10", "currency_code": "USD" }, 
                      "setup_fee_failure_action": "CONTINUE", "payment_failure_threshold": 3 }, 
                      "taxes": { "percentage": "10", "inclusive": false } })
  });
  const data = await response.json();
  return data;
} catch (error) {
  console.error("Failed to get plan:", error);
}

})

httpServer.listen(3000, () => {
  console.log(`Node server listening at http://localhost:3000`);
});
