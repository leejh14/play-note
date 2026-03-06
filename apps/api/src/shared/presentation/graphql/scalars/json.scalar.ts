import { CustomScalar, Scalar } from '@nestjs/graphql';
import { ValueNode } from 'graphql';
import { JSONResolver } from 'graphql-scalars';

@Scalar('JSON')
export class JSONScalar implements CustomScalar<unknown, unknown> {
  description = JSONResolver.description ?? 'JSON scalar';

  parseValue(value: unknown): unknown {
    return JSONResolver.parseValue(value);
  }

  serialize(value: unknown): unknown {
    return JSONResolver.serialize(value);
  }

  parseLiteral(
    ast: ValueNode,
    variables?: Record<string, unknown> | null,
  ): unknown {
    return JSONResolver.parseLiteral(ast, variables);
  }
}
