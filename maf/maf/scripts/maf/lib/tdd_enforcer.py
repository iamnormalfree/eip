#!/usr/bin/env python3
"""
TDD Enforcement Module

Verifies that Test-Driven Development workflow is followed:
1. Write test
2. Watch test fail correctly
3. Implement feature
4. Watch test pass
"""

import subprocess
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Optional


class TDDEnforcer:
    """Verifies TDD workflow compliance."""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)

    def check_test_exists(self, bead_id: str) -> Tuple[bool, str]:
        """
        Check if test file exists for bead.
        
        Returns:
            (exists, message)
        """
        # Look for test file patterns
        test_patterns = [
            f"test*{bead_id}*.py",
            f"test*{bead_id}*.ts",
            f"test*{bead_id}*.js",
            f"*{bead_id}*.test.ts",
            f"*{bead_id}*.test.js",
        ]
        
        found_tests = []
        for pattern in test_patterns:
            tests = list(self.project_root.rglob(pattern))
            found_tests.extend(tests)
        
        if found_tests:
            return True, f"✅ Found {len(found_tests)} test file(s) for {bead_id}"
        else:
            return False, f"❌ No test files found for {bead_id}. Write test first."

    def check_test_fails(self, bead_id: str) -> Tuple[bool, str]:
        """
        Verify that test fails correctly (not syntax error, not passing).
        
        Returns:
            (fails_correctly, message)
        """
        result = self._run_tests()
        
        if result.returncode == 0:
            return False, "❌ Tests are passing. They must FAIL first to verify they test the right thing."
        
        # Check if failure is expected (assertion) vs error (syntax/import)
        stderr = result.stderr.lower()
        stdout = result.stdout.lower()
        
        # Good failure patterns (assertions)
        good_patterns = ["assert", "expect", "should", "failed", "not equal"]
        
        # Bad failure patterns (errors)
        bad_patterns = ["syntaxerror", "importerror", "module not found", "indentationerror"]
        
        has_good = any(re.search(p, stdout + stderr) for p in good_patterns)
        has_bad = any(re.search(p, stdout + stderr) for p in bad_patterns)
        
        if has_bad:
            return False, f"❌ Test has syntax/import errors:\n{stderr[:200]}"
        
        if has_good:
            return True, f"✅ Test fails correctly with assertion:\n{stdout[:200]}"
        
        return False, f"❌ Test failed for unclear reason:\n{stdout[:200]}"

    def check_test_passes(self, bead_id: str) -> Tuple[bool, str]:
        """
        Verify that all tests pass after implementation.
        
        Returns:
            (all_pass, message)
        """
        result = self._run_tests()
        
        if result.returncode == 0:
            if "passed" in result.stdout.lower() or "✓" in result.stdout:
                return True, f"✅ All tests passing:\n{result.stdout[:200]}"
            else:
                return False, "⚠️  Tests passed but no test output detected."
        else:
            return False, f"❌ Tests failing:\n{result.stdout[:200]}\n{result.stderr[:200]}"

    def _run_tests(self) -> subprocess.CompletedProcess:
        """Run project tests and return result."""
        # Detect test framework and run appropriate command
        if (self.project_root / "package.json").exists():
            return subprocess.run(["npm", "test"], capture_output=True, text=True, cwd=self.project_root)
        elif (self.project_root / "pom.xml").exists():
            return subprocess.run(["mvn", "test"], capture_output=True, text=True, cwd=self.project_root)
        elif (self.project_root / "requirements.txt").exists() or (self.project_root / "pyproject.toml").exists():
            return subprocess.run(["python", "-m", "pytest", "-v"], capture_output=True, text=True, cwd=self.project_root)
        else:
            return subprocess.run(["bd", "test"], capture_output=True, text=True, cwd=self.project_root)

    def verify_tdd_workflow(self, bead_id: str) -> Tuple[bool, List[str]]:
        """
        Verify complete TDD workflow for bead.
        
        Returns:
            (compliant, messages)
        """
        messages = []
        
        # Stage 1: Test exists
        exists, msg = self.check_test_exists(bead_id)
        messages.append(msg)
        if not exists:
            return False, messages
        
        # Stage 2: Test fails correctly
        fails, msg = self.check_test_fails(bead_id)
        messages.append(msg)
        if not fails:
            return False, messages
        
        # Stage 3: Test passes after implementation
        passes, msg = self.check_test_passes(bead_id)
        messages.append(msg)
        if not passes:
            return False, messages
        
        return True, messages


def main():
    """CLI for TDD verification."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Verify TDD workflow compliance")
    parser.add_argument("bead_id", help="Bead ID to verify")
    parser.add_argument("--project-root", default=".", help="Project root directory")
    
    args = parser.parse_args()
    
    enforcer = TDDEnforcer(args.project_root)
    compliant, messages = enforcer.verify_tdd_workflow(args.bead_id)
    
    print(f"\nTDD Verification for {args.bead_id}:")
    print("=" * 60)
    for msg in messages:
        print(msg)
    
    if compliant:
        print("\n✅ TDD workflow followed correctly")
        exit(0)
    else:
        print("\n❌ TDD workflow violations detected")
        exit(1)


if __name__ == "__main__":
    main()
