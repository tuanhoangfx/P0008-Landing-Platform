import { describe, expect, it, vi } from "vitest";
import { fetchResolvedHubAuthEmails } from "./hub-resolve-login-client";

describe("fetchResolvedHubAuthEmails", () => {
  it("returns empty for email input", async () => {
    await expect(fetchResolvedHubAuthEmails("a@corp.com")).resolves.toEqual([]);
  });

  it("returns empty for invalid user id", async () => {
    await expect(fetchResolvedHubAuthEmails("ab")).resolves.toEqual([]);
  });

  it("maps loginId via resolve-login API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ ok: true, authEmails: ["czpgo@outlook.com"] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchResolvedHubAuthEmails("czpgo", { resolveLoginApiUrl: "/api/hub/auth/resolve-login" }),
    ).resolves.toEqual(["czpgo@outlook.com"]);

    expect(fetchMock).toHaveBeenCalledWith("/api/hub/auth/resolve-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loginId: "czpgo" }),
    });

    vi.unstubAllGlobals();
  });
});
