import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const DB_NAME = process.env.DB_NAME || "test";
export const DB_CONNECTION_STRING =
  process.env.DB_CONNECTION_STRING || "mongodb://localhost:27017/" + DB_NAME;
