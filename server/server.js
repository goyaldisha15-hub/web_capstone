require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// ---- Socket.io: each logged-in user joins room "user:<id>" ----
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || '*' } });
io.use((socket, next) => {
  try {
    const decoded = jwt.verify(socket.handshake.auth.token, process.env.JWT_ACCESS_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (e) {
    next(new Error('Unauthorized'));
  }
});
io.on('connection', (socket) => {
  socket.join(`user:${socket.userId}`);
});
app.set('io', io);

// ---- Routes ----
app.get('/', (req, res) => res.json({ message: 'BlogSphere API running' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => server.listen(PORT, () => console.log(`Server on port ${PORT}`)));