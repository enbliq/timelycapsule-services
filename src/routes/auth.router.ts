import express from "express";
import { Auth } from "../controllers/auth.controller";

const authRouter = (router: express.Router) => {
  router.post("/login", Auth.login);
};

export default authRouter;
