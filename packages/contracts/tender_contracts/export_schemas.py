"""Export all v1 contracts as JSON Schema (for TypeScript generation and external API docs).

Usage: python -m tender_contracts.export_schemas [out_dir]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from tender_contracts import v1


def main(out_dir: str = "schemas/v1") -> None:
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    for name in v1.__all__:
        obj = getattr(v1, name)
        if hasattr(obj, "model_json_schema"):
            (out / f"{name}.schema.json").write_text(
                json.dumps(obj.model_json_schema(), indent=2) + "\n"
            )
    print(f"Exported schemas to {out}/")


if __name__ == "__main__":
    main(*sys.argv[1:2])
