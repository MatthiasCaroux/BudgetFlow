import { Transaction } from "../models/Transaction.js";

export function listTransactions (ownerId, { type } = {}){
    const filter = { ownerId };
    if (type) filter.type = type;
    return Transaction.find(filter).sort({ date: -1 });
};

export function createTransaction (ownerId, data){
    return Transaction.create({ ...data, ownerId });
};

export function getTransactionById (ownerId, id){
    return Transaction.findOne({ _id: id, ownerId });
};

export function updateTransaction (ownerId, id, data){
    return Transaction.findOneAndUpdate({ _id: id, ownerId }, { ...data, ownerId }, { returnDocument: 'after', runValidators: true });
};

export function deleteTransaction (ownerId, id){
    return Transaction.findOneAndDelete({ _id: id, ownerId });
};
