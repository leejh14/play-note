import { DateTimeResolver } from 'graphql-scalars';
import { GraphQLScalarType } from 'graphql';

export const DateTimeScalar: GraphQLScalarType = DateTimeResolver;
