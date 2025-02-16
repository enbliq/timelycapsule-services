import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const DB_NAME = process.env.DB_NAME || "test";
export const DB_CONNECTION_STRING = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@db:27017/${DB_NAME}?authSource=admin`;
