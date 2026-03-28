#!/bin/bash
# Ralph Loop — autonomous AI agent that runs Claude Code repeatedly
# until all tasks are complete. Streams output live.
#
# Usage: ./scripts/ralph/ralph.sh [max_iterations]
# Default: 20 iterations

set -uo pipefail

MAX_ITERATIONS=${1:-20}
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
TMPFILE=$(mktemp /tmp/ralph-output.XXXXXX)

cd "$PROJECT_DIR"

RALPH_QUOTES=(
    "Me fail English? That's unpossible!"
    "I'm learnding!"
    "Hi, Super Nintendo Chalmers!"
    "I bent my Wookie..."
    "My cat's breath smells like cat food."
    "I found a moon rock in my nose!"
    "I'm Idaho!"
    "That's where I saw the leprechaun. He told me to burn things."
    "When I grow up, I wanna be a principal or a caterpillar."
    "Go banana!"
    "I'm a unitard!"
    "Even my boogers are sad."
    "I eated the purple berries..."
    "The doctor said I wouldn't have so many nose bleeds if I kept my finger outta there."
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
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  🦞 RALPH WIGGUM — AUTONOMOUS MODE 🦞   ║"
echo "  ║  Team: The French Lobster 🇫🇷             ║"
echo "  ║  \"I'm helping!\"                          ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║  Max iterations: $MAX_ITERATIONS                        ║"
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

    # Clear temp file
    > "$TMPFILE"

    # Run Claude Code with script to force PTY (enables live streaming on macOS)
    PROMPT="Read CLAUDE.md for full context. Check git log and current code to understand what's already done. Work on the next incomplete task in order. Implement it fully, run 'npm run build' to verify, commit and deploy your work (push to git + deploy to server as described in CLAUDE.md). Output <promise>COMPLETE</promise> ONLY if ALL tasks in CLAUDE.md are finished. If there are still tasks remaining, just stop after committing and deploying."
    script -q "$TMPFILE" bash -c "claude --dangerously-skip-permissions -p \"$PROMPT\" 2>&1"

    # Check for completion signal
    if grep -q "<promise>COMPLETE</promise>" "$TMPFILE"; then
        echo ""
        echo "  🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆"
        echo "  ┃                                       ┃"
        echo "  ┃   RALPH COMPLETED ALL TASKS! 🎉        ┃"
        echo "  ┃   \"I'm a winner!\"                      ┃"
        echo "  ┃   Iteration $i/$MAX_ITERATIONS — $(date '+%H:%M:%S')        ┃"
        echo "  ┃   Team: The French Lobster 🦞🇫🇷         ┃"
        echo "  ┃                                       ┃"
        echo "  🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆🦞🏆"
        rm -f "$TMPFILE"
        exit 0
    fi

    echo ""
    echo "  🦞 Iteration $i done. Ralph is restarting with fresh brain..."
    sleep 3
done

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  🦞 Ralph hit max iterations ($MAX_ITERATIONS)        ║"
echo "  ║  \"I tried and failed. The lesson is:     ║"
echo "  ║   never try.\" — Homer Simpson            ║"
echo "  ╚══════════════════════════════════════════╝"
rm -f "$TMPFILE"
exit 1
