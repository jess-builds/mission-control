"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
// Get all personas
router.get('/api/council/personas', async (req, res) => {
    try {
        const personasDir = path_1.default.join(__dirname, 'personas');
        const files = await promises_1.default.readdir(personasDir);
        const personas = await Promise.all(files
            .filter(f => f.endsWith('.json'))
            .map(async (file) => {
            const content = await promises_1.default.readFile(path_1.default.join(personasDir, file), 'utf-8');
            return JSON.parse(content);
        }));
        res.json(personas);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load personas' });
    }
});
// Get specific persona
router.get('/api/council/personas/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const personaPath = path_1.default.join(__dirname, 'personas', `${role}.json`);
        const content = await promises_1.default.readFile(personaPath, 'utf-8');
        res.json(JSON.parse(content));
    }
    catch (error) {
        res.status(404).json({ error: 'Persona not found' });
    }
});
// Update persona
router.put('/api/council/personas/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const personaPath = path_1.default.join(__dirname, 'personas', `${role}.json`);
        // Validate the persona data
        const requiredFields = ['role', 'name', 'emoji', 'model', 'coreIdentity'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }
        // Write updated persona
        await promises_1.default.writeFile(personaPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true, persona: req.body });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update persona' });
    }
});
// Get round templates
router.get('/api/council/templates', async (req, res) => {
    const templates = {
        standard: {
            name: 'Standard',
            description: '6 rounds, ~20 minutes total',
            rounds: [
                {
                    name: "Proposals",
                    durationSeconds: 300,
                    prompt: "Visionary: Propose 2-3 distinct tool ideas. For each: name, one-liner, why valuable, what becomes possible.",
                    wrapUpPrompt: "30 seconds remaining. Finalize your proposals."
                },
                {
                    name: "Reactions",
                    durationSeconds: 300,
                    prompt: "All agents: React to the proposals through your specific lens. Be direct.",
                    wrapUpPrompt: "30 seconds. Final reactions."
                },
                {
                    name: "Defense",
                    durationSeconds: 180,
                    prompt: "Visionary: Address the council's concerns. Concede where valid, push back where wrong.",
                    wrapUpPrompt: "Wrap up your defense."
                },
                {
                    name: "Narrow",
                    durationSeconds: 180,
                    prompt: "All agents: Vote for top 2 ideas. Brief reasoning.",
                    wrapUpPrompt: "Final votes."
                },
                {
                    name: "Debate",
                    durationSeconds: 300,
                    prompt: "Stress-test the top 2 finalists. Attack, defend, evolve.",
                    wrapUpPrompt: "Converge on a winner."
                },
                {
                    name: "MVP Scope",
                    durationSeconds: 300,
                    prompt: "Define the minimum viable version. Trigger, data sources, output, what's OUT of scope.",
                    wrapUpPrompt: "Finalize the spec."
                }
            ]
        },
        quick: {
            name: 'Quick',
            description: '3 rounds, ~15 minutes total',
            rounds: [
                {
                    name: "Pitch",
                    durationSeconds: 180,
                    prompt: "Visionary: One idea. Make it count."
                },
                {
                    name: "Rapid Fire",
                    durationSeconds: 300,
                    prompt: "All: Quick reactions. No essays. Hit the key points."
                },
                {
                    name: "Decision",
                    durationSeconds: 180,
                    prompt: "Converge: Yes or no? If yes, define scope. If no, why?"
                }
            ]
        },
        freeForAll: {
            name: 'Free-for-all',
            description: 'No rounds, no timer, open discussion',
            freeForAll: true
        }
    };
    res.json(templates);
});
// Create custom template
router.post('/api/council/templates', async (req, res) => {
    try {
        const { name, description, rounds } = req.body;
        if (!name || !rounds || !Array.isArray(rounds)) {
            return res.status(400).json({ error: 'Invalid template data' });
        }
        // Validate rounds
        for (const round of rounds) {
            if (!round.name || !round.durationSeconds || !round.prompt) {
                return res.status(400).json({ error: 'Invalid round data' });
            }
        }
        // In a real implementation, we'd save this to a database
        // For now, just return success
        res.json({
            success: true,
            template: {
                name,
                description,
                rounds,
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create template' });
    }
});
exports.default = router;
