import { getClient } from "./client";
import { writable, get } from "svelte/store";
import { ApolloError } from "@apollo/client/errors";
import { getCombinedQuery, randId } from "./utils";
import isEqual from "lodash-es/isEqual";
import type * as T from "./types";

export type MutationOptions<D = T.DefaultData, V = T.DefaultValiables> = Omit<
  T.ApolloMutationOptions<D, V>,
  "mutation"
> & {
  operationName?: string;
  allowExecuteDuringLoading?: boolean;
};
export type ReadableMutation<
  D = T.DefaultData,
  V = T.DefaultValiables
> = T.ReadableMutationResult<D> & {
  (options?: Partial<MutationOptions<D, V>>): Promise<T.FetchResult<D>>;
  clearError: () => void;
};

const DefaultResult = {
  data: undefined,
  loading: false,
  error: undefined,
};

const LoadingResult = {
  data: undefined,
  loading: true,
  error: undefined,
};

export function mutation<
  Arg1 extends T.TypedDocument | T.TypedDocument[] | T.DefaultData,
  Arg2 extends T.DefaultValiables = T.DefaultValiables,
  DOC extends T.DocumentNode | T.DocumentNode[] = T.SelectTypedDocuemnt<Arg1>,
  D extends T.DefaultData = T.ResultOf<DOC>,
  V extends T.DefaultValiables = T.VariablesOf<DOC, Arg2>
>(
  document: DOC,
  initialOptions: MutationOptions<D, V> = {}
): ReadableMutation<D, V> {
  let mutation: T.DocumentNode;
  if (Array.isArray(document)) {
    mutation = getCombinedQuery(
      document,
      initialOptions.operationName || `Query${randId()}`
    );
  } else {
    mutation = document;
  }

  const store = writable<T.MutationResult<D>>(DefaultResult);
  let mutationPromise: Promise<T.FetchResult<D>>;
  let lastActionId: string;
  function callMutation(options: Partial<MutationOptions<D, V>> = {}) {
    const allowExecuteDuringLoading =
      initialOptions?.allowExecuteDuringLoading ??
      options?.allowExecuteDuringLoading ??
      false;
    if (!allowExecuteDuringLoading && get(store).loading) {
      return Promise.reject();
    }
    store.set(LoadingResult);

    mutationPromise = getClient().mutate<D, V>({
      mutation,
      ...initialOptions,
      ...options,
    });

    const actionId = randId();
    lastActionId = actionId;

    mutationPromise
      .then((response) => {
        if (lastActionId !== actionId) {
          return;
        }

        let { data, errors } = response;
        const error =
          errors && errors.length > 0
            ? new ApolloError({ graphQLErrors: errors })
            : undefined;

        if (data === null) {
          data = undefined;
        }

        const result = {
          data,
          error,
          loading: false,
        };

        const previousResult = get(store);

        if (isEqual(previousResult, result)) {
          return;
        }

        store.set(result);
      })
      .catch((error) => {
        if (lastActionId !== actionId) {
          return;
        }

        const result = {
          data: undefined,
          error,
          loading: false,
        };

        const previousResult = get(store);

        if (isEqual(previousResult, result)) {
          return;
        }

        store.set(result);
      });

    return mutationPromise;
  }

  callMutation.subscribe = store.subscribe;

  callMutation.clearError = () => {
    const storeState = get(store);
    if (!storeState.error && !storeState.errors) return;
    store.update((value) => ({
      ...value,
      error: undefined,
      errors: undefined,
    }));
  };
  return callMutation;
}
