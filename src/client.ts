import type { ApolloClient, NormalizedCacheObject } from "@apollo/client/core"


let client: ApolloClient<NormalizedCacheObject>

export function setClient(newClient: ApolloClient<NormalizedCacheObject>) {
  client = newClient;
}

export function getClient() {
  if (!client) {
    throw new Error("Svelte apollo client has not been setted");
  }
  return client;
}