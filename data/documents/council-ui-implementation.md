---
title: Council UI - Implementation Notes
tags:
  - council
  - implementation
  - technical
  - mission-control
createdAt: '2026-02-02'
updatedAt: '2026-02-02'
---
# Council UI - Implementation Notes

**Project:** Mission Control Council Feature
**Started:** Feb 1, 2026
**Last Session:** Feb 2, 2026 @ 2:00 AM EST

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React UI      │────▶│  Socket.io      │────▶│  Orchestrator   │
│   (Next.js)     │◀────│  (Server)       │◀────│  (Node.js)      │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  Clawdbot API   │
                                                │  (sessions_*)   │
                                                └─────────────────┘
```

---

## Components Built

### Frontend (`src/components/council/`)

| Component | Purpose | Status |
|-----------|---------|--------|
| `CouncilChat.tsx` | Main chat container | ✅ Complete |
| `CouncilMessage.tsx` | Individual message bubble | ✅ Complete |
| `CouncilTimer.tsx` | Round timer display | ✅ Complete |
| `CouncilSidebar.tsx` | Agent list + actions | ✅ Complete |
| `CouncilConfig.tsx` | Round configuration | ✅ Complete |
| `CouncilHeader.tsx` | Round name + status | ✅ Complete |
| `AgentAvatar.tsx` | Agent emoji + status | ✅ Complete |
| `TypingIndicator.tsx` | "Agent is typing..." | ✅ Complete |
| `RoundMarker.tsx` | Visual round separator | ✅ Complete |
| `MessageInput.tsx` | Input with @mention | ✅ Complete |
| `CouncilCommandCenter.tsx` | Settings panel | ✅ Complete |

### Backend (`server/council/`)

| File | Purpose | Status |
|------|---------|--------|
| `councilRouter.ts` | Express routes | ✅ Complete |
| `councilSocket.ts` | Socket.io handlers | ✅ Complete |
| `councilOrchestrator.ts` | Agent spawn/message | ⚠️ Needs persistent agents |
| `timerService.ts` | Server-side timer | ✅ Complete |
| `clawdbotClient.ts` | Clawdbot API wrapper | ⚠️ Limited by spawn model |
| `personas/*.json` | 7 agent personas | ✅ Complete |

### Hooks (`src/hooks/`)

| Hook | Purpose | Status |
|------|---------|--------|
| `useCouncilSocket.ts` | Socket connection | ✅ Complete |
| `useCouncilSession.ts` | Session state | ✅ Complete (dedup fixed) |

---

## Data Flow

### Session Creation
```
UI: Click "Start Council"
  ↓
Socket: council:create event
  ↓
Orchestrator: Creates session, spawns 7 agents
  ↓
Clawdbot: sessions_spawn for each agent
  ↓
Agents: Respond with introduction
  ↓
Orchestrator: Collects responses, emits council:message
  ↓
Socket: Broadcasts to UI
  ↓
UI: Renders messages
```

### Message Flow (Current - Broken)
```
Orchestrator: Calls sessions_send to agent
  ↓
Clawdbot: Tries to send message
  ↓
Agent: NOT LISTENING (already completed task)
  ↓
Clawdbot: Returns timeout
  ↓
Orchestrator: Logs "Failed to get response"
```

### Message Flow (Desired)
```
Orchestrator: Calls sessions_send to agent
  ↓
Clawdbot: Sends message to persistent session
  ↓
Agent: LISTENING, receives message
  ↓
Agent: Responds
  ↓
Clawdbot: Returns reply
  ↓
Orchestrator: Emits council:message
  ↓
UI: Renders new message
```

---

## API Endpoints

### REST
```
POST   /api/council/sessions              ✅
GET    /api/council/sessions              ✅
GET    /api/council/sessions/:id          ✅
POST   /api/council/sessions/:id/start    ✅
POST   /api/council/sessions/:id/pause    ✅
POST   /api/council/sessions/:id/resume   ✅
POST   /api/council/sessions/:id/message  ⚠️ (depends on persistent agents)
POST   /api/council/sessions/:id/advance  ✅
POST   /api/council/sessions/:id/end      ✅
POST   /api/council/sessions/:id/export   ✅
```

### WebSocket Events
```
council:connect       ✅
council:message       ⚠️ (fires but agents don't respond after initial)
council:typing        ✅
council:timer         ✅
council:round         ✅
council:status        ✅
council:agent         ✅
council:error         ✅
council:agents_ready  ✅
```

---

## Fixes Applied Tonight (Feb 2)

### 1. White Text for Agent Messages
**File:** `src/components/council/CouncilMessage.tsx`
```diff
- : 'bg-muted'
+ : 'bg-muted text-foreground prose-invert'
```

### 2. Duplicate Message Fix
**File:** `src/hooks/useCouncilSession.ts`
```typescript
const handleMessage = (data) => {
  setMessages(prev => {
    // Dedupe: check if message already exists
    if (prev.some(m => m.id === data.message.id)) {
      return prev;
    }
    return [...prev, data.message];
  });
};
```

### 3. Session Persistence Attempt
**File:** `server/council/clawdbotClient.ts`
```typescript
args: {
  task: systemPrompt,
  label: label,
  model: modelMap[persona.model],
  timeoutSeconds: 1800,
  cleanup: 'keep'  // NEW: Keep session alive
}
```
**Result:** Sessions persist but agents still don't listen.

---

## Agent Personas

| Role | Model | Emoji | Purpose |
|------|-------|-------|--------|
| Visionary | Opus | 🔮 | Creative proposals, big thinking |
| Pragmatist | Sonnet | 🔨 | Buildability assessment |
| Critic | Opus | 🎯 | Flaw detection, stress testing |
| Behavioral Realist | Opus | 🧠 | Predicts actual user behavior |
| Pattern Archaeologist | Sonnet | 🔍 | Historical patterns from memory |
| Systems Architect | Sonnet | 🏗️ | Integration analysis |
| Cognitive Load | Sonnet | ⚡ | Attention cost evaluation |

---

## Known Issues

1. **Persistent agents** — Core blocker, needs Clawdbot changes
2. **Round progression** — Stalls because agents can't receive follow-up
3. **Type errors** — Fixed in earlier session (council.ts event naming)

---

## Test Checklist

- [x] Create new council session
- [x] All 7 agents spawn
- [x] Initial responses appear in UI
- [x] Timer counts down
- [x] Armaan can send message
- [ ] Agents respond to Armaan's message
- [ ] Round advances with new responses
- [ ] Full 6-round flow completes
- [ ] Export to Idea Bank works

---

## Performance Notes

- Agent spawn time: ~8-12 seconds each
- All 7 agents spawn in parallel
- Total startup time: ~15-20 seconds
- UI feels responsive with typing indicators
