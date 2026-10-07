import { Router } from "express";
import * as transactionController from "../controllers/transactionController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

export const transactionRouter = Router();

// Toutes les routes ci-dessous exigent un JWT valide
transactionRouter.use(requireAuth);

/**
 * @openapi
 * /api/transactions:
 *   get:
 *     summary: Liste les transactions de l'utilisateur connecté
 *     description: Triées par date, de la plus récente à la plus ancienne. Une liste vide renvoie {"items":[]}.
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: false
 *         description: Filtre sur le type de transaction
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *     responses:
 *       200:
 *         description: Liste des transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
transactionRouter.get("/", transactionController.getAllTransactions);

/**
 * @openapi
 * /api/transactions:
 *   post:
 *     summary: Crée une transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionInput'
 *     responses:
 *       201:
 *         description: Transaction créée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
transactionRouter.post("/", transactionController.createTransaction);

/**
 * @openapi
 * /api/transactions/{id}:
 *   get:
 *     summary: Récupère une transaction par son id
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TransactionId'
 *     responses:
 *       200:
 *         description: Transaction trouvée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
transactionRouter.get("/:id", transactionController.getTransactionById);

/**
 * @openapi
 * /api/transactions/{id}:
 *   patch:
 *     summary: Modifie une partie d'une transaction
 *     description: Seuls les champs envoyés sont modifiés. Un corps vide, un champ inconnu, id ou ownerId sont refusés (400).
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TransactionId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransactionPatch'
 *     responses:
 *       200:
 *         description: Transaction modifiée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
transactionRouter.patch("/:id", transactionController.updateTransaction);

/**
 * @openapi
 * /api/transactions/{id}:
 *   delete:
 *     summary: Supprime une transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TransactionId'
 *     responses:
 *       204:
 *         description: Transaction supprimée (aucun corps)
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
transactionRouter.delete("/:id", transactionController.deleteTransaction);
