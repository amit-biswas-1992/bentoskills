import { describe, it, expect } from "vitest";
import { parseSkillYaml, ParsedSkillSchema } from "./parser";

const valid = `
slug: design-critique
name: Design Critique
tagline: Get structured design feedback on usability
version: 1.2.0
author: alice
category: critique
tags: [ui, feedback]
license: MIT
`;

describe("parseSkillYaml", () => {
  it("parses a valid skill.yaml", () => {
    const res = parseSkillYaml(valid);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.slug).toBe("design-critique");
      expect(res.data.tags).toEqual(["ui", "feedback"]);
    }
  });

  it("rejects missing required fields", () => {
    const res = parseSkillYaml("slug: foo");
    expect(res.ok).toBe(false);
  });

  it("rejects bad semver", () => {
    const res = parseSkillYaml(valid.replace("1.2.0", "not-semver"));
    expect(res.ok).toBe(false);
  });

  it("rejects tagline >140 chars", () => {
    const long = valid.replace("Get structured design feedback on usability", "x".repeat(141));
    const res = parseSkillYaml(long);
    expect(res.ok).toBe(false);
  });

  it("rejects bad category", () => {
    const res = parseSkillYaml(valid.replace("category: critique", "category: marketing"));
    expect(res.ok).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    const res = parseSkillYaml(valid.replace("design-critique", "Design-Critique"));
    expect(res.ok).toBe(false);
  });
});
