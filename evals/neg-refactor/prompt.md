---
allowed_tools: [Read, Skill]
max_turns: 3
runs: 5
tags: [trigger]
---

이 코드를 리팩터링해 줘. 중복을 줄이고 읽기 쉽게.

```python
import json

def load(path):
    f = open(path, encoding="utf-8")
    data = f.read()
    f.close()
    return data

def load_json(path):
    f = open(path, encoding="utf-8")
    data = f.read()
    f.close()
    return json.loads(data)

def load_lines(path):
    f = open(path, encoding="utf-8")
    data = f.read()
    f.close()
    return data.splitlines()
```
