import type { User as SessionUser } from "next-auth";
import type { SessionBase, GenericObject } from "next-auth/_utils";
import { classroom_v1 } from "googleapis";

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

interface Course extends classroom_v1.Schema$Course {}

export type { AuthPayload, Session, User, Course, GenericObject };
