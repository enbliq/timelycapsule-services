import express from "express";
import { UserController } from "../controllers/user.controller";
import auth from "../middleware/auth"

const authRouter = (router: express.Router) => {
  router.get("/users/:id", UserController.getUserById);
  router.get("/user", auth, UserController.getCurrentUser);
  router.get("/users", auth, UserController.getAllUsers);
  router.post("/password", auth, UserController.changePassword);
  router.patch("/user", auth, UserController.updateUserProfile);
};

export default authRouter;
