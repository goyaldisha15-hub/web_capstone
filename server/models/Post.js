const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
  content: { type: String, required: [true, 'Content is required'] },
  tags: [{ type: String, lowercase: true, trim: true }],
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

postSchema.index({ title: 'text', content: 'text' });      // text search
postSchema.index({ author: 1, createdAt: -1 });             // feed queries
postSchema.index({ tags: 1 });

module.exports = mongoose.model('Post', postSchema);