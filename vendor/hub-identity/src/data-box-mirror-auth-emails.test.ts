import { describe, expect, it } from "vitest";
import { resolveDataBoxMirrorAuthEmails } from "./data-box-mirror-auth-emails";

describe("resolveDataBoxMirrorAuthEmails", () => {
  it("prefers username@infix1 before opaque Hub auth email", () => {
    expect(
      resolveDataBoxMirrorAuthEmails({
        loginInput: "duyceo01",
        mirrorEmail: "u_12770af0-93b5-429e-85f1-9ecb4f66e9b5@auth.infi.internal",
      }),
    ).toEqual([
      "duyceo01@infix1.io.vn",
      "duyceo01@id.hub.x1z10.local",
      "u_12770af0-93b5-429e-85f1-9ecb4f66e9b5@auth.infi.internal",
    ]);
  });

  it("keeps real contact/auth email first when Hub mirror is not opaque", () => {
    expect(
      resolveDataBoxMirrorAuthEmails({
        loginInput: "duyceo01",
        mirrorEmail: "kinhdoanh@enzyvina.com",
      }),
    ).toEqual([
      "kinhdoanh@enzyvina.com",
      "duyceo01@infix1.io.vn",
      "duyceo01@id.hub.x1z10.local",
    ]);
  });

  it("dedupes and ignores blank mirror", () => {
    expect(
      resolveDataBoxMirrorAuthEmails({
        loginInput: "alice",
        mirrorEmail: "  ",
      }),
    ).toEqual(["alice@infix1.io.vn", "alice@id.hub.x1z10.local"]);
  });
});
