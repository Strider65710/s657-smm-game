"""Milkshake Mania Launcher"""

import json
import os
from pathlib import Path

import webview  # type: ignore

from rich.traceback import install  # type: ignore
from rich.console import Console  # type: ignore

cs: Console = Console()
install(show_locals=True)

# === Config ===

PACKAGE_JSON: Path = Path(__file__).resolve().parent / "package.json"

IS_ALPHA: bool = True
IS_BETA: bool = False


def get_app_version() -> str:
    try:
        with PACKAGE_JSON.open("r", encoding="utf-8") as package_file:
            data = json.load(package_file)
            version = data.get("version")
            return str(version) if version is not None else "0.0.0"
    except Exception:
        return "0.0.0"


APP_VERSION: str = get_app_version()
APP_NAME: str = (
    f"Strider657's Milkshake Mania (SMM) - {APP_VERSION}{'-alpha' if IS_ALPHA else ''}{'-beta' if IS_BETA else ''}"
)

WIDTH: int = 1280
HEIGHT: int = 720

SCRIPT_DIR: Path = Path(__file__).resolve().parent
DIST_INDEX: Path = SCRIPT_DIR / "dist" / "index.html"
ICON_PATH: Path = SCRIPT_DIR / "assets" / "favicon.ico"

# === Main + Initialization ===


def main() -> None:
    icon_path: str = str(ICON_PATH)

    local_app_data = os.environ.get("LOCALAPPDATA") or os.environ.get("APPDATA")
    user_data_folder: str | None = None
    if local_app_data:
        user_data_folder = str(
            Path(local_app_data) / "MilkshakeMania" / "webview-profile"
        )

    try:
        cs.log(f"Using user data folder: {user_data_folder}")

        window: webview.Window = webview.create_window(
            title=APP_NAME,
            url=DIST_INDEX.resolve().as_uri(),
            width=WIDTH,
            height=HEIGHT,
            min_size=(WIDTH, HEIGHT),
            background_color="#000000",
        )  # type: ignore

        cs.log("Webview window created successfully.")

        webview.start(None, window, icon=icon_path, private_mode=False)  # type: ignore

    except Exception:
        cs.log("Webview window failed.")
        raise


if __name__ == "__main__":
    main()
