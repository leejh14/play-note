const DEFAULT_MESSAGE = "문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

const GRAPHQL_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "접근 권한이 없습니다. 공유 링크로 다시 입장해주세요.",
  INVALID_TOKEN: "접근 권한이 없습니다. 공유 링크를 다시 확인해주세요.",
  SESSION_NOT_FOUND: "존재하지 않는 세션입니다.",
  FORBIDDEN: "관리자 권한이 필요합니다.",
  NOT_FOUND: "요청한 데이터를 찾을 수 없습니다.",
  VALIDATION_ERROR: "입력값을 다시 확인해주세요.",
};

export function getGraphqlErrorMessage(code?: string | null): string {
  if (!code) return DEFAULT_MESSAGE;
  return GRAPHQL_ERROR_MESSAGES[code] ?? DEFAULT_MESSAGE;
}
