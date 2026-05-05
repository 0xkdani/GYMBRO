const mongoose = require('mongoose');

const rutinaSchema = new mongoose.Schema({
    coachId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreRutina: { type: String, required: true },
    objetivo: {
        type: String,
        enum: ['Hipertrofia', 'Fuerza', 'Acondicionamiento', 'Resistencia'],
        required: true
    },
    nivel: {
        type: String,
        enum: ['Principiante', 'Intermedio', 'Avanzado'],
        required: true
    },
    notas: { type: String },
    ejercicios: [{
        dia: {
            type: String,
            enum: ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'],
            required: true
        },
        ejercicio: { type: String, required: true },
        series: { type: Number, required: true, min: 1 },
        repeticiones: { type: String, required: true },
        descanso: { type: String, default: '-' }
    }],
    fechaCreacion: { type: Date, default: Date.now },
    estado: {
        type: String,
        enum: ['activa', 'inactiva'],
        default: 'activa'
    }
});

module.exports = mongoose.models.Rutina || mongoose.model('Rutina', rutinaSchema);
