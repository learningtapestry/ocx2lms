import type { User as SessionUser } from "next-auth";
import type { SessionBase } from "next-auth/_utils";

interface User extends SessionUser {
  id?: number | null;
}

interface Session extends SessionBase {
  user: User;
}

interface AuthPayload {
  user: User;
  accessToken: string;
  accessTokenExpires: number;
  refreshToken: string;
  error?: string;
}

interface Course {
  id?: string | null;
  name?: string | null;
}

export type { AuthPayload, Session, User, Course };
