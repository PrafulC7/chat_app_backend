const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const { Server } = require("socket.io");
const Messages = require('./models/Messages');
const User = require('./models/User');
const dns = require("dns")
dns.setServers(["1.1.1.1", "8.8.8.8"])
dotenv.config();

const app = express();
const server = http.createServer(app)

const allowedOrigins = [
  "http://localhost:3000",
  "https://chat-app-azure-one-74.vercel.app"
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
const io = new Server(server, {
    cors: {
         origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
    }
});
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('Error connecting to MongoDB:', error));

// Define a simple route
app.get('/', (req, res) => {
  res.send('Hello, Chat App Backend!');
});

app.use("/auth", authRoutes)


io.on('connection', (socket) => {

    console.log('A user connected', socket.id);

    socket.on('send_message', async (data) => {
        const { sender, receiver, message } = data;

        const newMessage = new Messages({
            sender,
            receiver,
            message
        });

        await newMessage.save();

        socket.broadcast.emit('receive_message', data);
    });

    // Typing event
    socket.on('typing', (data) => {
        socket.broadcast.emit('show_typing', data);
    });

    // Stop typing
    socket.on('stop_typing', () => {
        socket.broadcast.emit('hide_typing');
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected', socket.id);
    });

    socket.on('message_read', async (data) => {

    await Messages.updateMany(
        {
            sender: data.sender,
            receiver: data.receiver,
            read: false
        },
        {
            read: true
        }
    );

    socket.broadcast.emit('messages_seen');
});

});

app.get('/messages', async (req, res) => {
    const { sender, receiver } = req.query;
    try {
        const messages = await Messages.find({
            $or: [
                { sender, receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

app.get('/users', async (req, res) => {
    const {currentUser} = req.query;
    try {
        const users = await User.find({ username: { $ne: currentUser } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// export default app;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });