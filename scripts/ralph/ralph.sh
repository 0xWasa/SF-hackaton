#!/bin/bash
# Ralph Loop — autonomous AI agent that runs Claude Code repeatedly.
# Runs ALL iterations no matter what. Never stops early.
#
# Usage: ./scripts/ralph/ralph.sh [max_iterations]
# Default: 20 iterations

MAX_ITERATIONS=${1:-20}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Prevent Mac from sleeping while Ralph works
caffeinate -dims -w $$ &

cd "$PROJECT_DIR"

RALPH_QUOTES=(
    "Me fail English? Thats unpossible!"
    "I am learnding!"
    "Hi, Super Nintendo Chalmers!"
    "I bent my Wookie..."
    "My cats breath smells like cat food."
    "I found a moon rock in my nose!"
    "I am Idaho!"
    "When I grow up, I wanna be a principal or a caterpillar."
    "Go banana!"
    "I am a unitard!"
    "Even my boogers are sad."
    "I eated the purple berries..."
)

PROMPT="Read CLAUDE.md carefully. Check git log to see what has been done already.

RULES:
1. Pick ONE task from CLAUDE.md that is not yet implemented or has bugs. Implement it fully.
2. Run npm run build and fix any errors until it passes clean.
3. Commit, push to git, and deploy to the server (follow deploy instructions in CLAUDE.md exactly).
4. After deploying, do a quick audit: does the site load? Are there errors? Does the feature work?
5. Do NOT output the word COMPLETE anywhere. You are NEVER done. There is always more to improve.
6. Stop after finishing one task. You will be restarted automatically with fresh context.

PRIORITY ORDER:
- First: Fix bugs (HAC-24 trade sizing is urgent)
- Then: New features (HAC-23 onboarding with wallet, HAC-25 markets page)
- Then: Polish, easter eggs, design improvements
- Always: If you see something broken, fix it immediately"

echo ""
echo "  ⠀⠀⠀⠀⠀⠀⣀⣀⡤⠤⠤⣤⣀⡀⠀⠀⠀⠀⠀⠀"
echo "  ⠀⠀⠀⣠⠶⠋⠁⠀⠀⠀⠀⠀⠀⠉⠓⢦⡀⠀⠀⠀"
echo "  ⠀⢀⡾⠁⠀🦞⠀⠀⠀⠀⠀⠀🦞⠀⠈⢷⡀⠀"
echo "  ⠀⣸⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡄⠀"
echo "  ⠀⣿⠀⠀⠀⠀⠀⠀⣤⠀⠀⠀⠀⠀⠀⠀⠀⢸⡇⠀"
echo "  ⠀⢿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡾⠀⠀"
echo "  ⠀⠀⠻⣄⠀⠀⠈⠉⠉⠉⠉⠁⠀⠀⢀⣴⠟⠀⠀⠀"
echo "  ⠀⠀⠀⠈⠛⠶⣤⣀⣀⣀⣀⣤⠶⠛⠉⠀⠀⠀⠀⠀"
echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  🦞 RALPH WIGGUM — AUTONOMOUS MODE 🦞   ║"
echo "  ║  Team: The French Lobster 🇫🇷             ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  Max iterations: $MAX_ITERATIONS                        ║"
echo "  ║  Will run ALL iterations automatically   ║"
echo "  ║  Safe to walk away now                   ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
    QUOTE="${RALPH_QUOTES[$((RANDOM % ${#RALPH_QUOTES[@]}))]}"

    echo ""
    echo "  🦞━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🦞"
    echo "  ┃ Iteration $i of $MAX_ITERATIONS"
    echo "  ┃ $(date '+%H:%M:%S')"
    echo "  ┃ Ralph says: \"$QUOTE\""
    echo "  🦞━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🦞"
    echo ""

    # Run Claude Code. || true ensures the loop NEVER stops even if Claude crashes.
    claude --dangerously-skip-permissions -p "$PROMPT" 2>&1 || true

    echo ""
    echo "  🦞 Iteration $i finished at $(date '+%H:%M:%S'). Next iteration in 5s..."
    echo ""
    sleep 5
done

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  🦞 Ralph finished all $MAX_ITERATIONS iterations     ║"
echo "  ║  Check git log and the live site.        ║"
echo "  ╚══════════════════════════════════════════╝"
exit 0
