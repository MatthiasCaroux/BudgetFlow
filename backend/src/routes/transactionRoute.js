import { Router } from "express";
import * as transactionController from "../controllers/transactionController.js";

export const transactionRouter = Router();

transactionRouter.get("/", transactionController.getAllTransactions);

transactionRouter.post("/", transactionController.createTransaction);

transactionRouter.get("/:id", transactionController.getTransactionById);

transactionRouter.put("/:id", transactionController.updateTransaction);

transactionRouter.delete("/:id", transactionController.deleteTransaction);
