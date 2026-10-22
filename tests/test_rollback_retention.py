import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("retention", Path(__file__).parents[1] / "scripts/retain-frontend-rollbacks.py")
retention = importlib.util.module_from_spec(spec)
spec.loader.exec_module(retention)


def container(day, **overrides):
    row = {"Name": f"/treba-frontend-previous-{'a' * 12}-202610{day:02}120000",
           "State": {"Status": "exited"}, "Config": {"Image": retention.REGISTRY + "b" * 40}, "Mounts": []}
    return row | overrides


class RetentionTests(unittest.TestCase):
    def test_keeps_two_newest_even_when_running_or_mounted(self):
        rows = [container(22), container(21), container(20), container(19)]
        self.assertEqual([container(20), container(19)], retention.candidates(rows[::-1]))

    def test_never_selects_active_mounted_unrelated_or_mutable_images(self):
        rows = [container(22), container(21), container(20, State={"Status": "running"}),
                container(19, Mounts=[{"Type": "volume"}]), container(18, Name="/treba-backend-previous-x"),
                container(17, Config={"Image": retention.REGISTRY + "latest"}),
                container(16, Config={"Image": "unrelated/image:" + "b" * 40}),
                container(15, Name="/treba-frontend"), container(14, Name="/my-important-container")]
        self.assertEqual([], retention.candidates(rows))

    def test_only_empty_or_disposable_writable_layers_are_allowed(self):
        self.assertTrue(retention.disposable_changes(""))
        self.assertTrue(retention.disposable_changes("C /app\nC /app/.next\nA /app/.next/cache/images/a.webp\nC /root\nA /tmp/temp"))
        self.assertTrue(retention.disposable_changes("A /root/.npm\nA /root/.npm/_logs\nA /root/.npm/_logs/startup.log\nA /root/.npm/_update-notifier-last-checked"))
        for changes in ("A /app/uploads/photo.jpg", "C /app/data.db", "A /root/.npmrc", "D /app/server.js", "A /tmp-backup/file", "unexpected"):
            self.assertFalse(retention.disposable_changes(changes), changes)


if __name__ == "__main__":
    unittest.main()
