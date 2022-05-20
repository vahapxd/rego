const mongoose = require('mongoose');

let rencia = mongoose.Schema({
    guildID: {type: String, default: null},
    memberID: {type: String, default: null},
    totalRegister: {type: Number, default: 0},
    womanRegister: {type: Number, default: 0},
    manRegister: {type: Number, default: 0},
    nicks: { type: Array, default: [] }
});

module.exports = mongoose.model("register", rencia)