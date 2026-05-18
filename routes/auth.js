const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const router = express.Router();
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            username,
            password: hashedPassword
        });

        await user.save();
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '4h' });
        res.status(201).json({ message: 'User registered successfully', token, username });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Compare the provided password with the hashed password
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
// res.status(200).json({ message: 'Login successful', username: user.username });
        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '4h' });
        res.json({ message: 'Login successful', token, username });
    } catch (error) {
        res.status(500).json({ message: 'Server error while logging in', error: error.message });
    }
});

module.exports = router;