import { Router, type IRouter } from "express";
import { db, scenariosTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListScenariosResponse,
  GetScenarioParams,
  GetScenarioResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/scenarios", async (req, res): Promise<void> => {
  const rows = await db.select().from(scenariosTable).orderBy(scenariosTable.year);
  res.json(ListScenariosResponse.parse(rows));
});

router.get("/scenarios/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetScenarioParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [scenario] = await db.select().from(scenariosTable).where(eq(scenariosTable.id, params.data.id));
  if (!scenario) { res.status(404).json({ error: "Scenario not found" }); return; }
  res.json(GetScenarioResponse.parse(scenario));
});

export default router;
