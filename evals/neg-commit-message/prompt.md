---
allowed_tools: [Read, Skill]
max_turns: 3
runs: 5
tags: [trigger]
---

아래 diff의 커밋 메시지를 써 줘.

```diff
diff --git a/src/auth.py b/src/auth.py
--- a/src/auth.py
+++ b/src/auth.py
@@ -12,7 +12,7 @@ def get_token(user_id):
     token = issue_token(user_id)
-    cache[user_id] = token
+    cache.set(user_id, token, ttl=3600)
     return token
```
