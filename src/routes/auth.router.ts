import express from "express";
import { Auth } from "../controllers/auth.controller";

const authRouter = (router: express.Router) => {
  router.post("/login", Auth.login);
  router.post('/resendemail', Auth.resendVerificationEmail);

};

export default authRouter;
