const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    rol: {
        type: String,
        enum: ['cliente', 'coach'],
        default: 'cliente'
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match:[/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email no valid']
     },
    password: { 
        type: String, 
        required: true,
        minlength: [4, 'La contraseña debe tener al menos 4 caracteres'],
        select: false 
    }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.models.Usuario || mongoose.model('Usuario', userSchema);
