import mongoose from 'mongoose';
import { CATEGORIES } from '../validators/transactionValidator.js';

const transactionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  // Champ facultatif en plus du contrat du livret
  description: {
    type: String,
    default: '',
    maxlength: 1000,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  // Bonus B1 : catégorie choisie dans une liste fermée
  category: {
    type: String,
    enum: CATEGORIES,
    default: 'other',
  },
  // En centimes : 12345 = 123,45 €. Un entier évite les erreurs d'arrondi (0.1 + 0.2)
  amount: {
    type: Number,
    required: true,
    min: 1,
    validate: { validator: Number.isSafeInteger, message: 'Le montant doit être un entier' },
  },
  // Stockée en texte "AAAA-MM-JJ" : pas de décalage de fuseau horaire,
  // et l'ordre alphabétique est aussi l'ordre chronologique
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
  // Forme publique d'une transaction : "id" en texte, sans "_id" ni "__v"
  toJSON: {
    versionKey: false,
    transform(_doc, ret) {
      ret.id = ret._id.toString();
      ret.ownerId = ret.ownerId.toString();
      delete ret._id;
      return ret;
    },
  },
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
