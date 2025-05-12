const express = require("express");
const router = express.Router();
const Message = require("../models/Message.model");
const Conversation = require("../models/Conversation.model");
const authenticate = require("../middleware/auth");

// Send message — reuse or create conversation
router.post("/", authenticate, async (req, res) => {
  try {
    const { receiver, text } = req.body;
    const sender = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver], $size: 2 }
    });

    if (!conversation) {
      conversation = new Conversation({ participants: [sender, receiver] });
      await conversation.save();
    }

    const message = new Message({
      conversationId: conversation._id,
      sender,
      receiver,
      text
    });

    await message.save();
    res.status(201).json({ message: "Message sent", data: message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get full conversation with one user (both directions)
router.get("/conversation/:userId", authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const sender = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [sender, userId], $size: 2 }
    });

    if (!conversation) {
      return res.json([]); // no conversation yet
    }

    const messages = await Message.find({
      conversationId: conversation._id
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inbox — latest message per user (from all conversations)
router.get("/inbox", authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    });

    const inbox = [];

    for (const convo of conversations) {
      const lastMessage = await Message.find({ conversationId: convo._id })
        .sort({ createdAt: -1 })
        .limit(1)
        .populate("sender", "username")
        .populate("receiver", "username");

      if (lastMessage.length > 0) {
        const msg = lastMessage[0];
        const otherUser = msg.sender._id.toString() === userId.toString()
          ? msg.receiver
          : msg.sender;

        inbox.push({
          userId: otherUser._id,
          username: otherUser.username,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          seen: msg.seen
        });
      }
    }

    res.json(inbox);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark message as seen
router.put("/seen/:messageId", authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    message.seen = true;
    await message.save();

    res.json({ message: "Message marked as seen", data: message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
