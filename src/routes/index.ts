import express from "express";
import authRouter from "./auth.router";

const router = express.Router();
export default (): express.Router => {
  authRouter(router);

  return router;
};
