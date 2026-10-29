import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AVATAR_PRESETS, cleanAvatar, defaultPreset, googlePhoto, MAX_AVATAR_LENGTH, resolveAvatar } from "@/lib/avatar";

const tinyWebp = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";

describe("cleanAvatar", () => {
  it("keeps the allowed shapes", () => {
    expect(cleanAvatar("google")).toBe("google");
    expect(cleanAvatar("preset:sushi")).toBe("preset:sushi");
    expect(cleanAvatar(tinyWebp)).toBe(tinyWebp);
  });

  it("drops anything else", () => {
    expect(cleanAvatar("preset:not-a-food")).toBeUndefined();
    expect(cleanAvatar("https://evil.example/x.png")).toBeUndefined();
    expect(cleanAvatar("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBeUndefined();
    expect(cleanAvatar("data:image/webp;base64,<script>")).toBeUndefined();
    expect(cleanAvatar(`data:image/webp;base64,${"A".repeat(MAX_AVATAR_LENGTH)}`)).toBeUndefined();
    expect(cleanAvatar(42)).toBeUndefined();
  });
});

describe("resolveAvatar", () => {
  const photo = "https://lh3.googleusercontent.com/a/abc=s96-c";

  it("shows the Google photo by default for Google accounts, sharpened", () => {
    expect(resolveAvatar({ uid: "u1", photoURL: photo })).toEqual({ kind: "google", src: "https://lh3.googleusercontent.com/a/abc=s256-c" });
  });

  it("gives everyone else a stable food avatar", () => {
    const a = resolveAvatar({ uid: "u1" });
    expect(a.kind).toBe("preset");
    expect(a.preset).toBe(defaultPreset("u1"));
    expect(resolveAvatar({ uid: "u1" })).toEqual(a);
  });

  it("prefers the chosen picture", () => {
    expect(resolveAvatar({ uid: "u1", photoURL: photo, avatar: "preset:taco" }).preset).toBe("taco");
    expect(resolveAvatar({ uid: "u1", photoURL: photo, avatar: tinyWebp }).kind).toBe("custom");
    expect(resolveAvatar({ uid: "u1", avatar: "google" }).kind).toBe("preset"); // no Google photo to show
  });

  it("only trusts Google's own photo servers", () => {
    expect(googlePhoto("https://evil.example/me.png")).toBeNull();
  });
});

describe("rules and presets agree", () => {
  it("firestore.rules allows exactly the preset avatars", () => {
    const rules = readFileSync(join(__dirname, "..", "..", "firestore.rules"), "utf8");
    const list = rules.match(/preset:\(([a-z|]+)\)/)?.[1].split("|") ?? [];
    expect(list.sort()).toEqual(AVATAR_PRESETS.map((p) => p.id).sort());
  });
});
