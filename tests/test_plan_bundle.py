import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / "scripts" / "plan-bundle"


class PlanBundleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.repo = self.root / "repo"
        self.repo.mkdir()
        subprocess.run(["git", "init", "-q", "-b", "main", self.repo], check=True)
        subprocess.run(["git", "-C", self.repo, "config", "user.email", "test@example.com"], check=True)
        subprocess.run(["git", "-C", self.repo, "config", "user.name", "Test"], check=True)
        (self.repo / "README.md").write_text("test\n")
        subprocess.run(["git", "-C", self.repo, "add", "."], check=True)
        subprocess.run(["git", "-C", self.repo, "commit", "-qm", "initial"], check=True)
        self.inputs = self.root / "inputs"
        self.inputs.mkdir()
        self.dag = self.inputs / "dag.json"
        self.dag.write_text(json.dumps({"meta": {"repo": str(self.repo), "branch": "main"}, "nodes": [{"id": "one", "intent": "Outcome", "change_spec": "Change", "acceptance_criteria": ["Proof"], "depends_on": []}]}))
        self.plan = self.inputs / "plan.md"
        self.plan.write_text("# Plan\n")
        self.review = self.inputs / "review.json"
        self.review.write_text(json.dumps({"provenance": ["spec.md"], "creation_revision": "abc", "attacks": [], "warnings": [{"attack": "foundation-delay", "detail": "Needs review"}]}))
        self.env = {**os.environ, "PIES_ARTIFACT_ROOT": str(self.root / "artifacts")}

    def tearDown(self):
        self.temp.cleanup()

    def command(self, *args, **kwargs):
        return subprocess.run([str(BUNDLE), *args], text=True, capture_output=True, env=self.env, **kwargs)

    def test_creates_canonical_immutable_bundle_and_preserves_warnings(self):
        result = self.command("create", "--repo", str(self.repo), "--plan-id", "release-1", "--dag", str(self.dag), "--plan", str(self.plan), "--review", str(self.review), check=True)
        bundle = Path(result.stdout.strip())
        self.assertEqual(bundle, (self.root / "artifacts" / "runs" / "repo" / "plans" / "release-1").resolve())
        self.assertEqual(json.loads((bundle / "plan-review.json").read_text())["warnings"][0]["attack"], "foundation-delay")
        again = self.command("create", "--repo", str(self.repo), "--plan-id", "release-1", "--dag", str(self.dag), "--plan", str(self.plan), "--review", str(self.review))
        self.assertNotEqual(again.returncode, 0)
        self.assertIn("immutable", again.stderr)

    def test_rejects_traversal_and_incomplete_bundle(self):
        traversal = self.command("resolve", "--repo", str(self.repo), "../escape")
        self.assertNotEqual(traversal.returncode, 0)
        bundle = self.root / "artifacts" / "runs" / "repo" / "plans" / "partial"
        bundle.mkdir(parents=True)
        incomplete = self.command("resolve", "--repo", str(self.repo), "partial")
        self.assertNotEqual(incomplete.returncode, 0)
        self.assertIn("incomplete", incomplete.stderr)

    def test_strict_dag_compatibility(self):
        created = self.command("create", "--repo", str(self.repo), "--plan-id", "strict", "--dag", str(self.dag), "--plan", str(self.plan), "--review", str(self.review), check=True)
        bundle = Path(created.stdout.strip())
        status = subprocess.run([str(ROOT / "scripts" / "dag-next"), "--dag", str(bundle / "dag.json"), "--json"], text=True, capture_output=True, check=True)
        self.assertEqual(json.loads(status.stdout), {"done": [], "ready": ["one"]})


if __name__ == "__main__":
    unittest.main()
