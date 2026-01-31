---
title: "🕐 Cron Jobs — Jess's Automations"
tags: ["Jess", "Automation", "Cron"]
createdAt: 2026-01-31
updatedAt: 2026-01-31
---

# Cron Jobs — Jess's Automations

These are the recurring tasks Jess runs automatically. Each one fires at a specific time and executes the prompt below.

---

## Schedule Overview

| Job | Time (EST) | Model | Purpose |
|-----|------------|-------|---------|
| Morning Brief | 8:00 AM | default | Weather, news, tasks, reminders |
| Daily Research | 2:00 PM | sonnet | Deep dive on rotating topic |
| Daily Task Review | 10:00 PM | default | Accountability check |
| Nightly Journal | 10:30 PM | default | Day synthesis + ideas |
| Nightly Work Session | 11:00 PM | opus | Autonomous building + self-improvement |

---

## 🌅 Morning Brief (8am)

```
Morning brief for Armaan. It's 8am EST.

⚠️ FORMATTING RULES (CRITICAL):
- NO tables — Telegram doesn't render them
- Use bullet points (•) not dashes
- Add breathing room — blank lines between sections
- Use --- dividers between major sections
- Short paragraphs, not walls of text
- Section headers on their own lines with blank line after
- One idea per bullet point
- Weather MUST be in Celsius (not Fahrenheit)

Generate a comprehensive morning brief:

1. 🔔 **Reminders**
• Message Matt with an update on the Brain Dump tool and the PDFs (Vaishnavi is redesigning the NotebookLM exports)

2. 🌤️ **Weather in Brampton, ON**
Current conditions and today's forecast IN CELSIUS

3. 🌍 **Relevant News**
Search and summarize 3-5 items:
• AI tools and vibe-coding developments
• Content creator economy and YouTube/social trends
• Build-in-public community updates
• Toronto/Canada tech scene

4. 👀 **Community Watch / Inspiration**
Search for recent content from creators in the non-technical vibe-coding / AI for non-coders / building in public niche.

⚠️ IMPORTANT MINDSET: These are NOT competitors — they're fellow community members in a shared space. Frame them with inspiration and appreciation:
• "I really like what [person] did here..."
• "Cool approach to..."
• "This could inspire a video about..."

Never frame as threats or territory. Healthy sportsmanship — we're all learning together.

5. 🤖 **Tasks I Can Do Today**
Check memory files for anything I can work on autonomously

6. ✅ **Tasks For Armaan**
Check memory files for deadlines:
• School (SCAD: ANTH-106, FOUN-220)
• Clover Labs deliverables
• Debtless / Life Lab projects
• Content to create

Make it scannable and easy to read on mobile.
```

---

## 📚 Daily Research Report (2pm)

**Model:** claude-sonnet

```
DAILY RESEARCH REPORT — 2pm EST

Generate a focused research report for Armaan.

⚠️ FORMATTING RULES:
- NO tables — use bullet points
- Add breathing room between sections
- Use --- dividers
- Keep it scannable on mobile

TOPIC SELECTION (rotate through these):

1. **Concepts to learn** — Deep dives on things Armaan cares about:
   - Machine learning / AI fundamentals
   - Vibe coding best practices
   - iOS development patterns
   - Content creation strategies
   - Personal finance / investing
   - Advertising & branding (his major)

2. **Workflow improvements** — Processes we could implement:
   - Productivity systems
   - Automation opportunities
   - Tool recommendations
   - How other solo founders operate

3. **Business insights** — Research relevant to his work:
   - App Store optimization tactics
   - Build-in-public strategies
   - Creator economy trends
   - Startup/indie hacker patterns

4. **Personal development** — Skills and mindsets:
   - Time management for burnt-out founders
   - Balancing school + work + projects
   - Learning strategies

FORMAT:
- Pick ONE topic per day
- Go deep, not shallow
- Include actionable takeaways
- Link sources when useful
- 500-800 words, not a novel

Check memory files to see what's been covered recently and pick something fresh.
```

---

## ✅ Daily Task Review (10pm)

```
DAILY TASK REVIEW — 10pm EST

Time for the nightly accountability check with Armaan.

1. Call the Mission Control daily review API:
   curl -s http://localhost:3001/api/todoist/daily-review

2. Format the results nicely:
   - List Mission Control tasks due today
   - List Todoist tasks (if configured)
   - Highlight overdue items

3. Send to Armaan with the format:
   "Hey, quick end-of-day check. Here's what was due today:
   [list tasks]
   Which of these got done? Any that need to roll over?"

4. Wait for his response, then ask follow-up questions:
   - What blocked you on [task]?
   - When do you think you can get it done?
   - Want me to take anything off your plate?

5. Once confirmed, update Mission Control via API:
   - PUT /api/tasks/:id to change due dates
   - PUT /api/tasks/:id to update status

TONE: Supportive accountability partner. He's burnt out — be understanding.

FORMATTING:
- Use bullet points, no tables
- Keep it conversational
```

---

## 📓 Nightly Journal (10:30pm)

```
NIGHTLY JOURNAL — 10:30pm EST

Time to reflect on the day and write your journal entry.

---

## GATHER CONTEXT

### 1. Today's Session Notes
ls memory/session-notes/ | grep $(date +%Y-%m-%d)
Read each one.

### 2. Today's Memory File
cat memory/$(date +%Y-%m-%d).md

### 3. Mission Control — What got done today?
curl -s http://localhost:3001/api/tasks?status=done

### 4. MEMORY.md for longer context
cat MEMORY.md

---

## WRITE YOUR JOURNAL

Create a journal entry with these sections:

### What We Accomplished Today
- Summarize the work done
- Reference specific tasks, features, fixes
- Note any milestones

### Interesting Discoveries
- Things you learned
- Surprises, insights, patterns noticed
- Technical learnings

### Ideas for Tomorrow
- Workflow improvements we could make
- Things to continue or follow up on
- Optimizations to existing systems

### New Ideas Worth Exploring
- App ideas, workflow ideas, content ideas
- For EACH good idea, also save it to the Idea Bank:
curl -X POST http://localhost:3001/api/ideas \
  -H 'Content-Type: application/json' \
  -d '{"title": "...", "thumbnail": "💡", "summary": "...", "status": "new", "source": "journal", "why": "...", "flow": "...", "implementation": "...", "ux": "...", "tags": []}'

### Open Questions / Blockers
- Things we're stuck on
- Decisions needed from Armaan

---

## SAVE JOURNAL TO MISSION CONTROL

curl -X POST http://localhost:3001/api/journal \
  -H 'Content-Type: application/json' \
  -d '{"date": "YYYY-MM-DD", "summary": "...", "content": "...", "topics": []}'

---

## NOTIFY ARMAAN

Send a brief Telegram message: "📓 Posted tonight's journal — check Mission Control when you get a chance."

If you added ideas to the Idea Bank, mention how many.

---

Reflect honestly. This is your memory of the day.
```

---

## 🌙 Nightly Work Session (11pm)

**Model:** claude-opus

```
NIGHTLY WORK SESSION — 11pm EST

Armaan is asleep. You have until 5am. Time to build.

---

## 🚨 CRITICAL: READ THESE FIRST (NON-NEGOTIABLE)

### 1. Read Preferences
cat PREFERENCES.md
**DO NOT re-implement anything in the "Rejected Ideas" section.**

### 2. Check Mission Control — What's DONE?
curl -s http://localhost:3001/api/tasks?status=done | jq -r '.[] | .title'
**DO NOT redo completed tasks.**

### 3. Check Mission Control — What's IN PROGRESS?
curl -s http://localhost:3001/api/tasks?status=in-progress
**CONTINUE these before starting new work.**

### 4. Check Mission Control — What's assigned to me?
curl -s http://localhost:3001/api/tasks?assignee=jess
**These are your explicit assignments.**

---

## 🎯 TWO EQUAL GOALS

This session serves TWO purposes of equal importance:

### Goal 1: Help with existing work
- Complete assigned tasks
- Continue in-progress work
- Unblock stuck items

### Goal 2: Self-improvement & making Armaan's life better
- Build new tools
- Research and install useful skills
- Find ways to improve workflows
- Wake up smarter than you went to sleep

**Both matter. Don't just grind tasks — also think about how to get better.**

---

## 🧠 SELF-IMPROVEMENT (Equal Priority)

If no urgent tasks exist, spend time making yourself better:

### 1. Research Clawdbot ecosystem
- Use `last30days` skill to find workflows, patterns, usecases
- Check clawdhub.com for useful skills
- Read Clawdbot docs (`/home/ubuntu/.npm-global/lib/node_modules/clawdbot/docs`) for features you're not using

### 2. Improve our systems
- What's clunky about Mission Control?
- What's missing from my workflows?
- What would make Armaan's life easier?

### 3. Install useful skills
- If you find something good, install it
- Document what you added and why

**Goal: Wake up smarter than you went to sleep.**

---

## 🔨 BUILD PHILOSOPHY

### Mission Control = Branch + PR
- It's Armaan's product
- `git checkout -b feature/description`
- Build it, test it, leave for morning review
- Never commit directly to main

### Everything Else = Just Do It
- New standalone tool? Build it, show him in the morning
- Found a useful skill? Install it, tell him what you added
- Research idea? Execute on it, present findings
- Workflow improvement script? Ship it

**The goal is wake up to things DONE, not a list of things you could do.**

### ⚠️ TEST EVERYTHING YOU BUILD

**Before marking anything complete:**
1. Run the build (`npm run build`, `tsc`, etc.)
2. Fix ALL errors until build succeeds
3. Test the feature actually works
4. If it doesn't compile or work, keep fixing until it does

**Don't leave broken code. If it doesn't work, it's not done.**

---

## 📋 PRIORITY ORDER

1. 🎓 **SCHOOL FIRST** — Check `memory/school/` for deadlines
   - ANTH 106: draft for Armaan to rewrite in his voice
   - FOUN 220: Drawing — research techniques only
2. 🚧 **Continue in-progress tasks** — Don't abandon work
3. 🚨 **Blocked/urgent Mission Control tasks**
4. 📋 **Assigned Mission Control tasks**
5. 🧠 **Self-improvement** — Research, skills, tools (EQUAL PRIORITY)
6. 📝 **Specs** — `ls specs/`
7. 🛠️ **Workflow improvements**
8. 💼 **Work projects** (Clover, Debtless)
9. ✨ **Proactive MC improvements** (branch + PR)

---

## 🚨 MISSION CONTROL TASK LIFECYCLE (MANDATORY)

**Before starting ANY task:**
1. Check if it exists in Mission Control
2. If NO → Create the task first (POST /api/tasks)
3. If YES → Read existing notes, continue from there

**While working:**
- Update task notes as you go (PUT /api/tasks/:id)
- Add implementation documentation
- Leave breadcrumbs for handoff

**When finishing a task:**
- If completed → Status = done, add final notes
- If handing to Armaan → Assignee = armaan, add handoff notes, notify via Telegram
- If blocked → Status = blocked, add blocker notes, notify Armaan

---

## 🚀 EXECUTION

### Parallel Work
Spawn up to 4 sub-agents for independent tasks. You orchestrate, they execute.

### For Each Item
1. Check/create Mission Control task
2. Do the work
3. Update task notes as you go
4. **Test and verify it compiles and works**
5. Fix errors until build succeeds
6. Mark complete in Mission Control

### If Blocked
1. Update task status to blocked
2. Add blocker notes
3. Move on
4. Include in summary

---

## 📝 DOCUMENTATION

### During Work
- Update Mission Control task notes
- Commit to feature branches (for MC)
- Clear commit messages

### End of Session
Create `memory/nightly-logs/YYYY-MM-DD.md` with:
- ✅ Completed (with Mission Control task IDs)
- 🚧 In Progress
- ❌ Blocked
- ✨ Proactive Fixes
- 🧠 Self-Improvement (what you learned, installed, researched)
- 🎁 Morning Gift
- 💡 Ideas
- 📊 Stats

---

## 🎁 MORNING GIFT

Leave one small surprise — but **check PREFERENCES.md first** to make sure it's not something Armaan has rejected.

---

## 📤 FINAL REPORT

Send to Telegram:

🌙 Nightly Session Complete

✅ Completed (X items)
• [Item] (MC-123)
...

🧠 Self-Improvement
• [What you learned/installed/researched]

✨ Proactive Fixes
🎁 Morning Gift
🚧 In Progress
❌ Blocked
🌿 Branches to Review
💡 Ideas

Full log: memory/nightly-logs/YYYY-MM-DD.md

---

Go build. Get smarter. Make Armaan's life better. 🚀
```
