import { app } from "./app";
import dotenv from "dotenv";
import { connectToDB } from "./config/db";
import { DB_CONNECTION_STRING } from "./constants";
import logger from "./utils/logger.utils";
import { Request, Response, NextFunction } from "express";
import { notFoundMiddleware } from "./model/middleware/notFoundMiddleware";
import appRoute from "../src/routes";

dotenv.config();
console.log("DB_CONNECTION_STRING", DB_CONNECTION_STRING);

app.use((req: Request, res: Response, next: NextFunction) => {
  res.on("finish", () => {
    const logMessage = `${req.method} ${req.url} ${res.statusCode}`;

    if (Object.keys(req.query).length) {
      logger.info(`${logMessage} - Query Params: ${JSON.stringify(req.query)}`);
    }

    if (req.body && Object.keys(req.body).length > 0) {
      logger.info(`${logMessage} - Request Body: ${JSON.stringify(req.body)}`);
    } else {
      logger.info(logMessage);
    }
  });
  next();
});
app.use("/api/", appRoute());
// 404 middleWare
app.use(notFoundMiddleware);

//Create Server

app.listen(process.env.PORT, async () => {
  await connectToDB(DB_CONNECTION_STRING);
  console.log(`Server is running on port ${process.env.PORT}`);
});
