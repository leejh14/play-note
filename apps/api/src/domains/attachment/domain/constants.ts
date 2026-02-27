export const ATTACHMENT_REPOSITORY = Symbol('IAttachmentRepository');
export const EXTRACTION_RESULT_REPOSITORY = Symbol('IExtractionResultRepository');
export const EXTRACTION_SERVICE = Symbol('IExtractionService');

export const ATTACHMENT_ERROR_CODES = {
  ATTACHMENT_NOT_FOUND: 'ATTACHMENT_NOT_FOUND',
  ATTACHMENT_LIMIT_EXCEEDED: 'ATTACHMENT_LIMIT_EXCEEDED',
} as const;
