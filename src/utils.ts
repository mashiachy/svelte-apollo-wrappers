import combineQuery from "graphql-combine-query";
import * as T from "./types";

export function getCombinedQuery<L extends T.TypedDocument[]>(
  documents: L,
  operationName: string
): T.TypedDocument<T.ResultOfDocuemntList<L>, T.VariablesOfDocuemntList<L>> {
  const combinedQuery = combineQuery(operationName);
  let result: ReturnType<typeof combinedQuery.add>;
  documents.forEach((doc) => (result = (result || combinedQuery).add(doc)));
  // @ts-ignore: result is assigned in forEach loop in one line upper;
  return result.document;
}

export function randId() {
  return (new Date().getTime() + Math.trunc(Math.random() * 10000)).toString(
    16
  );
}
