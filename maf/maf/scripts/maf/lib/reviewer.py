#!/usr/bin/env python3
"""
Two-Stage Review Module

Stage 1: Spec Compliance - Did we build EXACTLY what was requested?
Stage 2: Code Quality - Is the implementation well-built?

Each stage must pass before proceeding to next.
Rejections include specific feedback for fixes.
"""

import subprocess
import json
import re
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TwoStageReviewer:
    """Performs two-stage review of bead implementations."""

    def __init__(self, project_root: str):
        """
        Initialize reviewer.

        Args:
            project_root: Path to project root directory
        """
        self.project_root = Path(project_root).resolve()

    def review_stage1_spec_compliance(
        self, 
        bead_id: str, 
        bead_spec: Dict, 
        commit_info: Dict
    ) -> Tuple[bool, str, List[str]]:
        """
        Stage 1: Verify implementation matches bead specification.

        Checks:
        - All requirements from spec implemented
        - No extra features (YAGNI)
        - Edge cases covered
        - Dependencies handled
        - Receipt generated

        Args:
            bead_id: Bead identifier
            bead_spec: Bead specification dictionary
            commit_info: Commit information with 'hash' and optionally 'files'

        Returns:
            (passed, summary, issues)
        """
        issues = []

        logger.info(f"Starting Stage 1 review for bead {bead_id}")

        # Get commit diff
        diff = self._get_commit_diff(commit_info.get('hash', 'HEAD'))
        
        if not diff:
            issues.append("Could not retrieve commit diff")
            return False, "❌ Spec compliance: Cannot review", issues

        # Check 1: All requirements implemented
        requirements = self._extract_requirements(bead_spec)
        if requirements:
            missing_reqs = []
            for req in requirements:
                if not self._is_requirement_met(req, diff):
                    missing_reqs.append(req)
            
            if missing_reqs:
                issues.extend([f"Missing requirement: {req}" for req in missing_reqs])

        # Check 2: No extra features (YAGNI)
        extra = self._detect_extra_features(bead_spec, diff)
        if extra:
            issues.append(f"Extra features found (YAGNI): {', '.join(extra)}")

        # Check 3: Edge cases covered
        if not self._edge_cases_covered(bead_id, diff):
            issues.append("Edge cases not covered in tests")

        # Check 4: Dependencies handled
        if requirements and self._has_dependency_keyword(requirements):
            if not self._dependencies_resolved(requirements, diff):
                issues.append("Dependencies not properly handled")

        # Check 5: Receipt generated
        if not self._receipt_exists(bead_id):
            issues.append("No receipt file generated")

        passed = len(issues) == 0
        summary = "✅ Spec compliance: All requirements met" if passed else f"❌ Spec compliance: {len(issues)} issue(s)"

        logger.info(f"Stage 1 review complete: {passed}")
        return passed, summary, issues

    def review_stage2_code_quality(
        self, 
        bead_id: str, 
        commit_info: Dict
    ) -> Tuple[bool, str, List[str]]:
        """
        Stage 2: Verify implementation is well-built.

        Checks:
        - Tests exist and pass
        - Code follows patterns
        - No security issues
        - Error handling
        - No hardcoded values
        - Performance OK
        - Clean code

        Args:
            bead_id: Bead identifier
            commit_info: Commit information with 'hash' and optionally 'files'

        Returns:
            (passed, summary, issues)
        """
        issues = []

        logger.info(f"Starting Stage 2 review for bead {bead_id}")

        # Get commit diff and files
        diff = self._get_commit_diff(commit_info.get('hash', 'HEAD'))
        files_changed = commit_info.get('files', [])
        
        # Try to get files from git if not provided
        if not files_changed:
            files_changed = self._get_changed_files(commit_info.get('hash', 'HEAD'))

        # Check 1: Tests exist and pass
        if not self._tests_exist(files_changed):
            issues.append("No tests written")
        elif not self._tests_pass():
            issues.append("Tests are failing")

        # Check 2: Code follows project patterns
        if not self._follows_patterns(diff):
            issues.append("Code doesn't follow project patterns")

        # Check 3: No security issues
        security_issues = self._check_security(diff)
        issues.extend(security_issues)

        # Check 4: Error handling appropriate
        if not self._has_error_handling(diff):
            issues.append("Missing error handling")

        # Check 5: No hardcoded values
        hardcoded = self._find_hardcoded_values(diff)
        if hardcoded:
            issues.append(f"Hardcoded values found: {', '.join(hardcoded)}")

        # Check 6: Performance considerations
        if not self._performance_ok(diff):
            issues.append("Potential performance issue")

        # Check 7: Clean code (no duplication, good names)
        if self._has_duplication(diff):
            issues.append("Code has duplication that should be extracted")
        if self._has_poor_names(diff):
            issues.append("Poor variable/function names")

        passed = len(issues) == 0
        summary = "✅ Code quality: Well-built" if passed else f"❌ Code quality: {len(issues)} issue(s)"

        logger.info(f"Stage 2 review complete: {passed}")
        return passed, summary, issues

    def _get_commit_diff(self, commit_hash: str) -> str:
        """
        Get commit diff.

        Args:
            commit_hash: Git commit hash

        Returns:
            Diff output as string
        """
        try:
            result = subprocess.run(
                ["git", "show", commit_hash],
                capture_output=True,
                text=True,
                cwd=self.project_root,
                timeout=30
            )
            return result.stdout
        except subprocess.TimeoutExpired:
            logger.error(f"Git show timed out for commit {commit_hash}")
            return ""
        except subprocess.CalledProcessError as e:
            logger.error(f"Git show failed for commit {commit_hash}: {e}")
            return ""

    def _get_changed_files(self, commit_hash: str) -> List[str]:
        """
        Get list of files changed in commit.

        Args:
            commit_hash: Git commit hash

        Returns:
            List of file paths
        """
        try:
            result = subprocess.run(
                ["git", "diff-tree", "--no-commit-id", "--name-only", "-r", commit_hash],
                capture_output=True,
                text=True,
                cwd=self.project_root,
                timeout=30
            )
            return result.stdout.strip().split('\n') if result.stdout.strip() else []
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
            logger.error(f"Failed to get changed files: {e}")
            return []

    def _extract_requirements(self, bead_spec: Dict) -> List[str]:
        """
        Extract requirements from bead specification.

        Args:
            bead_spec: Bead specification dictionary

        Returns:
            List of requirement strings
        """
        # Try different spec formats
        description = bead_spec.get('description', '')
        if description:
            return [line.strip() for line in description.split('\n') if line.strip()]
        
        # Try other common spec fields
        requirements = bead_spec.get('requirements', [])
        if requirements:
            return requirements if isinstance(requirements, list) else [requirements]
        
        return []

    def _is_requirement_met(self, requirement: str, diff: str) -> bool:
        """
        Check if requirement is met in diff.

        Args:
            requirement: Requirement description
            diff: Git diff output

        Returns:
            True if requirement appears to be met
        """
        # Extract meaningful keywords from requirement
        keywords = [word for word in requirement.split() if len(word) > 3]
        
        # Check if at least some keywords appear in diff
        matches = sum(1 for kw in keywords if kw.lower() in diff.lower())
        
        # Consider met if at least 30% of keywords match
        return len(keywords) > 0 and matches >= max(1, len(keywords) * 0.3)

    def _detect_extra_features(self, bead_spec: Dict, diff: str) -> List[str]:
        """
        Detect features not in spec (YAGNI violations).

        Args:
            bead_spec: Bead specification dictionary
            diff: Git diff output

        Returns:
            List of extra feature descriptions
        """
        # Build spec text to compare against
        spec_text = json.dumps(bead_spec).lower()
        extras = []

        # Find function/class definitions
        patterns = [
            (r'def\s+(\w+)', 'function'),
            (r'class\s+(\w+)', 'class'),
            (r'function\s+(\w+)', 'function'),
            (r'const\s+(\w+)\s*=\s*\(', 'arrow function'),
        ]

        for pattern, func_type in patterns:
            matches = re.findall(pattern, diff)
            for name in matches:
                # Check if this function/class is mentioned in spec
                if name.lower() not in spec_text and not name.startswith('_'):
                    extras.append(f"{func_type} {name}")

        return extras

    def _edge_cases_covered(self, bead_id: str, diff: str) -> bool:
        """
        Check if edge cases are covered in tests.

        Args:
            bead_id: Bead identifier
            diff: Git diff output

        Returns:
            True if edge cases appear to be covered
        """
        # Look for edge case patterns in tests
        edge_patterns = [
            'empty', 'null', 'none', 'zero', 'negative', 
            'error', 'invalid', 'boundary', 'edge', 'corner'
        ]
        
        diff_lower = diff.lower()
        return any(pattern in diff_lower for pattern in edge_patterns)

    def _has_dependency_keyword(self, requirements: List[str]) -> bool:
        """
        Check if requirements mention dependencies.

        Args:
            requirements: List of requirement strings

        Returns:
            True if dependencies are mentioned
        """
        req_text = ' '.join(requirements).lower()
        return 'depends on' in req_text or 'dependency' in req_text or 'requires' in req_text

    def _dependencies_resolved(self, requirements: List[str], diff: str) -> bool:
        """
        Check if dependencies are properly handled.

        Args:
            requirements: List of requirement strings
            diff: Git diff output

        Returns:
            True if dependencies appear resolved
        """
        diff_lower = diff.lower()
        return any(keyword in diff_lower for keyword in ['import ', 'require(', 'from ', 'use '])

    def _receipt_exists(self, bead_id: str) -> bool:
        """
        Check if receipt file exists.

        Args:
            bead_id: Bead identifier

        Returns:
            True if receipt file exists
        """
        # Try common receipt locations
        receipt_paths = [
            self.project_root / "receipts" / f"{bead_id}.md",
            self.project_root / ".maf" / "receipts" / f"{bead_id}.md",
            self.project_root / f"{bead_id}.md",
        ]
        
        return any(path.exists() for path in receipt_paths)

    def _tests_exist(self, files_changed: List[str]) -> bool:
        """
        Check if test files were added/modified.

        Args:
            files_changed: List of changed file paths

        Returns:
            True if test files exist
        """
        test_indicators = ['test', '.spec.', '.test.']
        
        return any(
            any(indicator in f.lower() for indicator in test_indicators)
            for f in files_changed
        )

    def _tests_pass(self) -> bool:
        """
        Check if tests pass.

        Returns:
            True if all tests pass
        """
        # Detect test framework
        test_commands = []
        
        if (self.project_root / "package.json").exists():
            test_commands = [["npm", "test"]]
        elif (self.project_root / "pom.xml").exists():
            test_commands = [["mvn", "test"]]
        elif (self.project_root / "requirements.txt").exists() or (self.project_root / "pyproject.toml").exists():
            test_commands = [["python", "-m", "pytest", "-v"]]
        else:
            # Try bd test as fallback
            test_commands = [["bd", "test"]]
        
        for cmd in test_commands:
            try:
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    cwd=self.project_root,
                    timeout=120
                )
                if result.returncode == 0:
                    return True
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                continue
        
        return False

    def _follows_patterns(self, diff: str) -> bool:
        """
        Check if code follows project patterns.

        Args:
            diff: Git diff output

        Returns:
            True if patterns are followed
        """
        # Simplified check - in real implementation would check against style guide
        # Look for basic code structure indicators
        return True

    def _check_security(self, diff: str) -> List[str]:
        """
        Check for security issues.

        Args:
            diff: Git diff output

        Returns:
            List of security issue descriptions
        """
        issues = []

        dangerous_patterns = [
            ('eval(', 'Use of eval() is dangerous'),
            ('innerHTML', 'innerHTML allows XSS'),
            ('dangerouslySetInnerHTML', 'React dangerouslySetInnerHTML allows XSS'),
            ('sql.execute', 'SQL injection risk - use parameterized queries'),
            ('execSQL', 'SQL injection risk - use parameterized queries'),
            ('subprocess.call', 'Command injection risk - sanitize input'),
            ('subprocess.run', 'Command injection risk - sanitize input'),
            ('os.system', 'Command injection risk - use subprocess'),
            ('shell=True', 'shell=True allows command injection'),
        ]

        for pattern, msg in dangerous_patterns:
            if pattern in diff:
                issues.append(f"Security: {msg}")

        return issues

    def _has_error_handling(self, diff: str) -> bool:
        """
        Check if error handling exists.

        Args:
            diff: Git diff output

        Returns:
            True if error handling is present
        """
        error_patterns = [
            'try ', 'catch', 'except', 'error', 'throw', 
            'raise ', 'finally', 'Promise.catch'
        ]
        
        diff_lower = diff.lower()
        return any(pattern in diff_lower for pattern in error_patterns)

    def _find_hardcoded_values(self, diff: str) -> List[str]:
        """
        Find hardcoded values that should be constants.

        Args:
            diff: Git diff output

        Returns:
            List of hardcoded value descriptions
        """
        hardcoded = []
        
        # Look for magic numbers (2+ digits not part of identifier)
        magic_numbers = re.findall(r'(?<![\w.])(\d{2,})(?![\w.])', diff)
        for num in set(magic_numbers):
            # Skip common non-magic numbers
            if num not in ['100', '200', '300', '400', '500', '1000']:
                hardcoded.append(f"Number {num}")
        
        # Look for hardcoded URLs/paths
        urls = re.findall(r'["\']https?://[^\s"\']+["\']', diff)
        hardcoded.extend([f"URL {url[:30]}..." for url in urls])

        return hardcoded[:5]  # Limit to 5 to avoid noise

    def _performance_ok(self, diff: str) -> bool:
        """
        Check for performance issues.

        Args:
            diff: Git diff output

        Returns:
            True if no obvious performance issues
        """
        # Look for nested loops
        nested_for = re.search(r'for\s*\([^}]*for\s*\(', diff, re.DOTALL)
        if nested_for:
            return False
        
        # Look for large object copies
        if 'Object.assign' in diff and '...' in diff:
            return False  # Spread + Object.assign might indicate inefficient copy
        
        return True

    def _has_duplication(self, diff: str) -> bool:
        """
        Check for code duplication.

        Args:
            diff: Git diff output

        Returns:
            True if significant duplication detected
        """
        lines = diff.split('\n')
        # Filter out empty lines and common patterns
        code_lines = [
            line for line in lines 
            if line.strip() and not line.strip().startswith(('#', '//', 'import', 'from'))
        ]
        
        if len(code_lines) < 10:
            return False
        
        unique_lines = set(code_lines)
        # Check if duplication exceeds 50%
        return len(code_lines) > len(unique_lines) * 1.5

    def _has_poor_names(self, diff: str) -> bool:
        """
        Check for poor variable/function names.

        Args:
            diff: Git diff output

        Returns:
            True if poor naming detected
        """
        # Look for single-letter variables (except common loop vars)
        poor_single_letter = re.findall(r'\b([a-z])\s*=', diff)
        bad_single = [v for v in poor_single_letter if v not in ['i', 'j', 'k', 'x', 'y', '_']]
        
        if bad_single:
            return True
        
        # Look for generic poor names
        poor_patterns = [
            r'\bdata1\b', r'\bdata2\b',
            r'\btemp1\b', r'\btemp2\b',
            r'\bvar1\b', r'\bvar2\b',
        ]
        
        return any(re.search(pattern, diff) for pattern in poor_patterns)


def main():
    """CLI for two-stage review."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Two-stage review of bead implementation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Review both stages
  %(prog)s BEAD-123 --commit abc123
  
  # Review only Stage 1
  %(prog)s BEAD-123 --stage 1
  
  # Review only Stage 2
  %(prog)s BEAD-123 --stage 2
        """
    )
    
    parser.add_argument("bead_id", help="Bead ID to review (e.g., BEAD-123)")
    parser.add_argument("--commit", help="Commit hash to review (default: HEAD)")
    parser.add_argument("--stage", choices=["1", "2", "both"], default="both",
                        help="Review stage 1, 2, or both (default: both)")
    parser.add_argument("--project-root", default=".",
                        help="Project root directory (default: .)")
    parser.add_argument("--spec", help="Path to bead spec JSON file")
    parser.add_argument("-v", "--verbose", action="store_true",
                        help="Enable verbose output")

    args = parser.parse_args()

    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Initialize reviewer
    reviewer = TwoStageReviewer(args.project_root)

    # Load bead spec
    if args.spec:
        try:
            with open(args.spec) as f:
                bead_spec = json.load(f)
        except FileNotFoundError:
            print(f"ERROR: Spec file not found: {args.spec}")
            exit(1)
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in spec file: {e}")
            exit(1)
    else:
        # Create minimal spec
        bead_spec = {"description": f"Bead {args.bead_id}"}

    # Prepare commit info
    commit_info = {
        "hash": args.commit or "HEAD",
        "files": []
    }

    # Track overall success
    all_passed = True

    # Stage 1 Review
    if args.stage in ["1", "both"]:
        print("\n" + "=" * 60)
        print("STAGE 1: Spec Compliance")
        print("=" * 60)
        
        passed, summary, issues = reviewer.review_stage1_spec_compliance(
            args.bead_id, bead_spec, commit_info
        )
        
        print(summary)
        for issue in issues:
            print(f"  - {issue}")

        if not passed:
            all_passed = False
            if args.stage == "1":
                print("\n❌ Stage 1 FAILED - Fix spec issues before Stage 2")
                exit(1)
            else:
                print("\n⚠️  Stage 1 issues detected, continuing to Stage 2")

    # Stage 2 Review
    if args.stage in ["2", "both"]:
        print("\n" + "=" * 60)
        print("STAGE 2: Code Quality")
        print("=" * 60)
        
        passed, summary, issues = reviewer.review_stage2_code_quality(
            args.bead_id, commit_info
        )
        
        print(summary)
        for issue in issues:
            print(f"  - {issue}")

        if not passed:
            all_passed = False
            print("\n❌ Stage 2 FAILED - Fix quality issues")
            exit(1)

    # Success
    if all_passed:
        print("\n" + "=" * 60)
        print("✅ Review complete - All stages passed")
        print("=" * 60)
        exit(0)
    else:
        exit(1)


if __name__ == "__main__":
    main()
