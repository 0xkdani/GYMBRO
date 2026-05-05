const mongoose = require('mongoose');

const progresoClienteSchema = new mongoose.Schema({
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    fecha: { type: Date, required: true },
    peso: { type: Number, required: true, min: 1, max: 500 },
    notas: { type: String, default: '' },
    fechaRegistro: { type: Date, default: Date.now }
});

module.exports = mongoose.models.ProgresoCliente || mongoose.model('ProgresoCliente', progresoClienteSchema);
