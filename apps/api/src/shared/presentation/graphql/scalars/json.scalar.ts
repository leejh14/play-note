import { JSONResolver } from 'graphql-scalars';
import { GraphQLScalarType } from 'graphql';

export const JSONScalar: GraphQLScalarType = JSONResolver;
