import argparse
import json
from typing import Any, List
import pandas as pd
import re
import numpy as np
import datetime


def _convert_value(v: Any) -> Any:
    """Convert pandas / numpy / datetime types to native Python types for JSON."""
    # pandas NA
    try:
        if pd.isna(v):
            return None
    except Exception:
        pass

    # numpy scalar types
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if isinstance(v, (np.ndarray,)):
        return v.tolist()

    # datetime -> ISO string
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.isoformat()

    # fallback -- if object has tolist (e.g., numpy types) try that
    if hasattr(v, 'tolist') and not isinstance(v, (str, bytes)):
        try:
            return v.tolist()
        except Exception:
            pass

    return v


def dataframe_to_serializable_records(df: pd.DataFrame) -> List[dict]:
    """Convert DataFrame to list-of-dict with JSON-serializable native values."""
    records = df.to_dict(orient='records')
    out: List[dict] = []
    for rec in records:
        new_rec = {}
        for k, v in rec.items():
            # Special-case a 'weight' field that may contain vector-like data
            if isinstance(k, str) and k.lower() == 'weight':
                # Accept numpy arrays, Python lists, or strings like "[0.5, 0.5]" or "0.5 0.5"
                if v is None:
                    new_rec[k] = None
                elif isinstance(v, (list, tuple, np.ndarray)):
                    try:
                        new_rec[k] = [float(x) for x in list(v)]
                    except Exception:
                        # Fallback to generic converter
                        new_rec[k] = _convert_value(v)
                elif isinstance(v, (str,)):
                    s = v.strip()
                    # remove surrounding brackets if present
                    if (s.startswith('[') and s.endswith(']')) or (s.startswith('(') and s.endswith(')')):
                        s = s[1:-1]
                    # find all numbers using regex to be robust to commas/spaces
                    nums = re.findall(r"[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?", s)
                    try:
                        new_rec[k] = [float(x) for x in nums]
                    except Exception:
                        new_rec[k] = _convert_value(v)
                else:
                    # scalar numeric -> single-element list
                    if isinstance(v, (int, float, np.integer, np.floating)):
                        new_rec[k] = [float(v)]
                    else:
                        new_rec[k] = _convert_value(v)
            else:
                new_rec[k] = _convert_value(v)
        out.append(new_rec)
    return out


def convert_xlsx_to_json(input_path: str, output_path: str, orient: str = 'records') -> None:
    df = pd.read_excel(input_path)
    # Use our converter to ensure types are JSON serializable
    records = dataframe_to_serializable_records(df)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=4)
    print(f"Wrote {len(records)} records to '{output_path}'")


def main() -> None:
    parser = argparse.ArgumentParser(description='Convert an Excel file to parsed JSON')
    parser.add_argument('input', nargs='?', default='./real_data_132_courses.xlsx', help='Input Excel file')
    parser.add_argument('output', nargs='?', default='./real_data_132_courses.json', help='Output JSON file')
    args = parser.parse_args()
    convert_xlsx_to_json(args.input, args.output)


if __name__ == '__main__':
    main()