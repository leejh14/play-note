export function toGlobalId(typeName: string, localId: string): string {
  return Buffer.from(`${typeName}:${localId}`).toString('base64');
}

export function fromGlobalId(globalId: string): {
  typeName: string;
  localId: string;
} {
  const decoded = Buffer.from(globalId, 'base64').toString('utf-8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error(`Invalid global ID format: ${globalId}`);
  }
  return {
    typeName: decoded.substring(0, separatorIndex),
    localId: decoded.substring(separatorIndex + 1),
  };
}

export function assertGlobalIdType(
  globalId: string,
  expectedType: string,
): string {
  const { typeName, localId } = fromGlobalId(globalId);
  if (typeName !== expectedType) {
    throw new Error(
      `Expected global ID type "${expectedType}" but got "${typeName}"`,
    );
  }
  return localId;
}
