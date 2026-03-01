import { describe, expect, it } from "vitest";

import { getGraphqlErrorMessage } from "./error-messages";

describe("graphql error message mapper", () => {
  it("returns mapped message for known auth error codes", () => {
    expect(getGraphqlErrorMessage("UNAUTHORIZED")).toBe(
      "인증 정보가 없습니다. 공유 링크로 입장하거나 새 세션을 생성해주세요.",
    );
    expect(getGraphqlErrorMessage("INVALID_TOKEN")).toBe(
      "유효하지 않은 토큰입니다. 최신 공유 링크로 다시 입장해주세요.",
    );
    expect(getGraphqlErrorMessage("SESSION_NOT_FOUND")).toBe(
      "세션을 찾을 수 없습니다. 링크가 만료되었거나 삭제되었습니다.",
    );
    expect(getGraphqlErrorMessage("FORBIDDEN")).toBe(
      "이 기능은 관리자 토큰이 필요합니다.",
    );
  });

  it("returns default message for unknown or empty code", () => {
    const expected = "문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

    expect(getGraphqlErrorMessage(undefined)).toBe(expected);
    expect(getGraphqlErrorMessage(null)).toBe(expected);
    expect(getGraphqlErrorMessage("SOMETHING_ELSE")).toBe(expected);
  });
});
