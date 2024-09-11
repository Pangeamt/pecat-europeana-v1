import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Check if a PrismaClient instance already exists in the global scope
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

export default prisma;
