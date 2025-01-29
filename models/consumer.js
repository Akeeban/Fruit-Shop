const mongoose = require('mongoose');
const connect = mongoose.connect("mongodb+srv://admin:admin@app.kvjci.mongodb.net/?retryWrites=true&w=majority&appName=app");


// Define User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const collection = new mongoose.model('consumer', userSchema);
module.exports = collection;
