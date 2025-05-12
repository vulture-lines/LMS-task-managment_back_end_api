const express = require("express");
const router = express.Router();
const ForumPost = require("../models/Forum.model");
const authenticate = require("../middleware/auth");


router.post("/", authenticate, async (req, res) => {
  try {
    const { title, content, files = [], tags = [], postType = "discussion" } = req.body;

    const post = new ForumPost({
      user: req.user._id,
      title,
      content,
      files,
      tags,
      postType
    });

    await post.save();
    res.status(201).json({ message: "Post created", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", authenticate, async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .sort({ createdAt: -1 })
      .populate("user", "username role");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", authenticate, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id).populate("user", "username role");
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a forum post 
router.put("/:id/approve", authenticate, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.approved = !post.approved; // toggle true ⇄ false
    await post.save();

    res.json({
      message: `Post ${post.approved ? "approved" : "disapproved"}`,
      post,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/reply", authenticate, async (req, res) => {
  try {
    const { message, files = [] } = req.body;
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    post.replies.push({
      user: req.user._id,
      message,
      files,
      createdAt: new Date()
    });

    await post.save();
    res.status(201).json({ message: "Reply added", replies: post.replies });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
  
      if (post.user.toString() !== req.user._id.toString() && req.user.role !== "Mentor") {
        return res.status(403).json({ error: "Unauthorized to edit this post" });
      }
  
      const { title, content, files, tags, postType, visibility, pinned } = req.body;
  
      if (title !== undefined) post.title = title;
      if (content !== undefined) post.content = content;
      if (files !== undefined) post.files = files;
      if (tags !== undefined) post.tags = tags;
      if (postType !== undefined) post.postType = postType;
      if (visibility !== undefined) post.visibility = visibility;
      if (pinned !== undefined) post.pinned = pinned;
  
      await post.save();
      res.json({ message: "Post updated", post });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


router.put("/:postId/reply/:replyId", authenticate, async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
  
      const reply = post.replies.id(req.params.replyId);
      if (!reply) return res.status(404).json({ error: "Reply not found" });
  
      if (reply.user.toString() !== req.user._id.toString() && req.user.role !== "Mentor") {
        return res.status(403).json({ error: "Unauthorized to edit this reply" });
      }
  
      const { message, files } = req.body;
      if (message !== undefined) reply.message = message;
      if (files !== undefined) reply.files = files;
  
      await post.save();
      res.json({ message: "Reply updated", reply });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
   

// Like or Unlike a post
router.put("/:id/like", authenticate, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const liked = post.likes.includes(req.user._id);
    if (liked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ message: liked ? "Unliked" : "Liked", likes: post.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", authenticate, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== "Mentor") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a reply from a post 
router.delete("/:postId/reply/:replyId", authenticate, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const reply = post.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ error: "Reply not found" });

    if (reply.user.toString() !== req.user._id.toString() && req.user.role !== "Mentor") {
      return res.status(403).json({ error: "Unauthorized to delete this reply" });
    }

    reply.deleteOne();
    await post.save();
    res.json({ message: "Reply deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
