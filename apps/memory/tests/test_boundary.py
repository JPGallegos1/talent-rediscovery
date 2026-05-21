import subprocess
import sys
from pathlib import Path


def test_no_supabase_import():
    app_dir = Path(__file__).resolve().parent.parent / "app"
    parent_path = str(app_dir.parent).replace("\\", "/")
    result = subprocess.run(
        [sys.executable, "-c", f"import sys; sys.path.insert(0, '{parent_path}'); from app.main import create_app; app = create_app()"],
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 0, f"Import failed: {result.stderr}"


def test_no_supabase_dependency():
    requirements = Path(__file__).resolve().parent.parent / "requirements.txt"
    text = requirements.read_text()
    assert "supabase" not in text.lower(), "supabase dependency found in requirements.txt"
