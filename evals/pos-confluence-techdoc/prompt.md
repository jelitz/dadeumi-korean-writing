---
allowed_tools: [Read, Skill]
max_turns: 8
runs: 5
tags: [trigger]
---

신규 서비스 "알림 발송 API"의 배포 절차를 Confluence 기술문서로 작성해 줘. 내용: GitHub Actions에서 main 브랜치에 push하면 Docker 이미지를 빌드해 ECR에 올리고, CodeDeploy로 EC2 두 대에 순차 배포한다. 배포 전 체크리스트(환경변수 확인, DB 마이그레이션 여부)와 롤백 방법(이전 태그로 재배포)도 넣어야 해. 독자는 우리 팀에 새로 들어온 개발자야.
