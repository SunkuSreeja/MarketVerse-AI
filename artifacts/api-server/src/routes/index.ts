import { Router, type IRouter } from "express";
import healthRouter from "./health";
import simulationsRouter from "./simulations";
import psychologyRouter from "./psychology";
import scenariosRouter from "./scenarios";
import portfolioRouter from "./portfolio";
import challengesRouter from "./challenges";
import geminiRouter from "./gemini";
import marketRouter from "./market";
import replayRouter from "./replay";

const router: IRouter = Router();

router.use(healthRouter);
router.use(simulationsRouter);
router.use(psychologyRouter);
router.use(replayRouter);
router.use(scenariosRouter);
router.use(portfolioRouter);
router.use(challengesRouter);
router.use(geminiRouter);
router.use(marketRouter);

export default router;
