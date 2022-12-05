import { getClient } from "./client";
import { get, writable } from "svelte/store";
import { getCombinedQuery, randId } from "./utils";
import { NetworkStatus } from "@apollo/client/core";
import isEqual from "lodash-es/isEqual";
import type * as T from "./types";

export type LazyQueryOptions<V = T.DefaultValiables> = Omit<
  T.ApolloQueryOptions<V>,
  "query"
> & {
  operationName?: string;
};
export type ReadableLazyQuery<
  D = T.DefaultData,
  V = T.DefaultValiables
> = T.ReadableQueryResult<D | undefined> & {
  (options?: Partial<LazyQueryOptions<V>>): Promise<T.ApolloQueryResult<D>>;
  clearError: () => Promise<void>;
  clearResult: () => Promise<void>;
  clear: () => Promise<void>;
};

const DefaultResult = {
  data: undefined,
  loading: false,
  networkStatus: 0,
};

const LoadingResult = {
  data: undefined,
  loading: true,
  networkStatus: NetworkStatus.loading,
};

export function lazyQuery<
  Arg1 extends T.TypedDocument | T.TypedDocument[] | T.DefaultData,
  Arg2 extends T.DefaultValiables = T.DefaultValiables,
  DOC extends T.DocumentNode | T.DocumentNode[] = T.SelectTypedDocuemnt<Arg1>,
  D extends T.DefaultData = T.ResultOf<DOC>,
  V extends T.DefaultValiables = T.VariablesOf<DOC, Arg2>
>(
  document: DOC,
  initialOptions: LazyQueryOptions<V> = {}
): ReadableLazyQuery<D, V> {
  let query: T.DocumentNode;
  if (Array.isArray(document)) {
    query = getCombinedQuery(
      document,
      initialOptions.operationName || `Query${randId()}`
    );
  } else {
    query = document;
  }

  const store = writable<T.ApolloQueryResult<D | undefined>>(DefaultResult);
  let queryPromise: Promise<T.ApolloQueryResult<D>>;
  function callQuery(options: Partial<LazyQueryOptions<V>> = {}) {
    if (get(store).loading) return Promise.reject();
    store.set(LoadingResult);
    queryPromise = getClient().query({
      query,
      ...initialOptions,
      ...options,
    });
    queryPromise
      .then((result) => {
        store.set(result);
      })
      .catch((error) => {
        store.set({
          data: undefined,
          loading: false,
          error,
          networkStatus: NetworkStatus.error,
        });
      });
    return queryPromise;
  }
  callQuery.subscribe = store.subscribe;
  callQuery.clearError = async () => {
    await queryPromise;
    const storeState = get(store);
    if (!storeState.error && !storeState.errors) return;
    store.update((value) => ({
      ...value,
      error: undefined,
      errors: undefined,
    }));
  };
  callQuery.clearResult = async () => {
    await queryPromise;
    const storeState = get(store);
    if (!storeState.data && !storeState.loading && !storeState.networkStatus)
      return;
    store.update((value) => ({
      ...value,
      data: undefined,
      loading: false,
    }));
  };
  callQuery.clear = async () => {
    await queryPromise;
    const storeState = get(store);
    if (isEqual(storeState, DefaultResult)) {
      return;
    }
    store.set(DefaultResult);
  };
  return callQuery;
}
