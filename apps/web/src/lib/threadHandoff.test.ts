import { type ModelSelection, ThreadId } from "@t3tools/contracts";
import { describe, expect, it } from "vitest";
import {
  resolveAvailableHandoffTargetProviders,
  resolveHandoffProviderLabel,
  resolveThreadHandoffBadgeLabel,
  resolveThreadHandoffModelSelection,
} from "./threadHandoff";

describe("threadHandoff", () => {
  it("lists all supported handoff targets except the active provider", () => {
    expect(resolveAvailableHandoffTargetProviders("codex")).toEqual(["claudeAgent", "gemini"]);
    expect(resolveAvailableHandoffTargetProviders("claudeAgent")).toEqual(["codex", "gemini"]);
    expect(resolveAvailableHandoffTargetProviders("gemini")).toEqual(["codex", "claudeAgent"]);
  });

  it("uses shared provider labels in handoff labels", () => {
    expect(resolveHandoffProviderLabel("codex")).toBe("GPT");
    expect(resolveHandoffProviderLabel("claudeAgent")).toBe("Claude");
    expect(resolveHandoffProviderLabel("gemini")).toBe("Gemini");
  });

  it("uses shared provider wording in the handoff badge for codex threads", () => {
    expect(
      resolveThreadHandoffBadgeLabel({
        handoff: {
          sourceProvider: "codex",
          importedAt: "2026-04-18T00:00:00.000Z",
          sourceThreadId: ThreadId.makeUnsafe("thread-source"),
          bootstrapStatus: "completed",
        },
      }),
    ).toBe("Handoff from GPT");
  });

  it("prefers sticky model selection for the chosen handoff target", () => {
    const stickySelection = {
      provider: "gemini",
      model: "gemini-2.5-pro",
    } satisfies ModelSelection;

    expect(
      resolveThreadHandoffModelSelection({
        sourceThread: {
          modelSelection: {
            provider: "claudeAgent",
            model: "claude-sonnet-4-6",
          },
        },
        targetProvider: "gemini",
        projectDefaultModelSelection: {
          provider: "gemini",
          model: "gemini-3.1-pro-preview",
        },
        stickyModelSelectionByProvider: {
          gemini: stickySelection,
        },
      }),
    ).toEqual(stickySelection);
  });

  it("falls back to the resolved provider default model when no sticky or project default exists", () => {
    expect(
      resolveThreadHandoffModelSelection({
        sourceThread: {
          modelSelection: {
            provider: "gemini",
            model: "gemini-2.5-pro",
          },
        },
        targetProvider: "codex",
        projectDefaultModelSelection: null,
        stickyModelSelectionByProvider: {},
      }),
    ).toEqual({
      provider: "codex",
      model: "gpt-5.4",
    });
  });
});
