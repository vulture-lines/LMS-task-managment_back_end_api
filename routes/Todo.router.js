const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const Todo = require("../models/Todo.model");

router.get("/", authenticate, async (req, res) => {
    try {
      const { status, date } = req.query;
      const filter = { user: req.user._id };
  
      if (status === "completed") filter.completed = true;
      else if (status === "incomplete") filter.completed = false;
  
      if (date) {
        // Match exact date only (ignoring time)
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
  
        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }
  
      const todos = await Todo.find(filter).sort({ createdAt: -1 });
      res.json(todos);
    } catch (err) {
      res.status(500).json({ error: "Failed to get todos" });
    }
  });
  
  router.post("/", authenticate, async (req, res) => {
    try {
      const { text } = req.body;
      const todo = new Todo({
        text,
        completed: false,
        user: req.user._id,
        date: new Date(), 
      });
      await todo.save();
      res.status(201).json(todo);
    } catch (err) {
      res.status(500).json({ error: "Failed to add todo" });
    }
  });


  router.put("/toggle/:id", authenticate, async (req, res) => {
    try {
      const todo = await Todo.findOne({
        _id: req.params.id,
        user: req.user._id, // FIXED HERE
      });
  
      if (!todo) return res.status(404).json({ error: "Todo not found" });
  
      todo.completed = !todo.completed;
      await todo.save();
  
      res.json(todo);
    } catch (err) {
      console.error("Toggle error:", err.message);
      res.status(500).json({ error: "Failed to toggle todo" });
    }
  });
  

  router.delete("/:id", authenticate, async (req, res) => {
    try {
      const deleted = await Todo.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id, // FIXED HERE
      });
  
      if (!deleted) return res.status(404).json({ error: "Todo not found" });
  
      res.json({ message: "Todo deleted successfully" });
    } catch (err) {
      console.error("Delete error:", err.message);
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });
  

module.exports = router;
