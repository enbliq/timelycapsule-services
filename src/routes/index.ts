import express, { Router } from "express";
import healthRoutes from "./features/health.routes";
import authRoutes from "./features/auth.routes";
import unlockRoutes from "./unlockRoutes";
import capsuleRoutes from "./capsuleRoutes";
import mediaRoutes from "./mediaRoutes";
import contributionRoutes from "./contributionRoutes";

const router: Router = express.Router();

// Mount health check routes (no versioning for health)
router.use("/health", healthRoutes);

// Create API v1 router
const v1Router: Router = express.Router();

// Mount v1 feature routes
v1Router.use("/auth", authRoutes);
v1Router.use("/unlock", unlockRoutes);
v1Router.use("/", capsuleRoutes);
v1Router.use("/", mediaRoutes);
v1Router.use("/", contributionRoutes);

// Mount v1 router under /api/v1
router.use("/api/v1", v1Router);

export default router;
