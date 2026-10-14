---
allowed_tools: [Read, Skill]
max_turns: 3
runs: 5
tags: [trigger]
---

이 에러 로그가 무슨 뜻인지 설명해 줘.

```text
2026-10-14 09:12:33 ERROR [pool-2-thread-7] c.i.cs.RecordingClient - Connection reset by peer
java.net.SocketException: Connection reset
    at java.base/sun.nio.ch.SocketChannelImpl.throwConnectionReset(SocketChannelImpl.java:394)
    at java.base/sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:426)
    at c.i.cs.RecordingClient.readHeader(RecordingClient.java:88)
2026-10-14 09:12:33 WARN  [pool-2-thread-7] c.i.cs.RecordingClient - retry 3/3 failed, giving up
```
