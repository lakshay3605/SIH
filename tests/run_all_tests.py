"""
Test runner for Aadivaani Phase 1 test suite.
Executes all unit tests for script validation, dataset pipeline, and neural pipeline.
"""

import sys
import os
import unittest

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure repository root is on Python path
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)


def run_test_suite():
    loader = unittest.TestLoader()
    suite = loader.discover(start_dir=os.path.join(repo_root, "tests"), pattern="test_*.py")

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "=" * 70)
    print("AADIVAANI TEST SUITE SUMMARY")
    print("=" * 70)
    print(f"Tests Run : {result.testsRun}")
    print(f"Failures  : {len(result.failures)}")
    print(f"Errors    : {len(result.errors)}")
    print(f"Skipped   : {len(result.skipped)}")
    print(f"Status    : {'ALL PASSED [OK]' if result.wasSuccessful() else 'FAILED [ERROR]'}")
    print("=" * 70)

    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(run_test_suite())
