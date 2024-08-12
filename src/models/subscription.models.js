import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({

    subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subscribedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export const Subscription = mongoose.model('Subscription', subscriptionSchema)