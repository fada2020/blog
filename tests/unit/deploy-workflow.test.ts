import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const workflowPath = resolve(".github/workflows/deploy.yml");

type Workflow = {
  on: {
    push: {
      branches: string[];
    };
    workflow_dispatch: null;
  };
  permissions: Record<string, string>;
  concurrency: {
    group: string;
    "cancel-in-progress": boolean;
  };
  jobs: {
    build: {
      steps: Array<{
        uses?: string;
        with?: Record<string, string | number>;
      }>;
    };
    deploy: {
      needs: string;
      environment: {
        name: string;
        url: string;
      };
      steps: Array<{
        id?: string;
        uses?: string;
      }>;
    };
  };
};

function loadWorkflow(): Workflow {
  return parse(readFileSync(workflowPath, "utf8")) as Workflow;
}

describe("GitHub Pages 배포 워크플로", () => {
  it("main 푸시와 수동 실행으로만 시작한다", () => {
    const workflow = loadWorkflow();

    expect(workflow.on).toEqual({
      push: { branches: ["main"] },
      workflow_dispatch: null,
    });
  });

  it("Pages 배포에 필요한 최소 권한과 동시성 정책을 사용한다", () => {
    const workflow = loadWorkflow();

    expect(workflow.permissions).toEqual({
      contents: "read",
      pages: "write",
      "id-token": "write",
    });
    expect(workflow.concurrency).toEqual({
      group: "pages",
      "cancel-in-progress": false,
    });
  });

  it("공식 액션 버전과 Node 24를 사용한다", () => {
    const workflow = loadWorkflow();
    const buildSteps = workflow.jobs.build.steps;
    const deploySteps = workflow.jobs.deploy.steps;

    expect(buildSteps).toContainEqual(
      expect.objectContaining({ uses: "actions/checkout@v7" }),
    );
    expect(buildSteps).toContainEqual(
      expect.objectContaining({
        uses: "withastro/action@v6",
        with: { "node-version": 24 },
      }),
    );
    expect(deploySteps).toContainEqual(
      expect.objectContaining({
        id: "deployment",
        uses: "actions/deploy-pages@v5",
      }),
    );
  });

  it("빌드 성공 후 github-pages 환경에 배포한다", () => {
    const workflow = loadWorkflow();

    expect(workflow.jobs.deploy.needs).toBe("build");
    expect(workflow.jobs.deploy.environment).toEqual({
      name: "github-pages",
      url: "${{ steps.deployment.outputs.page_url }}",
    });
  });
});
