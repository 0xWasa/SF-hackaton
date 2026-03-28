#!/bin/bash
# Ralph Loop — autonomous AI agent that runs Claude Code repeatedly
# until all tasks are complete. Based on Geoffrey Huntley's Ralph pattern.
#
# Usage: ./scripts/ralph/ralph.sh [max_iterations]
# Default: 20 iterations

set -euo pipefail

MAX_ITERATIONS=${1:-20}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_DIR"

RALPH_QUOTES=(
    "Me fail English? That's unpossible!"
    "I'm learnding!"
    "Hi, Super Nintendo Chalmers!"
    "I bent my Wookie..."
    "My cat's breath smells like cat food."
    "I found a moon rock in my nose!"
    "The doctor said I wouldn't have so many nose bleeds if I kept my finger outta there."
    "I'm Idaho!"
    "That's where I saw the leprechaun. He told me to burn things."
    "When I grow up, I wanna be a principal or a caterpillar."
    "My knob tastes funny."
    "I eated the purple berries..."
    "Even my boogers are sad."
    "I'm a unitard!"
    "Go banana!"
)

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
echo "  ╔══════════════════════════════════════╗"
echo "  ║  🦞 RALPH WIGGUM — AUTONOMOUS MODE  ║"
echo "  ║  \"I'm helping!\"                      ║"
echo "  ╠══════════════════════════════════════╣"
echo "  ║  Project: $(basename "$PROJECT_DIR")               ║"
echo "  ║  Max iterations: $MAX_ITERATIONS                    ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
    # Pick a random Ralph quote
    QUOTE="${RALPH_QUOTES[$((RANDOM % ${#RALPH_QUOTES[@]}))]}"

    echo ""
    echo "  🦞━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🦞"
    echo "  ┃ Ralph Iteration $i of $MAX_ITERATIONS"
    echo "  ┃ $(date '+%Y-%m-%d %H:%M:%S')"
    echo "  ┃ Ralph says: \"$QUOTE\""
    echo "  🦞━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━🦞"
    echo ""

    # Run Claude Code with the CLAUDE.md as context
    # --dangerously-skip-permissions: no human approval needed
    # --print: output mode (non-interactive)
    OUTPUT=$(claude --dangerously-skip-permissions --print \
        "Read CLAUDE.md for full context. Check git log and current code to understand what's already done. Work on the next incomplete task in order (HAC-8 through HAC-11). Implement it fully, run 'npm run build' to verify, commit your work, then output <promise>COMPLETE</promise> ONLY if ALL tasks in CLAUDE.md are finished. If there are still tasks remaining, just stop after committing — you'll be restarted with fresh context." \
        2>&1 | tee /dev/stderr) || true

    # Check for completion signal
    if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
        echo ""
        echo "  🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆"
        echo "  ┃                                       ┃"
        echo "  ┃   RALPH COMPLETED ALL TASKS!           ┃"
        echo "  ┃   \"I'm a winner!\"                      ┃"
        echo "  ┃   Finished at iteration $i/$MAX_ITERATIONS"
        echo "  ┃   $(date '+%Y-%m-%d %H:%M:%S')         ┃"
        echo "  ┃                                       ┃"
        echo "  🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆"
        exit 0
    fi

    echo ""
    echo "  🦞 Iteration $i done. Ralph is restarting with fresh context..."
    sleep 2
done

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║  🦞 Ralph hit max iterations ($MAX_ITERATIONS)    ║"
echo "  ║  \"I tried my best and failed.         ║"
echo "  ║   The lesson is: never try.\"          ║"
echo "  ║  Check git log to see progress.      ║"
echo "  ╚══════════════════════════════════════╝"
exit 1
