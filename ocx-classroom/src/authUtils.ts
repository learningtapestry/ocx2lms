import { Account } from "@prisma/client";
import type { User } from "src/types";
import getPrismaClient from "src/getPrismaClient";

let prisma = getPrismaClient();

export async function getAccessToken(user: User): Promise<string> {
  let acct = await prisma.account.findFirst({ where: { userId: user.id } });
  let now = new Date();
  let expires = acct.accessTokenExpires?.getTime() || 0;
  if (now.getTime() < expires) {
    return acct.accessToken;
  }
  return await refreshAccessToken(acct);
}

export async function refreshAccessToken(acct: Account): Promise<string> {
  try {
    let url = new URL("https://oauth2.googleapis.com/token");
    url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
    url.searchParams.set("client_secret", process.env.GOOGLE_CLIENT_SECRET);
    url.searchParams.set("grant_type", "refresh_token");
    url.searchParams.set("refresh_token", acct.refreshToken);

    let response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST"
    });

    let token = await response.json();
    if (!response.ok) throw token;

    let expires = new Date();
    expires.setSeconds(expires.getSeconds() + token.expires_in - 10);

    // update tokens on the database
    await prisma.account.update({
      where: { id: acct.id },
      data: {
        accessToken: token.access_token,
        accessTokenExpires: expires
      }
    });
    return token.access_token;
  } catch (error) {
    console.error("RefreshAccessTokenError", error);
    return acct.accessToken;
  }
}
