import { getClient } from "./client";
import { readable, get } from "svelte/store";
import isEqual from "lodash-es/isEqual";
import { getCombinedQuery, randId } from "./utils";
import type * as T from "./types";

export type ObservableSubscription<D = T.DefaultData> = T.Observable<
  T.FetchResult<D>
>;
export type ReadableSubscriptionResult<D = T.DefaultData> = T.Readable<
  T.FetchResult<D>
>;
export type SubscriptionOptions<V = T.DefaultValiables> = Omit<
  T.ApolloSubscriptionOptions<V>,
  "query"
> & {
  operationName?: string;
};

export type ReadableSubscription<D = T.DefaultData> =
  ReadableSubscriptionResult<D> & {
    subscription: ObservableSubscription<D>;
  };

export function subscribe<
  Arg1 extends T.TypedDocument | T.TypedDocument[] | T.DefaultData,
  Arg2 extends T.DefaultValiables = T.DefaultValiables,
  DOC extends T.DocumentNode | T.DocumentNode[] = T.SelectTypedDocuemnt<Arg1>,
  D extends T.DefaultData = T.ResultOf<DOC>,
  V extends T.DefaultValiables = T.VariablesOf<DOC, Arg2>
>(
  document: DOC,
  options: SubscriptionOptions<V> = {}
): ReadableSubscription<D> {
  let query: T.DocumentNode;
  if (Array.isArray(document)) {
    query = getCombinedQuery(
      document,
      options.operationName || `Query${randId()}`
    );
  } else {
    query = document;
  }

  const observableSubscription = getClient().subscribe({
    query,
    ...options,
  });

  const store = createReadableFromObservableSubscription(
    observableSubscription
  );

  return {
    ...store,
    subscription: observableSubscription,
  };
}

function createReadableFromObservableSubscription<D>(
  query: ObservableSubscription<D>
): ReadableSubscriptionResult<D> {
  const store = readable<T.FetchResult<D>>({}, (set) => {
    const subscribtion = query.subscribe((result) => {
      if (!isEqual(get(store), result)) {
        set(result);
      }
    });
    return () => subscribtion.unsubscribe();
  });
  return store;
}
