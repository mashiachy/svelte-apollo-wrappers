import { getClient } from "./client";
import { readable, get } from "svelte/store";
import isEqual from "lodash-es/isEqual";
import { getCombinedQuery, randId } from "./utils";
import { NetworkStatus } from "@apollo/client/core";
import type * as T from "./types";

export type QueryOptions<V = T.DefaultValiables> = Omit<
  T.WatchQueryOptions<V>,
  "query"
> & {
  operationName?: string;
};
export type ReadableQuery<
  D = T.DefaultData,
  V = T.DefaultValiables
> = T.ReadableQueryResult<D> & {
  query: T.ObservableQuery<D, V>;
};

export function query<
  Arg1 extends T.TypedDocument | T.TypedDocument[] | T.DefaultData,
  Arg2 extends T.DefaultValiables = T.DefaultValiables,
  DOC extends T.DocumentNode | T.DocumentNode[] = T.SelectTypedDocuemnt<Arg1>,
  D extends T.DefaultData = T.ResultOf<DOC>,
  V extends T.DefaultValiables = T.VariablesOf<DOC, Arg2>
>(document: DOC, options: QueryOptions<V> = {}): ReadableQuery<D, V> {
  let query: T.DocumentNode;
  if (Array.isArray(document)) {
    query = getCombinedQuery(
      document,
      options.operationName || `Query${randId()}`
    );
  } else {
    query = document;
  }
  const observableQuery = getClient().watchQuery({ query, ...options });

  const store = createReadableFromObservableQuery(observableQuery);

  return {
    subscribe: store.subscribe,
    query: observableQuery,
  };
}

const {
  prototype: { hasOwnProperty },
} = Object;

export function createReadableFromObservableQuery<D, V>(
  query: T.ObservableQuery<D, V>
): T.ReadableQueryResult<D> {
  const store = readable<T.ApolloQueryResult<D>>(
    query.getCurrentResult(),
    (set) => {
      // ** FROM useQuery react @apollo/client **

      // We use `getCurrentResult()` instead of the onNext argument because
      // the values differ slightly. Specifically, loading results will have
      // an empty object for data instead of `undefined` for some reason.
      const onNext = () => {
        const previousResult = get(store);

        const result = query.getCurrentResult();
        // Make sure we're not attempting to re-render similar results
        if (
          previousResult &&
          previousResult.loading === result.loading &&
          previousResult.networkStatus === result.networkStatus &&
          isEqual(previousResult.data, result.data)
        ) {
          return;
        }

        set(result);
      };

      const onError = (error: Error) => {
        const last = query["last"];
        subscription.unsubscribe();
        // Unfortunately, if `lastError` is set in the current
        // `observableQuery` when the subscription is re-created,
        // the subscription will immediately receive the error, which will
        // cause it to terminate again. To avoid this, we first clear
        // the last error/result from the `observableQuery` before re-starting
        // the subscription, and restore it afterwards (so the subscription
        // has a chance to stay open).
        try {
          query.resetLastResults();
          subscription = query.subscribe(onNext, onError);
        } finally {
          query["last"] = last;
        }

        if (!hasOwnProperty.call(error, "graphQLErrors")) {
          // The error is not a GraphQL error
          throw error;
        }

        const previousResult = get(store);
        if (
          !previousResult ||
          (previousResult && previousResult.loading) ||
          !isEqual(error, previousResult.error)
        ) {
          set({
            data: (previousResult && previousResult.data) as D,
            error: error as T.ApolloError,
            loading: false,
            networkStatus: NetworkStatus.error,
          });
        }
      };

      let subscription = query.subscribe(onNext, onError);
      return () => subscription.unsubscribe();
    }
  );
  return store;
}
