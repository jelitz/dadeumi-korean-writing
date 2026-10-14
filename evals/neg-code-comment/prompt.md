---
allowed_tools: [Read, Skill]
max_turns: 3
runs: 5
tags: [trigger]
---

이 함수에 docstring을 쓰고, 필요한 곳에 주석을 달아 줘.

```python
def parse_month(value):
    parts = value.split("-")
    if len(parts) != 2:
        raise ValueError(value)
    year, month = int(parts[0]), int(parts[1])
    if not 1 <= month <= 12:
        raise ValueError(value)
    return year, month
```
