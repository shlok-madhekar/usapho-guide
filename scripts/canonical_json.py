"""
Write JSON exactly as the site's editor does, with JSON.stringify.

The editor at /edit and the merge scripts both write the content files. If
they format numbers or non-ASCII text differently, every change from the
editor rewrites hundreds of untouched lines (4.0 becomes 4, \\u00b0 becomes
the degree sign), and two open pull requests always conflict. Writing one
format from both sides keeps a pull request's diff to the lines it changed.

dumps(value)          matches JSON.stringify(value, null, 2) + "\\n"
dumps(value, None)    matches JSON.stringify(value)
"""

import decimal
import json
import math


def _number(x: float) -> str:
    """Format a float the way JavaScript's Number.prototype.toString does."""
    if math.isnan(x) or math.isinf(x):
        return "null"  # what JSON.stringify writes for them
    if x == 0:
        return "0"
    # repr gives the shortest digits that round-trip, which is also what
    # JavaScript picks; only the layout of those digits differs
    sign, digits, exp = decimal.Decimal(repr(x)).as_tuple()
    digits = list(digits)
    while len(digits) > 1 and digits[-1] == 0:
        digits.pop()
        exp += 1
    k = len(digits)
    n = exp + k  # position of the decimal point relative to the digits
    s = "".join(map(str, digits))
    if k <= n <= 21:
        out = s + "0" * (n - k)
    elif 0 < n <= 21:
        out = s[:n] + "." + s[n:]
    elif -6 < n <= 0:
        out = "0." + "0" * (-n) + s
    else:
        e = n - 1
        mantissa = s if k == 1 else s[0] + "." + s[1:]
        out = f"{mantissa}e{'+' if e >= 0 else '-'}{abs(e)}"
    return ("-" if sign else "") + out


def _encode(value, indent, level: int) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return _number(value)
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)

    if isinstance(value, dict):
        items = [
            json.dumps(str(k), ensure_ascii=False) + (": " if indent else ":")
            + _encode(v, indent, level + 1)
            for k, v in value.items()
        ]
        open_, close = "{", "}"
    elif isinstance(value, (list, tuple)):
        items = [_encode(v, indent, level + 1) for v in value]
        open_, close = "[", "]"
    else:
        raise TypeError(f"cannot encode {type(value).__name__}")

    if not items:
        return open_ + close
    if not indent:
        return open_ + ",".join(items) + close
    inner = "\n" + " " * (indent * (level + 1))
    outer = "\n" + " " * (indent * level)
    return open_ + inner + ("," + inner).join(items) + outer + close


def dumps(value, indent: int | None = 2) -> str:
    text = _encode(value, indent, 0)
    return text + "\n" if indent else text
