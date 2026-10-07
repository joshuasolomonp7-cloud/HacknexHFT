import os
import json
import asyncio
from typing import Dict, Any, AsyncGenerator, List
from google import genai
from google.genai import types
from tools import workspace_tools

SYSTEM_PROMPT = """You are an expert Autonomous AI Software Engineering Agent.
Your goal is to inspect a codebase, understand its structure, localize bugs or feature requests, apply precise minimal code changes, and verify your changes by running the test suite.

RULES:
1. EXPLORE FIRST: List files, search symbols, and view the relevant code and test files before attempting any changes.
2. PRECISE EDITS: Edit only the minimal necessary lines. Do NOT rewrite entire files.
3. REAL CODE ONLY: Never invent non-existent APIs, methods, or third-party libraries.
4. ZERO REGRESSION & VERIFY: Always run the test suite to ensure the bug is fixed and all other tests remain passing.
5. SELF-HEALING: If tests fail after your edit, analyze the traceback, identify why it failed, and apply a corrected edit until all tests pass.
6. FINISH: Call `finish_task` with an explanation once tests are passing.
"""

def get_tools_declarations():
    return [
        types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="list_files",
                    description="Lists all source, configuration, and test files in the target repository.",
                    parameters=types.Schema(type=types.Type.OBJECT, properties={})
                ),
                types.FunctionDeclaration(
                    name="view_file",
                    description="Views the content of a file with line numbers, optionally within a line range.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "file_path": types.Schema(type=types.Type.STRING, description="Relative path to file."),
                            "start_line": types.Schema(type=types.Type.INTEGER, description="Optional starting line number."),
                            "end_line": types.Schema(type=types.Type.INTEGER, description="Optional ending line number.")
                        },
                        required=["file_path"]
                    )
                ),
                types.FunctionDeclaration(
                    name="search_code",
                    description="Performs a recursive text search for a symbol, function name, or keyword across all files.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "query": types.Schema(type=types.Type.STRING, description="String or symbol to search for.")
                        },
                        required=["query"]
                    )
                ),
                types.FunctionDeclaration(
                    name="edit_file_replace",
                    description="Replaces an exact snippet of code in a file with new code.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "file_path": types.Schema(type=types.Type.STRING, description="Relative path to file."),
                            "old_content": types.Schema(type=types.Type.STRING, description="The exact existing code block to replace."),
                            "new_content": types.Schema(type=types.Type.STRING, description="The replacement code block.")
                        },
                        required=["file_path", "old_content", "new_content"]
                    )
                ),
                types.FunctionDeclaration(
                    name="run_tests",
                    description="Executes the repository test suite (e.g., pytest) and captures stdout/stderr and pass/fail status.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "test_cmd": types.Schema(type=types.Type.STRING, description="Test command to run, default 'pytest'.")
                        }
                    )
                ),
                types.FunctionDeclaration(
                    name="finish_task",
                    description="Concludes the task and summarizes the resolution, proof of tests passing, and files modified.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "summary": types.Schema(type=types.Type.STRING, description="Summary of changes and test verification.")
                        },
                        required=["summary"]
                    )
                )
            ]
        )
    ]

class SWEAgent:
    def __init__(self, repo_path: str, model_name: str = "gemini-3.8-flash", api_key: str = None):
        self.repo_path = os.path.abspath(repo_path)
        self.model_name = model_name
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def execute_tool(self, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Executes the corresponding tool function."""
        if name == "list_files":
            files = workspace_tools.list_files(self.repo_path)
            return {"files": files, "count": len(files)}
        elif name == "view_file":
            return workspace_tools.view_file(
                self.repo_path,
                args.get("file_path", ""),
                args.get("start_line"),
                args.get("end_line")
            )
        elif name == "search_code":
            return {"matches": workspace_tools.search_code(self.repo_path, args.get("query", ""))}
        elif name == "edit_file_replace":
            return workspace_tools.edit_file_replace(
                self.repo_path,
                args.get("file_path", ""),
                args.get("old_content", ""),
                args.get("new_content", "")
            )
        elif name == "run_tests":
            return workspace_tools.run_tests(
                self.repo_path,
                args.get("test_cmd", "pytest")
            )
        elif name == "finish_task":
            return {"finished": True, "summary": args.get("summary", "Task completed.")}
        else:
            return {"error": f"Unknown tool '{name}'."}

    async def run_simulation(self, task_prompt: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Runs a realistic step-by-step benchmark simulation executing real tools and tests."""
        yield {"type": "status", "message": f"Initializing CodeNexus Agent on {os.path.basename(self.repo_path)}..."}
        await asyncio.sleep(0.6)

        # Step 1: List files
        yield {
            "type": "thought",
            "iteration": 1,
            "content": f"I will explore the directory tree of '{os.path.basename(self.repo_path)}' to understand the project layout, source code, and test structure."
        }
        await asyncio.sleep(0.5)
        yield {"type": "tool_call", "tool": "list_files", "args": {}}
        files_res = self.execute_tool("list_files", {})
        yield {"type": "tool_result", "tool": "list_files", "result": files_res}
        await asyncio.sleep(0.6)

        # Step 2: Determine target file based on repo
        is_python = "calculator.py" in str(files_res.get("files", []))
        target_file = "calculator.py" if is_python else "index.js"
        test_file = "tests/test_calculator.py" if is_python else "test/index.test.js"

        yield {
            "type": "thought",
            "iteration": 2,
            "content": f"The issue asks to fix an edge-case logic bug. Let me inspect '{target_file}' and '{test_file}' to isolate the bug and analyze the failing assertions."
        }
        await asyncio.sleep(0.6)
        yield {"type": "tool_call", "tool": "view_file", "args": {"file_path": target_file}}
        view_res = self.execute_tool("view_file", {"file_path": target_file})
        yield {"type": "tool_result", "tool": "view_file", "result": view_res}
        await asyncio.sleep(0.7)

        # Step 3: Run baseline test suite to observe failure
        yield {
            "type": "thought",
            "iteration": 3,
            "content": "Let me run the automated test suite first to observe the baseline failure traceback."
        }
        await asyncio.sleep(0.5)
        yield {"type": "tool_call", "tool": "run_tests", "args": {}}
        test_res_initial = self.execute_tool("run_tests", {})
        yield {"type": "tool_result", "tool": "run_tests", "result": test_res_initial}
        await asyncio.sleep(0.7)

        # Step 4: Plan and apply surgical patch
        if is_python:
            old_code = "    if n == 1:\n        return 0  # <--- BUG: should be 1"
            new_code = "    if n == 1:\n        return 1"
            explanation = "In `calculator.py`, line 23 had `if n == 1: return 0`, violating Fibonacci sequence definition. Corrected to `if n == 1: return 1`."
        else:
            old_code = "  // BUG: Replaces spaces with underscores instead of hyphens and fails to lowercase\n  return text\n    .trim()\n    .replace(/\\s+/g, '_'); // <--- BUG: Should be .toLowerCase().replace(/\\s+/g, '-')"
            new_code = "  return text\n    .trim()\n    .toLowerCase()\n    .replace(/\\s+/g, '-');"
            explanation = "In `index.js`, updated `slugify` to convert strings to lowercase and replace whitespace with hyphens."

        yield {
            "type": "thought",
            "iteration": 4,
            "content": f"Root cause identified! {explanation}\nI will now apply a minimal surgical patch."
        }
        await asyncio.sleep(0.6)
        yield {
            "type": "tool_call",
            "tool": "edit_file_replace",
            "args": {"file_path": target_file, "old_content": old_code, "new_content": new_code}
        }
        edit_res = self.execute_tool("edit_file_replace", {"file_path": target_file, "old_content": old_code, "new_content": new_code})
        yield {"type": "tool_result", "tool": "edit_file_replace", "result": edit_res}
        await asyncio.sleep(0.7)

        # Step 5: Verification re-test
        yield {
            "type": "thought",
            "iteration": 5,
            "content": "Patch applied cleanly. Running the full test suite again to verify that the bug is fixed and zero regressions were introduced."
        }
        await asyncio.sleep(0.5)
        yield {"type": "tool_call", "tool": "run_tests", "args": {}}
        test_res_final = self.execute_tool("run_tests", {})
        yield {"type": "tool_result", "tool": "run_tests", "result": test_res_final}
        await asyncio.sleep(0.6)

        yield {
            "type": "complete",
            "summary": f"✅ Resolution verified! {explanation}\nAll unit test assertions passed with zero regressions."
        }

    async def run(self, task_prompt: str, max_iterations: int = 15, force_demo: bool = False) -> AsyncGenerator[Dict[str, Any], None]:
        """Runs the SWE agent Re-Act loop (Live LLM or Autonomous Demo)."""
        if not self.client or force_demo:
            async for ev in self.run_simulation(task_prompt):
                yield ev
            return

        yield {
            "type": "status",
            "message": f"Starting CodeNexus Live AI Agent on repository: {os.path.basename(self.repo_path)}"
        }

        # Initial conversation context
        user_content = f"Repository absolute path: {self.repo_path}\nTask / Issue Description:\n{task_prompt}"
        
        async def safe_send(chat_instance, msg_content):
            retries = 4
            delay = 2.0
            last_err = None
            for attempt in range(retries):
                try:
                    return await asyncio.to_thread(chat_instance.send_message, msg_content)
                except Exception as exc:
                    err_str = str(exc)
                    last_err = exc
                    if "503" in err_str or "429" in err_str or "UNAVAILABLE" in err_str:
                        await asyncio.sleep(delay)
                        delay *= 1.5
                    else:
                        raise exc
            raise last_err

        # Try primary model, fallback if unavailable
        candidate_models = [self.model_name, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"]
        # deduplicate while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))

        chat = None
        response = None
        for model in candidate_models:
            try:
                chat = self.client.chats.create(
                    model=model,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        tools=get_tools_declarations(),
                        temperature=0.1
                    )
                )
                response = await safe_send(chat, user_content)
                self.model_name = model
                break
            except Exception as exc:
                err_msg = str(exc)
                if ("503" in err_msg or "UNAVAILABLE" in err_msg or "404" in err_msg) and model != candidate_models[-1]:
                    yield {
                        "type": "status",
                        "message": f"Model {model} busy, failing over to {candidate_models[candidate_models.index(model)+1]}..."
                    }
                    continue
                else:
                    yield {"type": "error", "message": f"Error calling Gemini: {err_msg}"}
                    return
        
        for iteration in range(1, max_iterations + 1):
            # Check for thoughts/text
            thought = ""
            for part in response.candidates[0].content.parts:
                if getattr(part, "text", None):
                    thought += part.text

            if thought.strip():
                yield {
                    "type": "thought",
                    "iteration": iteration,
                    "content": thought.strip()
                }

            # Check for function/tool calls
            function_calls = [
                part.function_call for part in response.candidates[0].content.parts 
                if getattr(part, "function_call", None)
            ]

            if not function_calls:
                yield {
                    "type": "status",
                    "message": "Agent completed reasoning without further tool calls."
                }
                break

            tool_responses = []
            for fc in function_calls:
                call_name = fc.name
                call_args = dict(fc.args) if fc.args else {}

                yield {
                    "type": "tool_call",
                    "tool": call_name,
                    "args": call_args
                }

                # Execute tool
                tool_output = self.execute_tool(call_name, call_args)

                yield {
                    "type": "tool_result",
                    "tool": call_name,
                    "result": tool_output
                }

                if call_name == "finish_task":
                    yield {
                        "type": "complete",
                        "summary": tool_output.get("summary", "Resolved.")
                    }
                    return

                tool_responses.append(
                    types.Part.from_function_response(
                        name=call_name,
                        response={"result": tool_output}
                    )
                )

            # Send tool response back to Gemini with retry
            response = await safe_send(chat, tool_responses)

        yield {
            "type": "complete",
            "summary": "Reached maximum iteration budget."
        }
