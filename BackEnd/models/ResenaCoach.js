const mongoose = require('mongoose');

const resenaCoachSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String },
    fechaResena: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ResenaCoach || mongoose.model('ResenaCoach', resenaCoachSchema);
