/**
 * One-time OAuth script to get a Shopify Admin API access token.
 *
 * Usage:
 *   npm run auth
 *
 * This starts a local server, opens the Shopify OAuth page in your browser,
 * and saves the access token to .env after you authorize.
 */

import "dotenv/config";
import express from "express";
import crypto from "crypto";
import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENV_PATH = join(ROOT, ".env");

const STORE = process.env.SHOPIFY_STORE;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const SCOPES = "write_content,read_content";
const REDIRECT_URI = "http://localhost:3000/callback";

if (!STORE || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing SHOPIFY_STORE, SHOPIFY_CLIENT_ID, or SHOPIFY_CLIENT_SECRET in .env");
  process.exit(1);
}

const app = express();
const nonce = crypto.randomBytes(16).toString("hex");

app.get("/", (_req, res) => {
  const authUrl =
    `https://${STORE}/admin/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${nonce}`;

  console.log(`\nRedirecting to Shopify OAuth...\n`);
  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const { code, state, hmac } = req.query;

  if (state !== nonce) {
    res.status(403).send("State mismatch — possible CSRF. Try again.");
    return;
  }

  // Exchange the code for a permanent access token
  const tokenUrl = `https://${STORE}/admin/oauth/access_token`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Token exchange failed:", err);
    res.status(500).send("Token exchange failed. Check console.");
    return;
  }

  const { access_token } = await response.json();

  // Save to .env
  let envContent = readFileSync(ENV_PATH, "utf-8");
  envContent = envContent.replace(
    /^SHOPIFY_ACCESS_TOKEN=.*$/m,
    `SHOPIFY_ACCESS_TOKEN=${access_token}`
  );
  writeFileSync(ENV_PATH, envContent);

  console.log("\n✅ Access token saved to .env!\n");
  res.send("<h1>Done!</h1><p>Access token saved. You can close this tab.</p>");

  // Shut down the server
  setTimeout(() => process.exit(0), 500);
});

const server = app.listen(3000, () => {
  const url = "http://localhost:3000";
  console.log(`\nOpen this URL to authorize the app:\n\n  ${url}\n`);

  // Auto-open in browser
  try {
    execSync(`open "${url}"`);
  } catch {
    // If open fails, user can click the link
  }
});
