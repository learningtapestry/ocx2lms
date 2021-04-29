//@ts-nocheck
import { PrismaClient } from "@prisma/client";

export default function getPrismaClient() {
  let prisma;
  if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
  } else {
    if (!global.prisma) {
      global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
  }
  return prisma;
}
