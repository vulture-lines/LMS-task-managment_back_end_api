const { Schema, model } = require("mongoose");

const forumPostSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: String,
  files: [
    {
      url: String,
      type: String 
    }
  ],
  postType: {
    type: String,
    enum: ["discussion", "question", "admin-question"],
    default: "discussion"
  },
  tags: [String],
  likes: [
    {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "public"
  },
  pinned: {
    type: Boolean,
    default: false
  },
  approved: {
    type: Boolean,
    default: false
  },  
  replies: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      message: { type: String, required: true },
      files: [
        {
          url: String,
          type: String 
        }
      ],
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = model("ForumPost", forumPostSchema);
