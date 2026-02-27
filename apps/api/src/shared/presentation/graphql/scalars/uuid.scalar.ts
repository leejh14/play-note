import { UUIDResolver } from 'graphql-scalars';
import { GraphQLScalarType } from 'graphql';

export const UUIDScalar: GraphQLScalarType = UUIDResolver;
