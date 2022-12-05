import type {
  ObservableQuery,
  ApolloQueryResult,
  QueryOptions,
  WatchQueryOptions,
  MutationOptions,
  FetchResult,
  ApolloError,
  SubscriptionOptions,
  ApolloCache,
} from "@apollo/client";
import type { DocumentNode } from "graphql";
import type { Observable } from "zen-observable-ts";
import type { Readable } from "svelte/store";

export type DefaultData = unknown;
export type DefaultValiables = Record<string, unknown>;

export type ReadableQueryResult<D extends DefaultData> = Readable<
  ApolloQueryResult<D>
>;

export type MutationResult<D extends DefaultData> = FetchResult<D> & {
  data?: D;
  loading: boolean;
  error?: Error | ApolloError;
};
export type ReadableMutationResult<D extends DefaultData> = Readable<
  MutationResult<D>
>;

// Copy-paste from https://github.com/dotansimha/graphql-typed-document-node
export interface TypedDocument<
  Result = DefaultData,
  Variables = DefaultValiables
> extends DocumentNode {
  __apiType?: (variables: Variables) => Result;
}

type UnionToIntersectionHelper<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;
type UnionToIntersection<U> = boolean extends U
  ? UnionToIntersectionHelper<Exclude<U, boolean>> & boolean
  : UnionToIntersectionHelper<U>;

export type VariablesOfDocuemntList<T extends unknown[]> =
  T extends TypedDocument<infer _, infer U>[]
    ? [U] extends [{ [key: string]: never }]
      ? { [key: string]: never }
      : UnionToIntersection<Exclude<U, { [key: string]: never }>>
    : never;
export type ResultOfDocuemntList<T extends unknown[]> = T extends TypedDocument<
  infer U,
  infer _
>[]
  ? UnionToIntersection<U>
  : never;
export type ResultOfDocuemnt<T> = T extends TypedDocument<
  infer ResultType,
  infer _
>
  ? ResultType
  : never;
export type VariablesOfDocuemnt<T> = T extends TypedDocument<
  infer _,
  infer VariablesType
>
  ? VariablesType
  : never;
export type ResultOf<D extends TypedDocument | TypedDocument[] | DefaultData> =
  D extends TypedDocument[]
    ? ResultOfDocuemntList<D>
    : D extends TypedDocument
    ? ResultOfDocuemnt<D>
    : D;
export type VariablesOf<
  D extends TypedDocument | TypedDocument[] | DefaultData,
  V extends DefaultValiables = DefaultValiables
> = D extends TypedDocument[]
  ? VariablesOfDocuemntList<D>
  : D extends TypedDocument
  ? VariablesOfDocuemnt<D>
  : V;
export type SelectTypedDocuemnt<
  D extends TypedDocument | TypedDocument[] | DefaultData
> = D extends TypedDocument[]
  ? D
  : D extends TypedDocument
  ? D
  : TypedDocument[] | TypedDocument;

export {
  ApolloQueryResult,
  ObservableQuery,
  Readable,
  QueryOptions as ApolloQueryOptions,
  WatchQueryOptions,
  MutationOptions as ApolloMutationOptions,
  FetchResult,
  ApolloError,
  Observable,
  SubscriptionOptions as ApolloSubscriptionOptions,
  DocumentNode,
  ApolloCache,
};
