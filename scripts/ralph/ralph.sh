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

echo "============================================"
echo " Ralph Wiggum - Autonomous Trading Agent"
echo " Project: $(basename "$PROJECT_DIR")"
echo " Max iterations: $MAX_ITERATIONS"
echo "============================================"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo "==============================================================="
    echo " Ralph Iteration $i of $MAX_ITERATIONS"
    echo " $(date '+%Y-%m-%d %H:%M:%S')"
    echo "==============================================================="

    # Run Claude Code with the CLAUDE.md as context
    # --dangerously-skip-permissions: no human approval needed
    # --print: output mode (non-interactive)
    OUTPUT=$(claude --dangerously-skip-permissions --print \
        "Read CLAUDE.md for full context. Check git log and current code to understand what's already done. Work on the next incomplete task in order (HAC-8 through HAC-11). Implement it fully, run 'npm run build' to verify, commit your work, then output <promise>COMPLETE</promise> ONLY if ALL tasks in CLAUDE.md are finished. If there are still tasks remaining, just stop after committing — you'll be restarted with fresh context." \
        2>&1 | tee /dev/stderr) || true

    # Check for completion signal
    if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
        echo ""
        echo "============================================"
        echo " Ralph completed ALL tasks!"
        echo " Finished at iteration $i of $MAX_ITERATIONS"
        echo " $(date '+%Y-%m-%d %H:%M:%S')"
        echo "============================================"
        exit 0
    fi

    echo ""
    echo "Iteration $i complete. Continuing to next task..."
    sleep 2
done

echo ""
echo "============================================"
echo " Ralph hit max iterations ($MAX_ITERATIONS)"
echo " Check git log to see what was completed."
echo "============================================"
exit 1
