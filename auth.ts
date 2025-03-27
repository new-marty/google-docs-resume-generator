import fs from "fs/promises";
import { google } from "googleapis";
import open from "open";
import readline from "readline";
import { OAuth2Client } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/documents",
];

export async function getAuthClient(): Promise<OAuth2Client> {
  const credentials = JSON.parse(await fs.readFile("credentials.json", "utf8"));
  const { client_id, client_secret, redirect_uris } = credentials;
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );
  const token = JSON.parse(await fs.readFile("token.json", "utf8"));
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

export async function getAccessToken(): Promise<void> {
  const credentials = JSON.parse(await fs.readFile("credentials.json", "utf8"));
  const { client_id, client_secret, redirect_uris } = credentials;
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("🔗 Authorization URL:", url);
  await open(url);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("📥 Paste the code from the browser here: ", async (code) => {
    rl.close();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    console.log("✅ Access token acquired:", tokens);
    await fs.writeFile("token.json", JSON.stringify(tokens, null, 2));
    console.log("💾 Tokens saved to token.json");
  });
}
