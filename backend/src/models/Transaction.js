import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
}, { 
    timestamps: true 
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
