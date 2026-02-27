export const SESSION_REPOSITORY = Symbol('ISessionRepository');
export const COMMENT_REPOSITORY = Symbol('ICommentRepository');
export const FRIEND_CONTEXT_ACL = Symbol('IFriendContextAcl');
export const ATTACHMENT_CONTEXT_ACL = Symbol('IAttachmentContextAcl');

export const SESSION_ERROR_CODES = {
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  SESSION_READONLY: 'SESSION_READONLY',
  SESSION_LOCKED: 'SESSION_LOCKED',
} as const;
