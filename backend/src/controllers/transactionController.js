import mongoose from 'mongoose';
import * as transactionService from "../services/transactionService.js";
import { validateTransactionCreate, validateTransactionPatch, TRANSACTION_TYPES } from "../validators/transactionValidator.js";

function invalidInput(response, message) {
  return response.status(400).json({ error: { code: 'INVALID_INPUT', message } });
}

function notFound(response) {
  return response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Transaction introuvable' } });
}

// Un id qui n'a pas le format d'un ObjectId MongoDB → 400 (et non une erreur 500)
function hasValidId(request) {
  return mongoose.isValidObjectId(request.params.id);
}

export async function getAllTransactions(request, response) {
  const { type } = request.query;
  if (type !== undefined && !TRANSACTION_TYPES.includes(type)) {
    return invalidInput(response, 'Le filtre type doit être "income" ou "expense"');
  }
  const transactions = await transactionService.listTransactions(request.userId, { type });
  response.status(200).json({ items: transactions });
}

export async function createTransaction(request, response) {
  const { error, data } = validateTransactionCreate(request.body);
  if (error) return invalidInput(response, error);
  const transaction = await transactionService.createTransaction(request.userId, data);
  response.status(201).json(transaction);
}

export async function getTransactionById(request, response) {
  if (!hasValidId(request)) return invalidInput(response, 'Identifiant de transaction invalide');
  const transaction = await transactionService.getTransactionById(request.userId, request.params.id);
  if (!transaction) return notFound(response);
  response.status(200).json(transaction);
}

export async function updateTransaction(request, response) {
  if (!hasValidId(request)) return invalidInput(response, 'Identifiant de transaction invalide');
  const { error, data } = validateTransactionPatch(request.body);
  if (error) return invalidInput(response, error);
  const transaction = await transactionService.updateTransaction(request.userId, request.params.id, data);
  if (!transaction) return notFound(response);
  response.status(200).json(transaction);
}

export async function deleteTransaction(request, response) {
  if (!hasValidId(request)) return invalidInput(response, 'Identifiant de transaction invalide');
  const transaction = await transactionService.deleteTransaction(request.userId, request.params.id);
  if (!transaction) return notFound(response);
  response.status(204).end();
}
