"""Publish only dist/ to the existing repository's bram-site branch."""
import shutil
import subprocess
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
branch = "bram-site"
remote = "https://github.com/kallurayaankit/research-agent.git"


def run(*args, cwd=None, capture=False):
    return subprocess.run(args, cwd=cwd, check=True, text=True, capture_output=capture)


if not (dist / "index.html").is_file():
    raise SystemExit("Run npm ci and npm run build first.")
with tempfile.TemporaryDirectory(prefix="bram-publish-") as tmp:
    target = Path(tmp)
    run("git", "init", "--initial-branch", branch, cwd=target)
    run("git", "remote", "add", "origin", remote, cwd=target)
    existing = run("git", "ls-remote", "origin", f"refs/heads/{branch}", cwd=target, capture=True).stdout.strip()
    if existing:
        run("git", "fetch", "--depth=1", "origin", branch, cwd=target)
        run("git", "reset", "--hard", "FETCH_HEAD", cwd=target)
        # This is an isolated temporary deployment checkout, never the user's tree.
        for entry in target.iterdir():
            if entry.name == ".git":
                continue
            if entry.is_dir() and not entry.is_symlink():
                shutil.rmtree(entry)
            else:
                entry.unlink()
    for entry in dist.iterdir():
        if entry.is_dir():
            shutil.copytree(entry, target / entry.name)
        else:
            shutil.copy2(entry, target / entry.name)
    run("git", "config", "user.name", "B-Ram deployment", cwd=target)
    run("git", "config", "user.email", "bram-deploy@users.noreply.github.com", cwd=target)
    run("git", "add", "--all", cwd=target)
    changed = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=target).returncode
    if changed:
        run("git", "commit", "-m", "Deploy B-Ram private browser edition", cwd=target)
        run("git", "push", "origin", f"HEAD:refs/heads/{branch}", cwd=target)
    print("Site branch is uploaded. GitHub Pages must use bram-site / (root).")
