"""
Agent spawner module for MAF-BDD Orchestrator.

This module provides the AgentSpawner class which manages the lifecycle of
ephemeral implementer and reviewer agents spawned as subprocesses.
"""

import subprocess
import tempfile
import logging
import json
import re
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class AgentSpawner:
    """
    Manages agent spawn-and-kill lifecycle for implementer and reviewer agents.

    Responsibilities:
    - Spawning implementer agents with bead context and escalation info
    - Spawning reviewer agents with commit information
    - Killing agents and waiting for cleanup

    Uses subprocess and tempfile to manage ephemeral Claude agents.
    """

    def __init__(self):
        """Initialize the agent spawner."""
        self.claude_command = "claude"
        self.default_model = "sonnet"

    def spawn_implementer(
        self,
        bead: Dict[str, Any],
        escalation_context: Dict[str, Any],
        preflight_result: Dict[str, Any]
    ) -> subprocess.Popen:
        """
        Spawn an implementer agent subprocess for a bead.

        Loads implementer prompt, writes to temp file, spawns subprocess with
        'claude --prompt-file --model sonnet'.

        Args:
            bead: Dictionary containing bead information including:
                - id: Bead identifier
                - title: Bead title
                - description: Bead description
                - (optional) dependencies: List of dependency bead IDs
            escalation_context: Dictionary containing escalation info for retries:
                - last_result: Previous attempt result
                - last_attempted_at: When last attempt was made
                - attempts: Number of attempts made
            preflight_result: Dictionary containing preflight validation results:
                - status: 'passed' or 'failed'
                - checks: List of preflight check results

        Returns:
            subprocess.Popen: The spawned process object

        Raises:
            subprocess.SubprocessError: If spawning fails
            IOError: If temp file creation fails
        """
        try:
            # Generate implementer prompt from bead context
            prompt = self._generate_implementer_prompt(bead, escalation_context, preflight_result)

            # Write prompt to temp file
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.txt',
                prefix='claude_implementer_',
                delete=False
            ) as f:
                f.write(prompt)
                prompt_file = f.name

            # Spawn subprocess with Claude
            cmd = [
                self.claude_command,
                '--prompt-file', prompt_file,
                '--model', self.default_model
            ]

            logger.info(f"Spawning implementer for bead {bead.get('id')}")
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            logger.info(f"Implementer spawned with PID {proc.pid}")
            return proc

        except Exception as e:
            logger.error(f"Failed to spawn implementer: {e}")
            raise

    def spawn_reviewer(
        self,
        bead: Dict[str, Any],
        commit_info: Dict[str, Any]
    ) -> subprocess.Popen:
        """
        Spawn a reviewer agent subprocess for code review.

        Loads reviewer prompt, spawns reviewer subprocess with commit context.

        Args:
            bead: Dictionary containing bead information:
                - id: Bead identifier
                - title: Bead title
                - description: Bead description
            commit_info: Dictionary containing commit information:
                - hash: Git commit hash
                - message: Commit message
                - author: Commit author
                - files_changed: List of modified files

        Returns:
            subprocess.Popen: The spawned process object

        Raises:
            subprocess.SubprocessError: If spawning fails
            IOError: If temp file creation fails
        """
        try:
            # Generate reviewer prompt from commit context
            prompt = self._generate_reviewer_prompt(bead, commit_info)

            # Write prompt to temp file
            with tempfile.NamedTemporaryFile(
                mode='w',
                suffix='.txt',
                prefix='claude_reviewer_',
                delete=False
            ) as f:
                f.write(prompt)
                prompt_file = f.name

            # Spawn subprocess with Claude
            cmd = [
                self.claude_command,
                '--prompt-file', prompt_file,
                '--model', self.default_model
            ]

            logger.info(f"Spawning reviewer for bead {bead.get('id')}")
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            logger.info(f"Reviewer spawned with PID {proc.pid}")
            return proc

        except Exception as e:
            logger.error(f"Failed to spawn reviewer: {e}")
            raise

    def kill_agent(self, proc: subprocess.Popen) -> bool:
        """
        Kill an agent subprocess and wait for cleanup.

        Terminates the process if running and waits for cleanup completion.

        Args:
            proc: The subprocess.Popen object to kill

        Returns:
            bool: True if agent was killed or already terminated, False on error

        Note:
            Handles exceptions gracefully - returns True even if process
            is already terminated or has unexpected errors.
        """
        try:
            # Check if process is still running
            if proc.poll() is None:
                # Process is still running, kill it
                logger.info(f"Killing agent process {proc.pid}")
                proc.kill()
                proc.wait(timeout=5)
                logger.info(f"Agent process {proc.pid} terminated")
            else:
                # Process already terminated
                logger.info(f"Agent process {proc.pid} already terminated")

            return True

        except ProcessLookupError:
            # Process already gone
            logger.debug(f"Process {proc.pid} already terminated")
            return True

        except Exception as e:
            logger.warning(f"Error killing agent process: {e}")
            return True  # Return True for graceful degradation

    def _read_template(self, path: Path) -> str:
        """
        Read a template file and return its content.

        Args:
            path: Path to the template file

        Returns:
            str: Template file content, or empty string if file not found
        """
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return f.read()
        except (FileNotFoundError, IOError) as e:
            logger.warning(f"Failed to read template file {path}: {e}")
            return ""

    def _load_implementer_prompt(
        self,
        bead: Dict[str, Any],
        escalation_context: Dict[str, Any],
        preflight_result: Dict[str, Any]
    ) -> str:
        """
        Load implementer prompt from template and replace template variables.

        Args:
            bead: Dictionary containing bead information including:
                - id: Bead identifier
                - title: Bead title
                - description: Bead description
                - (optional) labels: Bead labels
            escalation_context: Dictionary containing escalation info for retries:
                - last_result: Previous attempt result
                - last_attempted_at: When last attempt was made
                - attempts: Number of attempts made
            preflight_result: Dictionary containing preflight validation results:
                - status: 'passed' or 'failed'
                - checks: List of preflight check results

        Returns:
            str: Formatted prompt string with template variables replaced

        Raises:
            IOError: If template file cannot be read
        """
        # Get the path to the implementer template (prompts is sibling to lib directory)
        template_path = Path(__file__).parent.parent / "prompts" / "implementer.md"
        template_content = self._read_template(template_path)

        if not template_content:
            raise IOError(f"Failed to read implementer template from {template_path}")

        # Format escalation context for display
        escalation_text = ""
        if escalation_context:
            parts = []
            if 'last_result' in escalation_context:
                parts.append(f"- Previous result: {escalation_context['last_result']}")
            if 'attempts' in escalation_context:
                parts.append(f"- Attempts: {escalation_context['attempts']}")
            if 'last_attempted_at' in escalation_context:
                parts.append(f"- Last attempted: {escalation_context['last_attempted_at']}")
            escalation_text = "\n".join(parts) if parts else "No escalation context"
        else:
            escalation_text = "No escalation context"

        # Format preflight status for display
        preflight_text = f"Status: {preflight_result.get('status', 'unknown')}"
        if 'checks' in preflight_result and preflight_result['checks']:
            checks_text = "\n".join([
                f"- {check.get('name', 'unknown')}: {check.get('status', 'unknown')}"
                for check in preflight_result['checks']
            ])
            preflight_text += f"\n\nChecks:\n{checks_text}"

        # Replace template variables
        prompt = template_content.replace("{{bead_id}}", str(bead.get('id', '')))
        prompt = prompt.replace("{{bead_title}}", str(bead.get('title', '')))
        prompt = prompt.replace("{{bead_description}}", str(bead.get('description', '')))
        prompt = prompt.replace("{{bead_labels}}", str(bead.get('labels', '')))
        prompt = prompt.replace("{{escalation_context}}", escalation_text)
        prompt = prompt.replace("{{preflight_status}}", preflight_text)

        return prompt

    def _load_reviewer_prompt(
        self,
        bead: Dict[str, Any],
        commit_info: Dict[str, Any]
    ) -> str:
        """
        Load reviewer prompt from template and replace template variables.

        Args:
            bead: Dictionary containing bead information:
                - id: Bead identifier
                - title: Bead title
                - description: Bead description
            commit_info: Dictionary containing commit information:
                - hash: Git commit hash
                - message: Commit message
                - author: Commit author
                - diff: Commit diff
                - files_changed: List of modified files

        Returns:
            str: Formatted prompt string with template variables replaced

        Raises:
            IOError: If template file cannot be read
        """
        # Get the path to the reviewer template (prompts is sibling to lib directory)
        template_path = Path(__file__).parent.parent / "prompts" / "reviewer.md"
        template_content = self._read_template(template_path)

        if not template_content:
            raise IOError(f"Failed to read reviewer template from {template_path}")

        # Format files changed for display
        files_text = ""
        if 'files_changed' in commit_info and commit_info['files_changed']:
            files_text = "\n".join([
                f"- {file_path}" for file_path in commit_info['files_changed']
            ])
        else:
            files_text = "No files changed"

        # Get commit diff (if available)
        commit_diff = commit_info.get('diff', 'No diff available')

        # Get implementer note (if available)
        implementer_note = commit_info.get('implementer_note', 'No implementer note provided')

        # Replace template variables
        prompt = template_content.replace("{{bead_id}}", str(bead.get('id', '')))
        prompt = prompt.replace("{{bead_title}}", str(bead.get('title', '')))
        prompt = prompt.replace("{{bead_description}}", str(bead.get('description', '')))
        prompt = prompt.replace("{{commit_hash}}", str(commit_info.get('hash', '')))
        prompt = prompt.replace("{{commit_diff}}", str(commit_diff))
        prompt = prompt.replace("{{files_changed}}", files_text)
        prompt = prompt.replace("{{implementer_note}}", implementer_note)

        return prompt

    def _generate_implementer_prompt(
        self,
        bead: Dict[str, Any],
        escalation_context: Dict[str, Any],
        preflight_result: Dict[str, Any]
    ) -> str:
        """
        Generate implementer prompt from bead context.

        Args:
            bead: Bead information
            escalation_context: Escalation context for retries
            preflight_result: Preflight validation results

        Returns:
            str: Formatted prompt string for implementer agent
        """
        prompt_parts = [
            f"# Implement Bead: {bead.get('id')}",
            f"",
            f"## Bead Details",
            f"Title: {bead.get('title')}",
            f"Description: {bead.get('description')}",
        ]

        # Add dependencies if present
        if 'dependencies' in bead and bead['dependencies']:
            prompt_parts.append(f"Dependencies: {', '.join(bead['dependencies'])}")

        # Add escalation context if present
        if escalation_context:
            prompt_parts.append(f"")
            prompt_parts.append(f"## Escalation Context")
            if 'last_result' in escalation_context:
                prompt_parts.append(f"Previous result: {escalation_context['last_result']}")
            if 'attempts' in escalation_context:
                prompt_parts.append(f"Attempt number: {escalation_context['attempts']}")

        # Add preflight result
        prompt_parts.append(f"")
        prompt_parts.append(f"## Preflight Validation")
        prompt_parts.append(f"Status: {preflight_result.get('status', 'unknown')}")

        # Add instructions
        prompt_parts.append(f"")
        prompt_parts.append(f"## Instructions")
        prompt_parts.append(f"Implement this bead following TDD workflow.")
        prompt_parts.append(f"Ensure all tests pass before completion.")

        return "\n".join(prompt_parts)

    def _generate_reviewer_prompt(
        self,
        bead: Dict[str, Any],
        commit_info: Dict[str, Any]
    ) -> str:
        """
        Generate reviewer prompt from commit context.

        Args:
            bead: Bead information
            commit_info: Commit information

        Returns:
            str: Formatted prompt string for reviewer agent
        """
        prompt_parts = [
            f"# Review Implementation for Bead: {bead.get('id')}",
            f"",
            f"## Bead Details",
            f"Title: {bead.get('title')}",
            f"Description: {bead.get('description')}",
            f"",
            f"## Commit Information",
            f"Hash: {commit_info.get('hash')}",
            f"Message: {commit_info.get('message')}",
        ]

        # Add author if present
        if 'author' in commit_info:
            prompt_parts.append(f"Author: {commit_info['author']}")

        # Add files changed if present
        if 'files_changed' in commit_info:
            prompt_parts.append(f"Files changed: {len(commit_info['files_changed'])}")
            for file_path in commit_info['files_changed']:
                prompt_parts.append(f"  - {file_path}")

        # Add instructions
        prompt_parts.append(f"")
        prompt_parts.append(f"## Instructions")
        prompt_parts.append(f"Review this implementation for:")
        prompt_parts.append(f"- Correctness and completeness")
        prompt_parts.append(f"- Code quality and style")
        prompt_parts.append(f"- Test coverage")
        prompt_parts.append(f"- Alignment with bead requirements")

        return "\n".join(prompt_parts)


def parse_implementer_result(stdout: str) -> Dict[str, Any]:
    """
    Extract and validate implementer result JSON from stdout.

    Extracts JSON from stdout (which may contain surrounding text),
    validates required fields, and returns the result dictionary.

    Args:
        stdout: String output from implementer agent subprocess

    Returns:
        Dict[str, Any]: Parsed result dictionary with required fields:
            - status: Implementation status
            - commit_hash: Git commit hash of changes
            - files_changed: List of modified file paths
            - tests_run: Number of tests run
            - tests_passed: Number of tests passed
            - self_review: Implementer's self-review notes

    Raises:
        ValueError: If no valid JSON found or required fields missing
    """
    # Extract JSON from stdout (handles surrounding text)
    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', stdout, re.DOTALL)
    if not json_match:
        raise ValueError("No valid JSON found in implementer output")

    try:
        result = json.loads(json_match.group(0))
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in implementer output: {e}")

    # Validate required fields
    required_fields = [
        'status',
        'commit_hash',
        'files_changed',
        'tests_run',
        'tests_passed',
        'self_review'
    ]

    for field in required_fields:
        if field not in result:
            raise ValueError(f"Missing required field '{field}' in implementer result")

    return result


def parse_reviewer_result(stdout: str) -> Dict[str, Any]:
    """
    Extract and validate reviewer result JSON from stdout.

    Extracts JSON from stdout (which may contain surrounding text),
    validates required fields, and returns the result dictionary.

    Args:
        stdout: String output from reviewer agent subprocess

    Returns:
        Dict[str, Any]: Parsed result dictionary with required fields:
            - status: Review status (approved, changes_requested, rejected)
            - stage1_spec_compliance: Boolean indicating spec compliance
            - stage1_notes: Notes on specification compliance
            - stage2_code_quality: Code quality rating (1-10)
            - stage2_notes: Notes on code quality
            - feedback: Overall feedback

    Raises:
        ValueError: If no valid JSON found or required fields missing
    """
    # Extract JSON from stdout (handles surrounding text)
    json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', stdout, re.DOTALL)
    if not json_match:
        raise ValueError("No valid JSON found in reviewer output")

    try:
        result = json.loads(json_match.group(0))
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in reviewer output: {e}")

    # Validate required fields
    required_fields = [
        'status',
        'stage1_spec_compliance',
        'stage1_notes',
        'stage2_code_quality',
        'stage2_notes',
        'feedback'
    ]

    for field in required_fields:
        if field not in result:
            raise ValueError(f"Missing required field '{field}' in reviewer result")

    return result
