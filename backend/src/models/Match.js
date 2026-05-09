const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    players: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        score: Number,
        isWinner: Boolean
    }],
    gameMode: {
        type: String,
        enum: ['SinglePlayer', 'Multiplayer', 'Bot'],
        required: true
    },
    duration: {
        type: Number, // in seconds
        required: true
    },
    roomName: {
        type: String
    }
}, { timestamps: true });

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
