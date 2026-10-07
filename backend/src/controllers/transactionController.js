import * as transactionService from "../services/transactionService.js";

export async function getAllTransactions(request, response) {
  const { type } = request.query;
  const transactions = await transactionService.listTransactions(request.userId, { type });
  response.status(200).json({ message: 'Liste des transactions', transactions: transactions });
}

export async function createTransaction(request, response) {
  const transaction = await transactionService.createTransaction(request.userId, request.body);
  response.status(201).json({ message: 'Transaction créée', transaction: transaction });
}

export async function getTransactionById(request, response) {
  const transaction = await transactionService.getTransactionById(request.userId, request.params.id);
  if (!transaction) return response.status(404).json({ message: 'Transaction introuvable' });
  response.status(200).json({ transaction: transaction });
}

export async function updateTransaction(request, response) {
  const transaction = await transactionService.updateTransaction(request.userId, request.params.id, request.body);
  if (!transaction) return response.status(404).json({ message: 'Transaction introuvable' });
  response.status(200).json({ message: 'Transaction modifiée', transaction: transaction });
}

export async function deleteTransaction(request, response) {
  const transaction = await transactionService.deleteTransaction(request.userId, request.params.id);
  if (!transaction) return response.status(404).json({ message: 'Transaction introuvable' });
  response.status(204).send();
}
