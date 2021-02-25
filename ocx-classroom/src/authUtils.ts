import { Account } from "@prisma/client";
import type { User } from "src/types";
import getPrismaClient from "src/getPrismaClient";

const prisma = getPrismaClient();

export const getAccessToken = async (user: User): Promise<string> => {
  const acct = await prisma.account.findFirst({ where: { userId: user.id } });
  const now = new Date();
  const expires = acct.accessTokenExpires?.getTime() || 0;
  if (now.getTime() < expires) {
    return acct.accessToken;
  }
  return await refreshAccessToken(acct);
};

export const refreshAccessToken = async (acct: Account): Promise<string> => {
  try {
    const url = new URL("https://oauth2.googleapis.com/token");
    url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
    url.searchParams.set("client_secret", process.env.GOOGLE_CLIENT_SECRET);
    url.searchParams.set("grant_type", "refresh_token");
    url.searchParams.set("refresh_token", acct.refreshToken);

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST"
    });

    const token = await response.json();
    if (!response.ok) throw token;

    const expires = new Date();
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
};
