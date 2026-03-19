const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fetchUser = require('../Middleware/fetchUser');
const Notes = require('../modules/NOTES');

// Route 1: Fetch all notes
router.get('/fetchallnotes', fetchUser, async (req, res) => {
    try {

        let query = {};

        if (req.user?.id) {
            query.user = req.user.id;
        } 
        else if (req.user?.walletAddress) {
            query.walletAddress = req.user.walletAddress.toLowerCase();
        } 
        else {
            return res.status(401).json({ error: "Authentication failed" });
        }

        const notes = await Notes.find(query)
            .sort({ date: -1 })
            .lean();

        res.json(notes);

    } catch (error) {
        console.error("Fetch notes error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


// Route 2: Add note
router.post(
    '/addnote',
    fetchUser,
    [
        body('title')
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage("Title must be between 1 and 200 characters"),

        body('description')
            .trim()
            .isLength({ min: 1, max: 5000 })
            .withMessage("Description must be between 1 and 5000 characters"),

        body('tag')
            .optional()
            .trim()
            .isLength({ max: 50 })
    ],
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {

            const { title, description, tag } = req.body;

            const noteData = {
                title: title.trim(),
                description: description.trim(),
                tag: tag?.trim() || ""
            };

            if (req.user?.id) {
                noteData.user = req.user.id;
            } 
            else if (req.user?.walletAddress) {
                noteData.walletAddress = req.user.walletAddress.toLowerCase();
            } 
            else {
                return res.status(401).json({ error: "Authentication required" });
            }

            const note = new Notes(noteData);
            const savedNote = await note.save();

            res.json(savedNote);

        } catch (error) {
            console.error("Add note error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);


// Route 3: Update note
router.put('/updatenote/:id', fetchUser, async (req, res) => {

    try {

        const { title, description, tag, summary, flashcards, quiz } = req.body;

        const updateData = {};

        if (title) updateData.title = title.trim();
        if (description) updateData.description = description.trim();
        if (tag) updateData.tag = tag.trim();

        if (summary !== undefined) updateData.summary = summary;
        if (flashcards !== undefined) updateData.flashcards = flashcards;
        if (quiz !== undefined) updateData.quiz = quiz;

        let note = await Notes.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        const userId = req.user?.id;
        const walletAddress = req.user?.walletAddress?.toLowerCase();

        const isOwner =
            (userId && note.user?.toString() === userId) ||
            (walletAddress && note.walletAddress?.toLowerCase() === walletAddress);

        if (!isOwner) {
            return res.status(403).json({ error: "Not authorized" });
        }

        note = await Notes.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json(note);

    } catch (error) {
        console.error("Update note error:", error);
        res.status(500).json({ error: "Internal server error" });
    }

});


// Route 4: Delete note
router.delete('/deletenote/:id', fetchUser, async (req, res) => {

    try {

        const note = await Notes.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        const userId = req.user?.id;
        const walletAddress = req.user?.walletAddress?.toLowerCase();

        const isOwner =
            (userId && note.user?.toString() === userId) ||
            (walletAddress && note.walletAddress?.toLowerCase() === walletAddress);

        if (!isOwner) {
            return res.status(403).json({ error: "Not authorized" });
        }

        await Notes.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Note deleted successfully"
        });

    } catch (error) {
        console.error("Delete note error:", error);
        res.status(500).json({ error: "Internal server error" });
    }

});

module.exports = router;