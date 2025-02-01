import express from "express";
import { Auth } from "../controllers/auth.controller";

const authRouter = (router: express.Router) => {
  router.post("/login", Auth.login);
  router.post("/resendemail", Auth.resendVerificationEmail);
  router.post("/register", Auth.register);
  router.post('/forgotpassword', Auth.forgotPassword);
  router.patch('/verify/:token/:user', Auth.verifyEmail);

};

export default authRouter;
