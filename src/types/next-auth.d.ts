import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      squadron: string | null;
      serviceNumber: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    squadron: string | null;
    serviceNumber: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: string;
    squadron: string | null;
    serviceNumber: string;
    id: string;
  }
}
