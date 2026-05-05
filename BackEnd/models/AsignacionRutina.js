const mongoose = require('mongoose');

const asignacionRutinaSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    rutinaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rutina', required: true },
    fechaAsignacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activa', 'inactiva'],
        default: 'activa'
    }
});

module.exports = mongoose.models.AsignacionRutina || mongoose.model('AsignacionRutina', asignacionRutinaSchema);
