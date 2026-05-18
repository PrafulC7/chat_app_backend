const mongoose = require('mongoose');

const messagesSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false}
},{ timestamps: true }
);

const Messages = mongoose.model('Messages', messagesSchema);
module.exports = Messages;