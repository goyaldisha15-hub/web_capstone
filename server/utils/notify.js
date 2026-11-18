const Notification = require('../models/Notification');

// Saves notification in DB and pushes it live via socket.io
module.exports = async function notify(req, { recipient, sender, type, post }) {
  if (String(recipient) === String(sender)) return; // no self-notifications
  const n = await Notification.create({ recipient, sender, type, post });
  const populated = await n.populate([
    { path: 'sender', select: 'name' },
    { path: 'post', select: 'title' }
  ]);
  const io = req.app.get('io');
  if (io) io.to(`user:${recipient}`).emit('notification', populated);
};