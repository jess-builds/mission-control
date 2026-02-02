---
title: Council UI - Handoff Notes
tags:
  - council
  - handoff
  - mission-control
createdAt: '2026-02-02'
updatedAt: '2026-02-02'
---
# Council UI - Handoff Notes

**Last Updated:** Feb 2, 2026 @ 2:00 AM EST
**Status:** In Progress
**Blocker:** Persistent agent architecture

---

## Where We Left Off

The Council UI is 80% complete but blocked on a core architecture issue: **agents cannot maintain persistent conversations**.

### What Works
- ✅ Full UI built (chat, sidebar, timer, round markers)
- ✅ WebSocket infrastructure (Socket.io client/server)
- ✅ Agent spawning (all 7 agents spin up correctly)
- ✅ Initial responses (agents introduce themselves)
- ✅ Timer and round management
- ✅ Armaan can send messages
- ✅ Export to Idea Bank

### What's Broken
- ❌ Agents don't receive follow-up messages
- ❌ Round progression stalls after initial responses
- ❌ No true "group chat" flow

---

## The Core Problem

`sessions_spawn` creates **one-shot tasks**:
1. Agent spawns with system prompt
2. Agent responds once
3. Agent exits

Even with `cleanup: 'keep'`, the session data persists but the agent isn't actively listening.

When `sessions_send` tries to send a follow-up message:
```json
{
  "status": "timeout",
  "sessionKey": "agent:main:subagent:..."
}
```

---

## Solution: True Persistent Agents

Need Clawdbot-level support for agents that:
1. Spawn and give initial response
2. **Stay alive** in a listening state
3. Receive subsequent messages via `sessions_send`
4. Respond naturally, creating conversation flow
5. Only exit when explicitly terminated

### Implementation Ideas

**Option A: Polling Loop**
- Agent spawns with task: "Listen for messages, respond when received"
- Background loop checks for new messages
- Responds and continues looping

**Option B: WebSocket Channel**
- Agent connects to a WebSocket
- Receives messages in real-time
- More efficient than polling

**Option C: sessions_spawn Enhancement**
- New parameter: `persistent: true`
- Agent stays alive after initial response
- `sessions_send` works because agent is listening

---

## To Resume Work

1. **Research:** Check if Clawdbot has any existing persistent agent support
2. **Design:** Pick an implementation approach
3. **Implement:** Either in Clawdbot core or as workaround
4. **Test:** Full council flow with conversation
5. **Polish:** Fix any remaining UI issues

---

## Quick Test Commands

```bash
# Start Mission Control
cd /home/ubuntu/mission-control && node server-custom.js

# Check if running
curl http://localhost:3001/api/tasks | jq 'length'

# Watch logs
Process logs in terminal running server

# List active sessions
curl http://localhost:18789/tools/invoke -H "Content-Type: application/json" -d '{"tool": "sessions_list", "args": {"limit": 10}}' | jq
```

---

## Key Files

| Purpose | File |
|---------|------|
| Agent spawning | `server/council/clawdbotClient.ts` |
| Orchestration | `server/council/councilOrchestrator.ts` |
| Socket events | `server/council/councilSocket.ts` |
| UI messages | `src/components/council/CouncilMessage.tsx` |
| State management | `src/hooks/useCouncilSession.ts` |
| Personas | `server/council/personas/*.json` |
