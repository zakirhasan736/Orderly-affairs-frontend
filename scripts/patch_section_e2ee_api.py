"""Patch frontend section*.ts helpers to use E2EE vault transport."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src" / "libs" / "api"
IMPORT = (
    "import { secureFetch } from '@/libs/secureFetch';\n"
    "import { getVaultSection, saveVaultSection } from '@/libs/e2ee/vaultApi';"
)


def patch(text: str) -> str:
    if "getVaultSection" in text:
        return text
    text = text.replace(
        "import { secureFetch } from '@/libs/secureFetch';",
        IMPORT,
    )
    text = re.sub(
        r"export async function (getSection\w+)\(\) \{\s*"
        r"const res = await secureFetch\('(/sections/[^']+)'\);\s*"
        r"if \(!res\.ok\) throw new Error\([^;]+;\s*"
        r"return res\.json\(\);\s*\}",
        r"export async function \1() {\n  return getVaultSection('\2');\n}",
        text,
        flags=re.S,
    )
    text = re.sub(
        r"export async function (saveSection\w+)\(payload: any\) \{\s*"
        r"const res = await secureFetch\('(/sections/[^']+)', \{\s*"
        r"method: 'POST',\s*"
        r"body: JSON\.stringify\(payload\),\s*"
        r"\}\);\s*"
        r"if \(!res\.ok\) throw new Error\([^;]+;\s*"
        r"return res\.json\(\);\s*\}",
        r"export async function \1(payload: any) {\n"
        r"  return saveVaultSection('\2', payload);\n}",
        text,
        flags=re.S,
    )
    return text


def main() -> None:
    for path in sorted(ROOT.glob("section*.ts")):
        original = path.read_text(encoding="utf-8")
        updated = patch(original)
        if updated == original:
            print("NOCHANGE", path.name)
        else:
            path.write_text(updated, encoding="utf-8")
            print("OK", path.name)


if __name__ == "__main__":
    main()
