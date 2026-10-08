import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROFILES = ROOT / "skills" / "pies" / "assets" / "kind-profiles.json"
RUN_PLAN = ROOT / "skills" / "pies-run-plan" / "SKILL.md"


class KindProfilesTests(unittest.TestCase):
    def test_dag_rejects_report_kinds(self):
        profiles = json.loads(PROFILES.read_text())
        for kind in ("research", "codebase-analysis"):
            self.assertFalse(profiles["profiles"][kind]["implementation"])
            self.assertTrue(profiles["profiles"][kind]["standalone_only"])

        run_plan = RUN_PLAN.read_text()
        self.assertIn(
            "Report-only research/codebase-analysis never becomes a plan outcome; "
            "reject it and recommend standalone `/pies` discovery.",
            run_plan,
        )


if __name__ == "__main__":
    unittest.main()
