const mongoose = require('mongoose');

const ejercicioSchema = new mongoose.Schema({
    nombreEjercicio: { type: String, required: true },
    descripcion: { type: String },
    grupoMuscular: { type: String, required: true },
    fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Ejercicio || mongoose.model('Ejercicio', ejercicioSchema);
