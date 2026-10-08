import { Transaction } from "../models/Transaction.js";

// Chaque requête filtre sur ownerId : la transaction d'un autre compte est introuvable (404)

export function listTransactions (ownerId, { type, category, from, to } = {}){
    const filter = { ownerId };
    if (type) filter.type = type;
    // Les transactions créées avant l'ajout des catégories n'ont pas le champ : elles comptent comme "other"
    if (category) filter.category = category === 'other' ? { $in: ['other', null] } : category;
    if (from || to) {
        filter.date = {};
        if (from) filter.date.$gte = from;
        if (to) filter.date.$lte = to;
    }
    return Transaction.find(filter).sort({ date: -1, createdAt: -1 });
};

export function createTransaction (ownerId, data){
    return Transaction.create({ ...data, ownerId });
};

export function getTransactionById (ownerId, id){
    return Transaction.findOne({ _id: id, ownerId });
};

export function updateTransaction (ownerId, id, data){
    // $set : seuls les champs envoyés sont modifiés (PATCH partiel)
    return Transaction.findOneAndUpdate({ _id: id, ownerId }, { $set: data }, { returnDocument: 'after', runValidators: true });
};

export function deleteTransaction (ownerId, id){
    return Transaction.findOneAndDelete({ _id: id, ownerId });
};
