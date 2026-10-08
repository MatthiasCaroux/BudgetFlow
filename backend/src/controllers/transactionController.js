import mongoose from 'mongoose';
import * as transactionService from "../services/transactionService.js";
import { validateTransactionCreate, validateTransactionPatch, validateTransactionFilters } from "../validators/transactionValidator.js";
import { invalidInput, notFound } from "../errors/AppError.js";

// Les erreurs sont lancées (throw) : errorHandler les transforme en réponse JSON

// Un id qui n'a pas le format d'un ObjectId MongoDB → 400 (et non une erreur 500)
function assertValidId(request) {
  if (!mongoose.isValidObjectId(request.params.id)) {
    throw invalidInput('Identifiant de transaction invalide');
  }
}

function transactionNotFound() {
  return notFound('Transaction introuvable');
}

export async function getAllTransactions(request, response) {
  const { error, data } = validateTransactionFilters(request.query);
  if (error) throw invalidInput(error);
  const transactions = await transactionService.listTransactions(request.userId, data);
  response.status(200).json({ items: transactions });
}

export async function createTransaction(request, response) {
  const { error, data } = validateTransactionCreate(request.body);
  if (error) throw invalidInput(error);
  const transaction = await transactionService.createTransaction(request.userId, data);
  response.status(201).json(transaction);
}

export async function getTransactionById(request, response) {
  assertValidId(request);
  const transaction = await transactionService.getTransactionById(request.userId, request.params.id);
  if (!transaction) throw transactionNotFound();
  response.status(200).json(transaction);
}

export async function updateTransaction(request, response) {
  assertValidId(request);
  const { error, data } = validateTransactionPatch(request.body);
  if (error) throw invalidInput(error);
  const transaction = await transactionService.updateTransaction(request.userId, request.params.id, data);
  if (!transaction) throw transactionNotFound();
  response.status(200).json(transaction);
}

export async function deleteTransaction(request, response) {
  assertValidId(request);
  const transaction = await transactionService.deleteTransaction(request.userId, request.params.id);
  if (!transaction) throw transactionNotFound();
  response.status(204).end();
}
