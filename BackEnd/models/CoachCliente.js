const mongoose = require('mongoose');

const coachClienteSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fechaAsignacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activo', 'inactivo'],
        default: 'activo'
    }
});

module.exports = mongoose.models.CoachCliente || mongoose.model('CoachCliente', coachClienteSchema);
