# Mission Control 🚀

Your second brain for productivity, built with Next.js 14 and TypeScript.

![Mission Control Dashboard](screenshots/01-dashboard.png)

## Overview

Mission Control is a premium productivity system that combines task management, knowledge capture, habit tracking, and daily reflection into a unified workspace. Built for people who want more than just another todo app.

### Key Features

- 📋 **Advanced Task Management** - Subtasks, dependencies, documents, and AI-powered extraction
- 📝 **Smart Documents** - WYSIWYG editor with real-time saving
- 📓 **Daily Journaling** - Reflection prompts with automatic task extraction  
- 🎓 **Lecture Recording** - Capture, transcribe, and chat with your lectures
- 💊 **Medication Tracking** - Never miss your meds with visual reminders
- 🌤️ **Live Dashboard** - Weather, habits, focus timer, and activity timeline
- 🔔 **Jess Integration** - AI assistant notifications and task automation
- 🎯 **Project Management** - Track progress across multiple initiatives

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI primitives
- **Editor**: Lexical (Meta's rich text framework)
- **Storage**: Local JSON files (data directory)
- **APIs**: OpenAI (transcription, summaries), Weather (wttr.in)
- **Deployment**: Vercel (planned)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- OpenAI API key (for lecture features)

### Installation

```bash
# Clone the repository
git clone https://github.com/jess-builds/mission-control.git
cd mission-control

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Add your OpenAI API key to .env.local
# OPENAI_API_KEY=your-key-here

# Run development server
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) to see the app.

### Project Structure

```
mission-control/
├── src/
│   ├── app/                 # Next.js app router pages
│   │   ├── api/            # API routes
│   │   └── dashboard/      # Dashboard pages
│   ├── components/         # React components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── layout/         # Layout components
│   │   ├── lectures/       # Lecture system
│   │   └── ui/            # shadcn/ui components
│   └── lib/               # Utilities and helpers
├── data/                   # JSON data storage
│   ├── tasks.json         # Task data
│   ├── documents/         # Document files
│   ├── journal/           # Journal entries
│   └── lectures/          # Lecture recordings
├── public/                # Static assets
└── screenshots/           # App screenshots
```

## Features in Detail

### Task Management

- Create tasks with rich descriptions
- Assign to team members
- Set priorities and due dates
- Add tags for organization
- Attach reference documents
- Leave notes and comments
- Track blocked dependencies
- Auto-sync from journal entries

### Lecture Recorder

Perfect for students and lifelong learners:

1. **Record** - Capture audio from specific browser tabs (Zoom, Meet, etc)
2. **Transcribe** - Automatic transcription with OpenAI Whisper
3. **Extract** - AI extracts assignments, deadlines, and key points
4. **Summarize** - Get concise summaries of each lecture
5. **Chat** - Ask questions about your lectures with context

### Dashboard Widgets

- **Medication Tracker** - Visual pill reminder with one-click confirmation
- **School Deadlines** - Upcoming assignments from all courses
- **Weather Widget** - Current conditions with temperature-based theming
- **Habits Tracker** - Build streaks for daily habits
- **Focus Timer** - Pomodoro timer for deep work sessions
- **Activity Timeline** - See what's happening across the system
- **Quick Links** - Fast access to frequently used resources

### Jess Integration

Connect with your AI assistant:
- Get notified when assigned tasks
- Receive alerts for project notes
- Automatic task extraction from journals
- Lecture transcription notifications

## Development

### Commands

```bash
# Development
pnpm dev          # Start dev server
pnpm build        # Build for production  
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks

# Data Management
pnpm backup       # Backup data directory
pnpm restore      # Restore from backup
```

### API Routes

Key endpoints:

- `/api/tasks` - Task CRUD operations
- `/api/documents` - Document management
- `/api/journal` - Journal entries
- `/api/lectures/*` - Lecture recording system
- `/api/jess/notify` - AI assistant notifications
- `/api/timer` - Focus timer sessions
- `/api/activity` - Activity timeline

### Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## Roadmap

### Current Sprint
- [x] Core task management
- [x] Document editor
- [x] Journal system
- [x] Dashboard widgets
- [x] Lecture recorder
- [ ] Mobile responsive design
- [ ] Dark/light theme toggle

### Future Plans
- [ ] Calendar integration
- [ ] Email integration  
- [ ] Mobile apps (React Native)
- [ ] Team collaboration
- [ ] Advanced analytics
- [ ] Plugin system
- [ ] Offline support

## Philosophy

Mission Control is built on these principles:

1. **Own Your Data** - Everything stored locally, you control it
2. **Keyboard First** - Power user shortcuts for everything
3. **AI Augmented** - Not replaced, augmented by AI
4. **Beautiful UX** - Productivity tools should spark joy
5. **Integrated** - One system, not 10 different apps

## Credits

Built with ❤️ by Armaan & Jess

Special thanks to:
- shadcn for the beautiful UI components
- Vercel for Next.js and hosting
- The Lexical team for the editor
- OpenAI for transcription APIs

## License

MIT License - see LICENSE.md for details

---

**Questions?** Reach out on Twitter [@ArmAANcodes](https://twitter.com/ArmAANcodes)