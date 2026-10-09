#!/usr/bin/env python3
"""
CodeNexus AI - Autonomous Software Engineering & Verification CLI
Run directly inside any project directory to autonomously localize bugs, apply surgical patches, and verify test suites.
"""

import os
import sys
import argparse
import asyncio
from dotenv import load_dotenv

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from core.agent import SWEAgent
from tools import workspace_tools

load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

async def run_cli(target_path: str, prompt: str, model_name: str, force_demo: bool):
    abs_path = os.path.abspath(target_path)
    if not os.path.exists(abs_path):
        print(f"\n❌ Error: Target project directory does not exist: {abs_path}")
        sys.exit(1)

    print("\n" + "=" * 65)
    print("🤖 CodeNexus AI - Autonomous Software Engineering Agent (CLI)")
    print("=" * 65)
    print(f"📁 Target Project : {abs_path}")
    print(f"📝 Task / Issue   : {prompt}")
    print(f"🧠 Engine Mode    : {'Autonomous Offline Demo' if force_demo else f'Live AI ({model_name})'}")
    print("=" * 65 + "\n")

    # Baseline test check
    print("🔍 [Step 1/3] Running baseline test suite...")
    initial_test = workspace_tools.run_tests(abs_path)
    if initial_test.get("passed"):
        print("  ℹ️ Note: Baseline tests are already passing. CodeNexus will apply requested modifications.")
    else:
        print("  ⚠️ Baseline tests are FAILING (as expected for bug repair).")

    print("\n⚡ [Step 2/3] Executing Re-Act Autonomous Repair Loop...\n")

    agent = SWEAgent(repo_path=abs_path, model_name=model_name)

    async for event in agent.run(task_prompt=prompt, force_demo=force_demo):
        ev_type = event.get("type")

        if ev_type == "thought":
            print(f"💡 Thought #{event.get('iteration')}: {event.get('content')}\n")
        elif ev_type == "tool_call":
            tool_name = event.get("tool")
            args = event.get("args", {})
            print(f"🔧 Tool Invocation: [{tool_name}] -> {args}")
        elif ev_type == "tool_result":
            tool_name = event.get("tool")
            res = event.get("result", {})
            if tool_name == "edit_file_replace":
                print(f"  ✏️ Patch Applied: {res.get('message', 'Updated successfully')}\n")
            elif tool_name == "run_tests":
                status = "PASS ✅" if res.get("passed") else "FAIL ❌"
                print(f"  🧪 Test Run Result: {status}\n")
        elif ev_type == "complete":
            print("=" * 65)
            print("🎉 [Step 3/3] VERIFICATION COMPLETE")
            print("=" * 65)
            print(event.get("summary"))
            print("=" * 65 + "\n")
            return
        elif ev_type == "error":
            print(f"\n❌ Error: {event.get('message')}\n")
            return

def main():
    parser = argparse.ArgumentParser(description="CodeNexus AI - Autonomous Software Engineering CLI")
    parser.add_argument("prompt", nargs="?", default="Fix the failing tests in this repository with zero regressions.", help="Task or bug description")
    parser.add_argument("--path", "-p", default=os.getcwd(), help="Target project path (defaults to current folder)")
    parser.add_argument("--model", "-m", default="gemini-2.5-flash", help="Gemini model name")
    parser.add_argument("--demo", "-d", action="store_true", help="Run in autonomous offline demo mode (no API key needed)")

    args = parser.parse_args()

    # If in root of repo and no prompt given, default to sample math repo demo
    target = args.path
    if target == os.getcwd() and not os.path.exists(os.path.join(target, "calculator.py")) and not os.path.exists(os.path.join(target, "package.json")):
        sample_path = os.path.join(os.path.dirname(__file__), "backend", "sample_repos", "math_utils")
        if os.path.exists(sample_path):
            target = sample_path
            print(f"ℹ️ No active codebase in root. Targeting benchmark repository: {target}")

    asyncio.run(run_cli(
        target_path=target,
        prompt=args.prompt,
        model_name=args.model,
        force_demo=args.demo
    ))

if __name__ == "__main__":
    main()
