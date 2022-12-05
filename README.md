# svelte-apollo-wrappers

Documentation based on <a href="https://github.com/timhall/svelte-apollo">svelte-apollo</a> library.
Svelte integration for Apollo GraphQL without Svelte context usage. Support multiple GraphQL docuemnts as arguments.

## Example

The following simple example shows how to run a simple query with svelte-apollo.

```typescript
/* main.ts */
import { ApolloClient } from "@apollo/client/core";
import { setClient } from "svelte-apollo-wrappers";

// 1. Create an Apollo client and pass it to all child components
//    (uses svelte's built-in context)
const client = new ApolloClient({
  /* ... */
});
setClient(client);
```

```svelte
<!-- Books.svelte -->
<script>
  import { query } from "svelte-apollo-wrappers";
  import GET_BOOKS from "./GET_BOOKS.graphql";

  // 2. Execute the GET_BOOKS GraphQL query using the Apollo client
  //    -> Returns a svelte store of promises that resolve as values come in
  const books = query(GET_BOOKS);
  
  // 3. Refetch query each 15 seconds
  //    books.query is original result from apolloClient.watchQuery call
  setInterval(() => books.query.refetch(), 15000);
</script>

<!-- 3. Use $books (note the "$"), to subscribe to query values -->
{#if $books.loading}
  Loading...
{:else if $books.error}
  Error: {$books.error.message}
{:else}
  {#each $books.data.books as book}
    {book.title} by {book.author.name}
  {/each}
{/if}
```

## API

<a href="#query" name="query">#</a> <b>query</b>(<i>document</i>[, <i>options</i>])

Query an Apollo client, returning a readable store of result values.
Uses Apollo's [`watchQuery`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.watchQuery),
for fetching from the network and watching the local cache for changes.

```svelte
<script>
  import { query } from "svelte-apollo-wrappers";
  import GET_BOOKS from "./GET_BOOKS.graphql";

  const books = query(GET_BOOKS, {
    // variables, fetchPolicy, errorPolicy, and others
  });

  function reload() {
    books.query.refetch();
  }
</script>

<ul>
  {#if $books.loading}
    <li>Loading...</li>
  {:else if $books.error}
    <li>ERROR: {$books.error.message}</li>
  {:else}
    {#each $books.data.books as book (book.id)}
      <li>{book.title} by {book.author.name}</li>
    {/each}
  {/if}
</ul>

<button on:click="{reload}">Reload</button>
```

Reactive variables are supported with `refetch`:

```svelte
<script>
  import { query } from "svelte-apollo-wrappers";
  import { SEARCH_BY_AUTHOR } from "./queries";

  export let author;
  let search = "";

  const books = query(SEARCH_BY_AUTHOR, {
    variables: { author, search },
  });

  // `books` is refetched when author or search change
  $: books.query.refetch({ author, search });
</script>

Author: {author}
<label>Search <input type="text" bind:value="{search}" /></label>

<ul>
  {#if $books.loading}
    <li>Loading...</li>
  {:else if $books.error}
    <li>ERROR: {$books.error.message}</li>
  {:else if $books.data}
    {#each $books.data.books as book (book.id)}
      <li>{book.title}</li>
    {/each}
  {:else}
    <li>No books found</li>
  {/if}
</ul>
```

<a href="#mutation" name="mutation">#</a> <b>mutation</b>(<i>document</i>[, <i>options</i>])

Prepare a GraphQL mutation with the Apollo client, using Apollo's [`mutate`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.mutate).
`mutation()` call returns async function to execute mutation; Returned function has subscribe method, so you can use it as svelte store ({ data, loading, error }).
You can set mutation options as second argument of `mutation()` call, them will use as default in all executions of resulted mutation function. You can specify them for every call as first argument.


```svelte
<script>
  import { mutation } from "svelte-apollo-wrappers";
  import ADD_BOOK from "./ADD_BOOK.graphql";

  const addBook = mutation(ADD_BOOK);
  let title = "";
  let author = "";

  $: ({ data, error, loading } = $addBook);

  async function handleSubmit() {
    try {
      await addBook({ variables: { title, author } });
    } catch (error) {
      // TODO
    }
  }
</script>

<form on:submit|preventDefault="{handleSubmit}">
  <label for="book-author">Author</label>
  <input type="text" id="book-author" bind:value="{author}" />

  <label for="book-title">Title</label>
  <input type="text" id="book-title" bind:value="{title}" />

  <button type="submit" loading="{loading}">Add Book</button>
</form>
{#if data}
Done!
{:else if error}
Error!
{/if}
```

<a href="#lazyQuery" name="lazyQuery">#</a> <b>lazyQuery</b>(<i>document</i>[, <i>options</i>])

Prepare a GraphQL lazyQuery with the Apollo client, using Apollo's [`query`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.query).
`lazyQuery()` call returns async function to execute query; Returned function has subscribe method, so you can use it as svelte store ({ data, loading, error }).
You can set query options as second argument of `lazyQuery()` call, them will use as default in all executions of resulted query function. You can specify them for every call as first argument.


```svelte
<script>
  import { lazyQuery } from "svelte-apollo-wrappers";
  import GET_BOOK from "./GET_BOOK.graphql";

  const getBook = lazyQuery(GET_BOOK);
  let title = "";
  let author = "";

  $: ({ data, error, loading } = $getBook);
</script>

<button on:click="{getBook}">Fetch book</button>
{#if data}
  Fetched: {data}
{:else if error}
  Error: {error}
{:else if loading}
  Loading
{/if}
```

<a href="#subscribe" name="subscribe">#</a> <b>subscribe</b>(<i>document</i>[, <i>options</i>])

Subscribe using an Apollo client, returning a store that is compatible with `{#await $...}`. Uses Apollo's [`subscribe`](https://www.apollographql.com/docs/react/api/apollo-client#ApolloClient.subscribe).

```svelte
<script>
  import { subscribe } from "svelte-apollo-wrappers";
  import NEW_BOOKS from "./NEW_BOOKS.graphql";

  const newBooks = subscribe(NEW_BOOKS);
</script>

{#if $newBooks.loading}
  Waiting for new books...
{:else if $newBooks.data}
  New Book: {$newBooks.data.book}
{/if}
```

<a href="#setClient" name="setClient">#</a> <b>setClient</b>(<i>client</i>)

Set an Apollo client for all wrappers.

```svelte
<!-- Parent.svelte -->
<script>
  import { setClient } from "svelte-apollo-wrappers";
  import client from "./client";

  setClient(client);
</script>
```

<a href="#getClient" name="getClient">#</a> <b>getClient</b>()

Get an Apollo client.

```svelte
<!-- Child.svelte -->
<script>
  import { getClient } from "svelte-apollo-wrappers";

  const client = getClient();
</script>
```

## FEATURES

<a href="#arrayedDocuments" name="arrayedDocuments">#</a> <b>arrayed documents</b>

You can use array of graphql documents as document argument for every wrappers. List of docuemnts will be merged in one document. Make sure that you dont have operations with the same name in different docuemnts. All wrappers options includes possible option `operationName` which will be usaed as a name for resulted document.

```typescript
import QUERY_ONE from "./QUERY_ONE.graphql";
import QUERY_TWO from "./QUERY_TWO.graphql";
import { query } from "svelte-apollo-wrappers";

const queryStore = query([QUERY_ONE, QUERY_TWO]);
```

<a href="#typescript" name="typescript">#</a> <b>Typescript</b>

All wrappers are "typescripted". Usage the same as in `ApolloClient.["watchQuery" / "query" / ...]`.
Supporting of TypedDocuemnts. If you are using graphql-codegen for generate types for GraphQL files the library will use this types.
