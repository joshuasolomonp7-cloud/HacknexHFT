"""
End-to-end verification script testing SWEAgent autonomous closed-loop repair
on the multi-file ecommerce_order_api benchmark.
"""

import asyncio
import os
from core.agent import SWEAgent
from core.verification_pipeline import VerificationPipeline
from main import reset_repository

async def main():
    repo_path = os.path.abspath("sample_repos/ecommerce_order_api")
    print(f"=== 1. Resetting {os.path.basename(repo_path)} to initial buggy state ===")
    reset_res = reset_repository(repo_path)
    print("Reset result:", reset_res)

    print("\n=== 2. Verifying baseline tests fail ===")
    verifier = VerificationPipeline(repo_path)
    baseline = verifier.execute_test_command()
    print(f"Baseline tests passed: {baseline['passed']} (Expected: False)")
    print(f"Failed tests count: {baseline.get('failed_tests', 0)}")

    print("\n=== 3. Running CodeNexus SWEAgent simulation ===")
    agent = SWEAgent(repo_path=repo_path)
    event_count = 0
    async for event in agent.run_simulation("Fix multi-file bugs in ecommerce_order_api"):
        event_count += 1
        ev_type = event.get("type")
        if ev_type in ("ast_indexed", "evidence_before", "bug_queue_updated", "inspection_scope", "blast_radius_calculated", "patch_applied", "evidence_after", "final_report", "complete"):
            print(f"[{event_count:02d}] EVENT: {ev_type}")
            if ev_type == "blast_radius_calculated":
                print("     Blast Radius:", event["blast_radius"]["risk_rating"], "| Callers:", event["blast_radius"]["caller_count"])
            elif ev_type == "patch_applied":
                print("     Patch:", event["patch"]["message"])
            elif ev_type == "final_report":
                print("     Report:", event["report"]["summary"].encode('ascii', 'replace').decode('ascii'))

    print("\n=== 4. Verifying post-repair test suite ===")
    post_test = verifier.execute_test_command()
    print(f"Post-repair tests passed: {post_test['passed']} (Expected: True)")
    print(f"Total passing tests: {post_test.get('total_tests', 0)}")
    print("\n=== SUCCESS: End-to-End Autonomous Repair Completed! ===")

if __name__ == "__main__":
    asyncio.run(main())
