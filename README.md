# 기술 블로그

업무 기록과 학습 내용을 정제해 발행하는 Astro 기반 기술 블로그입니다.

- 공개 주소: [https://fada2020.github.io/blog/](https://fada2020.github.io/blog/)
- 화면 설계: [AI 기술 블로그 Phase 1](https://www.figma.com/design/SBgEQNBzPV2PtfBAo4sLxD)
- 제품 및 발행 정책: [PLAN.md](PLAN.md)

## 로컬 실행

Node.js 24와 npm을 사용합니다.

```bash
npm ci
npm run dev
```

개발 서버가 안내하는 주소에서 `/blog/` 경로로 접속합니다.

## 검증

```bash
npm test
npm run build
npm run test:e2e
```

- `npm test`: 콘텐츠 공개 규칙과 배포 워크플로를 포함한 단위 테스트
- `npm run build`: Astro 진단, 정적 빌드, 비공개 콘텐츠 누출 검사
- `npm run test:e2e`: 반응형 화면과 접근성, 검색, 메타데이터 통합 검사

## 글 작성과 초안

글은 `src/content/blog/`에 Markdown 또는 MDX 파일로 작성합니다.

```yaml
---
title: "글 제목"
description: "글 설명"
publishedAt: 2026-07-31
category: "Tooling"
tags:
  - Astro
kind: "learning"
heroImage: "../../assets/blog/example/cover.webp"
heroImageAlt: "기술 블로그 글의 내용을 설명하는 대표 이미지"
draft: true
---
```

작성 중인 글은 반드시 `draft: true`로 유지합니다. 초안과 미래 발행 글은
목록, 검색, RSS, Sitemap, 정적 HTML에서 제외됩니다. 검토와 승인까지 끝난
글만 `draft: false`로 변경합니다.

## 배포

`main` 브랜치에 반영되면 GitHub Actions가 정적 사이트를 빌드해 GitHub
Pages에 배포합니다. 필요하면 `GitHub Pages 배포` 워크플로를 수동으로
실행할 수 있습니다. 진행 중인 배포는 새 실행이 시작되어도 취소하지
않습니다.
