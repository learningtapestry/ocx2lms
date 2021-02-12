require("dotenv").config({path: ".env.local"})
const PrismaClient = require("@prisma/client").PrismaClient;
global.prisma = new PrismaClient();
