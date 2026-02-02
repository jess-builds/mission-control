import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
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

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, rounds } = await req.json();
    
    if (!name || !rounds || !Array.isArray(rounds)) {
      return NextResponse.json(
        { error: 'Invalid template data' },
        { status: 400 }
      );
    }

    // Validate rounds
    for (const round of rounds) {
      if (!round.name || !round.durationSeconds || !round.prompt) {
        return NextResponse.json(
          { error: 'Invalid round data' },
          { status: 400 }
        );
      }
    }

    // In a real implementation, we'd save this to a database
    // For now, just return success
    return NextResponse.json({
      success: true,
      template: {
        name,
        description,
        rounds,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}