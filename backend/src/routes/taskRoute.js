import { Router } from "express";
import * as taskController from "../controllers/taskController.js";

export const taskRouter = Router();

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     summary: Liste les tâches
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         description: Filtre les tâches par statut
 *         schema:
 *           type: string
 *           enum: [pending, in progress, completed]
 *     responses:
 *       200:
 *         description: Liste des tâches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Liste des taches
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 */
taskRouter.get("/", taskController.getAllTasks);
