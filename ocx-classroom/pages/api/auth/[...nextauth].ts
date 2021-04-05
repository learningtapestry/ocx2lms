import type { NextApiRequest, NextApiResponse } from "next";
import type { InitOptions } from "next-auth";
import type { Session, User, GenericObject } from "src/types";
import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import Adapters from "next-auth/adapters";
import getPrismaClient from "src/getPrismaClient";

const SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/classroom.courses",
  "https://www.googleapis.com/auth/classroom.coursework.me",
  "https://www.googleapis.com/auth/classroom.coursework.students",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials"
];
// https://www.googleapis.com/auth/classroom.student-submissions.students
// https://www.googleapis.com/auth/classroom.student-submissions.me
// https://www.googleapis.com/auth/homeroom

const AUTHORIZATION_URL =
  "https://accounts.google.com/o/oauth2/v2/auth" +
  "?prompt=consent&access_type=offline&response_type=code";

let prisma = getPrismaClient();

let options: InitOptions = {
  providers: [
    Providers.Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizationUrl: AUTHORIZATION_URL,
      scope: SCOPES.join(" ")
    })
  ],
  secret: process.env.AUTH_SECRET,
  jwt: {
    encryption: true,
    secret: process.env.JWT_SECRET
  },
  debug: process.env.DEBUG_VERBOSE === "true",
  callbacks: {
    async session(session: Session, user: User): Promise<GenericObject> {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    }
  },
  adapter: Adapters.Prisma.Adapter({ prisma })
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  return NextAuth(req, res, options);
};
