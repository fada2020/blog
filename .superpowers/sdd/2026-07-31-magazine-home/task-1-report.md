# Task 1 보고서: 홈 데이터 모델

## 상태

DONE_WITH_CONCERNS

## 변경 파일

- `src/lib/home.ts`
  - 첫 공개 글을 대표 글로 분리하는 `splitHomePosts` 추가
  - 실제 카테고리에만 링크 정보를 설정하는 `resolveTopicLinks` 추가
- `tests/unit/home.test.ts`
  - 대표 글 및 최신 글 분기 테스트
  - 빈 글 목록 테스트
  - 카테고리 링크 판정 테스트

다른 Task 파일은 수정하지 않았습니다.

## 커밋

- 구현 커밋: `5b81dc4bc2b6dfa8fd8b0085d33a208cf4b65b0a` (`홈 매거진 데이터 분기 추가`)

## 테스트

- TDD 실패 확인: `npm test -- tests/unit/home.test.ts`
  - `src/lib/home` 모듈 부재로 실패 확인
- 집중 테스트: `npm test -- tests/unit/home.test.ts`
  - 1개 파일, 3개 테스트 통과
- 전체 단위 테스트: `npm test`
  - 7개 파일, 24개 테스트 통과
- 빌드: `npm run build`
  - Astro 진단 0 errors, 0 warnings, 0 hints
  - 정적 빌드 성공
  - 공개 산출물 검증 성공
- 형식 검사: `git diff --check`
  - 통과

## 우려사항

- 빌드에서 기존 Mermaid 번들 청크 크기 경고가 발생하지만, 이번 Task의 변경과 무관하며 빌드 실패나 기능 오류는 아닙니다.

## 수정 라운드 1

리뷰의 Important 및 Minor 지적을 모두 반영했습니다.

- `splitHomePosts`가 `isPublishedPost`와 `sortPostsNewestFirst`를 재사용하도록 수정했습니다.
- 초안 및 미래 게시 글 fixture를 추가해 대표 글과 최신 글에서 제외되는지 검증했습니다.
- `resolveTopicLinks`의 topics/categories 타입을 기존 `Category` 유니온으로 제한했습니다.
- 수정 커밋: `d1d6ea1718220f7f2a38bdd5d4656bc2199df487` (`홈 데이터 모델 공개 글 계약 보강`)

### 수정 라운드 1 테스트

- TDD 실패 확인: 공개 글 필터링 및 정렬 테스트가 기존 구현에서 실패
- 집중 테스트: `npm test -- tests/unit/home.test.ts` - 3개 통과
- 전체 단위 테스트: `npm test` - 7개 파일, 24개 테스트 통과
- 빌드: `npm run build` - Astro 진단 0 errors, 0 warnings, 0 hints; 정적 빌드 및 공개 산출물 검증 통과
- 형식 검사: `git diff --check` - 통과
