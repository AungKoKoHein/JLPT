# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetSentence*](#getsentence)
  - [*ListSentences*](#listsentences)
  - [*GetTranslation*](#gettranslation)
  - [*ListTranslations*](#listtranslations)
  - [*GetTag*](#gettag)
  - [*ListTags*](#listtags)
  - [*GetVote*](#getvote)
  - [*ListMyVotes*](#listmyvotes)
  - [*ListMyCollection*](#listmycollection)
- [**Mutations**](#mutations)
  - [*CreateSentence*](#createsentence)
  - [*DeleteSentence*](#deletesentence)
  - [*UpdateSentence*](#updatesentence)
  - [*CreateTranslation*](#createtranslation)
  - [*DeleteTranslation*](#deletetranslation)
  - [*UpdateTranslation*](#updatetranslation)
  - [*CreateTag*](#createtag)
  - [*DeleteTag*](#deletetag)
  - [*UpdateTag*](#updatetag)
  - [*CreateVote*](#createvote)
  - [*DeleteVote*](#deletevote)
  - [*UpdateVote*](#updatevote)
  - [*CreateUserCollection*](#createusercollection)
  - [*DeleteUserCollection*](#deleteusercollection)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetSentence
You can execute the `GetSentence` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getSentence(vars: GetSentenceVariables, options?: ExecuteQueryOptions): QueryPromise<GetSentenceData, GetSentenceVariables>;

interface GetSentenceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSentenceVariables): QueryRef<GetSentenceData, GetSentenceVariables>;
}
export const getSentenceRef: GetSentenceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getSentence(dc: DataConnect, vars: GetSentenceVariables, options?: ExecuteQueryOptions): QueryPromise<GetSentenceData, GetSentenceVariables>;

interface GetSentenceRef {
  ...
  (dc: DataConnect, vars: GetSentenceVariables): QueryRef<GetSentenceData, GetSentenceVariables>;
}
export const getSentenceRef: GetSentenceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSentenceRef:
```typescript
const name = getSentenceRef.operationName;
console.log(name);
```

### Variables
The `GetSentence` query requires an argument of type `GetSentenceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetSentenceVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetSentence` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSentenceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetSentenceData {
  sentence?: {
    englishText: string;
    createdAt: TimestampString;
    creator: {
      username: string;
    };
  };
}
```
### Using `GetSentence`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getSentence, GetSentenceVariables } from '@dataconnect/generated';

// The `GetSentence` query requires an argument of type `GetSentenceVariables`:
const getSentenceVars: GetSentenceVariables = {
  id: ..., 
};

// Call the `getSentence()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getSentence(getSentenceVars);
// Variables can be defined inline as well.
const { data } = await getSentence({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getSentence(dataConnect, getSentenceVars);

console.log(data.sentence);

// Or, you can use the `Promise` API.
getSentence(getSentenceVars).then((response) => {
  const data = response.data;
  console.log(data.sentence);
});
```

### Using `GetSentence`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSentenceRef, GetSentenceVariables } from '@dataconnect/generated';

// The `GetSentence` query requires an argument of type `GetSentenceVariables`:
const getSentenceVars: GetSentenceVariables = {
  id: ..., 
};

// Call the `getSentenceRef()` function to get a reference to the query.
const ref = getSentenceRef(getSentenceVars);
// Variables can be defined inline as well.
const ref = getSentenceRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSentenceRef(dataConnect, getSentenceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.sentence);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.sentence);
});
```

## ListSentences
You can execute the `ListSentences` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSentences(options?: ExecuteQueryOptions): QueryPromise<ListSentencesData, undefined>;

interface ListSentencesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSentencesData, undefined>;
}
export const listSentencesRef: ListSentencesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSentences(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSentencesData, undefined>;

interface ListSentencesRef {
  ...
  (dc: DataConnect): QueryRef<ListSentencesData, undefined>;
}
export const listSentencesRef: ListSentencesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSentencesRef:
```typescript
const name = listSentencesRef.operationName;
console.log(name);
```

### Variables
The `ListSentences` query has no variables.
### Return Type
Recall that executing the `ListSentences` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSentencesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSentencesData {
  sentences: ({
    englishText: string;
    createdAt: TimestampString;
  })[];
}
```
### Using `ListSentences`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSentences } from '@dataconnect/generated';


// Call the `listSentences()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSentences();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSentences(dataConnect);

console.log(data.sentences);

// Or, you can use the `Promise` API.
listSentences().then((response) => {
  const data = response.data;
  console.log(data.sentences);
});
```

### Using `ListSentences`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSentencesRef } from '@dataconnect/generated';


// Call the `listSentencesRef()` function to get a reference to the query.
const ref = listSentencesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSentencesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.sentences);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.sentences);
});
```

## GetTranslation
You can execute the `GetTranslation` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getTranslation(vars: GetTranslationVariables, options?: ExecuteQueryOptions): QueryPromise<GetTranslationData, GetTranslationVariables>;

interface GetTranslationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTranslationVariables): QueryRef<GetTranslationData, GetTranslationVariables>;
}
export const getTranslationRef: GetTranslationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTranslation(dc: DataConnect, vars: GetTranslationVariables, options?: ExecuteQueryOptions): QueryPromise<GetTranslationData, GetTranslationVariables>;

interface GetTranslationRef {
  ...
  (dc: DataConnect, vars: GetTranslationVariables): QueryRef<GetTranslationData, GetTranslationVariables>;
}
export const getTranslationRef: GetTranslationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTranslationRef:
```typescript
const name = getTranslationRef.operationName;
console.log(name);
```

### Variables
The `GetTranslation` query requires an argument of type `GetTranslationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTranslationVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetTranslation` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTranslationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetTranslationData {
  translation?: {
    myanmarText: string;
    phoneticTransliteration?: string | null;
  };
}
```
### Using `GetTranslation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTranslation, GetTranslationVariables } from '@dataconnect/generated';

// The `GetTranslation` query requires an argument of type `GetTranslationVariables`:
const getTranslationVars: GetTranslationVariables = {
  id: ..., 
};

// Call the `getTranslation()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTranslation(getTranslationVars);
// Variables can be defined inline as well.
const { data } = await getTranslation({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTranslation(dataConnect, getTranslationVars);

console.log(data.translation);

// Or, you can use the `Promise` API.
getTranslation(getTranslationVars).then((response) => {
  const data = response.data;
  console.log(data.translation);
});
```

### Using `GetTranslation`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTranslationRef, GetTranslationVariables } from '@dataconnect/generated';

// The `GetTranslation` query requires an argument of type `GetTranslationVariables`:
const getTranslationVars: GetTranslationVariables = {
  id: ..., 
};

// Call the `getTranslationRef()` function to get a reference to the query.
const ref = getTranslationRef(getTranslationVars);
// Variables can be defined inline as well.
const ref = getTranslationRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTranslationRef(dataConnect, getTranslationVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.translation);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.translation);
});
```

## ListTranslations
You can execute the `ListTranslations` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listTranslations(options?: ExecuteQueryOptions): QueryPromise<ListTranslationsData, undefined>;

interface ListTranslationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTranslationsData, undefined>;
}
export const listTranslationsRef: ListTranslationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTranslations(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTranslationsData, undefined>;

interface ListTranslationsRef {
  ...
  (dc: DataConnect): QueryRef<ListTranslationsData, undefined>;
}
export const listTranslationsRef: ListTranslationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTranslationsRef:
```typescript
const name = listTranslationsRef.operationName;
console.log(name);
```

### Variables
The `ListTranslations` query has no variables.
### Return Type
Recall that executing the `ListTranslations` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTranslationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListTranslationsData {
  translations: ({
    myanmarText: string;
  })[];
}
```
### Using `ListTranslations`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTranslations } from '@dataconnect/generated';


// Call the `listTranslations()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTranslations();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTranslations(dataConnect);

console.log(data.translations);

// Or, you can use the `Promise` API.
listTranslations().then((response) => {
  const data = response.data;
  console.log(data.translations);
});
```

### Using `ListTranslations`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTranslationsRef } from '@dataconnect/generated';


// Call the `listTranslationsRef()` function to get a reference to the query.
const ref = listTranslationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTranslationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.translations);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.translations);
});
```

## GetTag
You can execute the `GetTag` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getTag(vars: GetTagVariables, options?: ExecuteQueryOptions): QueryPromise<GetTagData, GetTagVariables>;

interface GetTagRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTagVariables): QueryRef<GetTagData, GetTagVariables>;
}
export const getTagRef: GetTagRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getTag(dc: DataConnect, vars: GetTagVariables, options?: ExecuteQueryOptions): QueryPromise<GetTagData, GetTagVariables>;

interface GetTagRef {
  ...
  (dc: DataConnect, vars: GetTagVariables): QueryRef<GetTagData, GetTagVariables>;
}
export const getTagRef: GetTagRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getTagRef:
```typescript
const name = getTagRef.operationName;
console.log(name);
```

### Variables
The `GetTag` query requires an argument of type `GetTagVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetTagVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetTag` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetTagData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetTagData {
  tag?: {
    name: string;
  };
}
```
### Using `GetTag`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getTag, GetTagVariables } from '@dataconnect/generated';

// The `GetTag` query requires an argument of type `GetTagVariables`:
const getTagVars: GetTagVariables = {
  id: ..., 
};

// Call the `getTag()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getTag(getTagVars);
// Variables can be defined inline as well.
const { data } = await getTag({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getTag(dataConnect, getTagVars);

console.log(data.tag);

// Or, you can use the `Promise` API.
getTag(getTagVars).then((response) => {
  const data = response.data;
  console.log(data.tag);
});
```

### Using `GetTag`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getTagRef, GetTagVariables } from '@dataconnect/generated';

// The `GetTag` query requires an argument of type `GetTagVariables`:
const getTagVars: GetTagVariables = {
  id: ..., 
};

// Call the `getTagRef()` function to get a reference to the query.
const ref = getTagRef(getTagVars);
// Variables can be defined inline as well.
const ref = getTagRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getTagRef(dataConnect, getTagVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tag);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tag);
});
```

## ListTags
You can execute the `ListTags` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listTags(options?: ExecuteQueryOptions): QueryPromise<ListTagsData, undefined>;

interface ListTagsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTagsData, undefined>;
}
export const listTagsRef: ListTagsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listTags(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTagsData, undefined>;

interface ListTagsRef {
  ...
  (dc: DataConnect): QueryRef<ListTagsData, undefined>;
}
export const listTagsRef: ListTagsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listTagsRef:
```typescript
const name = listTagsRef.operationName;
console.log(name);
```

### Variables
The `ListTags` query has no variables.
### Return Type
Recall that executing the `ListTags` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListTagsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListTagsData {
  tags: ({
    name: string;
  })[];
}
```
### Using `ListTags`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listTags } from '@dataconnect/generated';


// Call the `listTags()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listTags();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listTags(dataConnect);

console.log(data.tags);

// Or, you can use the `Promise` API.
listTags().then((response) => {
  const data = response.data;
  console.log(data.tags);
});
```

### Using `ListTags`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listTagsRef } from '@dataconnect/generated';


// Call the `listTagsRef()` function to get a reference to the query.
const ref = listTagsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listTagsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.tags);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.tags);
});
```

## GetVote
You can execute the `GetVote` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getVote(vars: GetVoteVariables, options?: ExecuteQueryOptions): QueryPromise<GetVoteData, GetVoteVariables>;

interface GetVoteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetVoteVariables): QueryRef<GetVoteData, GetVoteVariables>;
}
export const getVoteRef: GetVoteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getVote(dc: DataConnect, vars: GetVoteVariables, options?: ExecuteQueryOptions): QueryPromise<GetVoteData, GetVoteVariables>;

interface GetVoteRef {
  ...
  (dc: DataConnect, vars: GetVoteVariables): QueryRef<GetVoteData, GetVoteVariables>;
}
export const getVoteRef: GetVoteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getVoteRef:
```typescript
const name = getVoteRef.operationName;
console.log(name);
```

### Variables
The `GetVote` query requires an argument of type `GetVoteVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetVoteVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetVote` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetVoteData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetVoteData {
  vote?: {
    value: number;
    translation: {
      myanmarText: string;
    };
  };
}
```
### Using `GetVote`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getVote, GetVoteVariables } from '@dataconnect/generated';

// The `GetVote` query requires an argument of type `GetVoteVariables`:
const getVoteVars: GetVoteVariables = {
  id: ..., 
};

// Call the `getVote()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getVote(getVoteVars);
// Variables can be defined inline as well.
const { data } = await getVote({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getVote(dataConnect, getVoteVars);

console.log(data.vote);

// Or, you can use the `Promise` API.
getVote(getVoteVars).then((response) => {
  const data = response.data;
  console.log(data.vote);
});
```

### Using `GetVote`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getVoteRef, GetVoteVariables } from '@dataconnect/generated';

// The `GetVote` query requires an argument of type `GetVoteVariables`:
const getVoteVars: GetVoteVariables = {
  id: ..., 
};

// Call the `getVoteRef()` function to get a reference to the query.
const ref = getVoteRef(getVoteVars);
// Variables can be defined inline as well.
const ref = getVoteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getVoteRef(dataConnect, getVoteVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.vote);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.vote);
});
```

## ListMyVotes
You can execute the `ListMyVotes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyVotes(options?: ExecuteQueryOptions): QueryPromise<ListMyVotesData, undefined>;

interface ListMyVotesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyVotesData, undefined>;
}
export const listMyVotesRef: ListMyVotesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyVotes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyVotesData, undefined>;

interface ListMyVotesRef {
  ...
  (dc: DataConnect): QueryRef<ListMyVotesData, undefined>;
}
export const listMyVotesRef: ListMyVotesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyVotesRef:
```typescript
const name = listMyVotesRef.operationName;
console.log(name);
```

### Variables
The `ListMyVotes` query has no variables.
### Return Type
Recall that executing the `ListMyVotes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyVotesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyVotesData {
  votes: ({
    value: number;
    translation: {
      myanmarText: string;
    };
  })[];
}
```
### Using `ListMyVotes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyVotes } from '@dataconnect/generated';


// Call the `listMyVotes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyVotes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyVotes(dataConnect);

console.log(data.votes);

// Or, you can use the `Promise` API.
listMyVotes().then((response) => {
  const data = response.data;
  console.log(data.votes);
});
```

### Using `ListMyVotes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyVotesRef } from '@dataconnect/generated';


// Call the `listMyVotesRef()` function to get a reference to the query.
const ref = listMyVotesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyVotesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.votes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.votes);
});
```

## ListMyCollection
You can execute the `ListMyCollection` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyCollection(options?: ExecuteQueryOptions): QueryPromise<ListMyCollectionData, undefined>;

interface ListMyCollectionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyCollectionData, undefined>;
}
export const listMyCollectionRef: ListMyCollectionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyCollection(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyCollectionData, undefined>;

interface ListMyCollectionRef {
  ...
  (dc: DataConnect): QueryRef<ListMyCollectionData, undefined>;
}
export const listMyCollectionRef: ListMyCollectionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyCollectionRef:
```typescript
const name = listMyCollectionRef.operationName;
console.log(name);
```

### Variables
The `ListMyCollection` query has no variables.
### Return Type
Recall that executing the `ListMyCollection` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyCollectionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyCollectionData {
  userCollections: ({
    sentence: {
      englishText: string;
    };
  })[];
}
```
### Using `ListMyCollection`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyCollection } from '@dataconnect/generated';


// Call the `listMyCollection()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyCollection();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyCollection(dataConnect);

console.log(data.userCollections);

// Or, you can use the `Promise` API.
listMyCollection().then((response) => {
  const data = response.data;
  console.log(data.userCollections);
});
```

### Using `ListMyCollection`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyCollectionRef } from '@dataconnect/generated';


// Call the `listMyCollectionRef()` function to get a reference to the query.
const ref = listMyCollectionRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyCollectionRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userCollections);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userCollections);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateSentence
You can execute the `CreateSentence` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createSentence(vars: CreateSentenceVariables): MutationPromise<CreateSentenceData, CreateSentenceVariables>;

interface CreateSentenceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSentenceVariables): MutationRef<CreateSentenceData, CreateSentenceVariables>;
}
export const createSentenceRef: CreateSentenceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSentence(dc: DataConnect, vars: CreateSentenceVariables): MutationPromise<CreateSentenceData, CreateSentenceVariables>;

interface CreateSentenceRef {
  ...
  (dc: DataConnect, vars: CreateSentenceVariables): MutationRef<CreateSentenceData, CreateSentenceVariables>;
}
export const createSentenceRef: CreateSentenceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSentenceRef:
```typescript
const name = createSentenceRef.operationName;
console.log(name);
```

### Variables
The `CreateSentence` mutation requires an argument of type `CreateSentenceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateSentenceVariables {
  englishText: string;
  contextDescription?: string | null;
}
```
### Return Type
Recall that executing the `CreateSentence` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSentenceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSentenceData {
  sentence_insert: Sentence_Key;
}
```
### Using `CreateSentence`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSentence, CreateSentenceVariables } from '@dataconnect/generated';

// The `CreateSentence` mutation requires an argument of type `CreateSentenceVariables`:
const createSentenceVars: CreateSentenceVariables = {
  englishText: ..., 
  contextDescription: ..., // optional
};

// Call the `createSentence()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSentence(createSentenceVars);
// Variables can be defined inline as well.
const { data } = await createSentence({ englishText: ..., contextDescription: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSentence(dataConnect, createSentenceVars);

console.log(data.sentence_insert);

// Or, you can use the `Promise` API.
createSentence(createSentenceVars).then((response) => {
  const data = response.data;
  console.log(data.sentence_insert);
});
```

### Using `CreateSentence`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSentenceRef, CreateSentenceVariables } from '@dataconnect/generated';

// The `CreateSentence` mutation requires an argument of type `CreateSentenceVariables`:
const createSentenceVars: CreateSentenceVariables = {
  englishText: ..., 
  contextDescription: ..., // optional
};

// Call the `createSentenceRef()` function to get a reference to the mutation.
const ref = createSentenceRef(createSentenceVars);
// Variables can be defined inline as well.
const ref = createSentenceRef({ englishText: ..., contextDescription: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSentenceRef(dataConnect, createSentenceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.sentence_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.sentence_insert);
});
```

## DeleteSentence
You can execute the `DeleteSentence` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteSentence(vars: DeleteSentenceVariables): MutationPromise<DeleteSentenceData, DeleteSentenceVariables>;

interface DeleteSentenceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSentenceVariables): MutationRef<DeleteSentenceData, DeleteSentenceVariables>;
}
export const deleteSentenceRef: DeleteSentenceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteSentence(dc: DataConnect, vars: DeleteSentenceVariables): MutationPromise<DeleteSentenceData, DeleteSentenceVariables>;

interface DeleteSentenceRef {
  ...
  (dc: DataConnect, vars: DeleteSentenceVariables): MutationRef<DeleteSentenceData, DeleteSentenceVariables>;
}
export const deleteSentenceRef: DeleteSentenceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteSentenceRef:
```typescript
const name = deleteSentenceRef.operationName;
console.log(name);
```

### Variables
The `DeleteSentence` mutation requires an argument of type `DeleteSentenceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteSentenceVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteSentence` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteSentenceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteSentenceData {
  sentence_delete?: Sentence_Key | null;
}
```
### Using `DeleteSentence`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteSentence, DeleteSentenceVariables } from '@dataconnect/generated';

// The `DeleteSentence` mutation requires an argument of type `DeleteSentenceVariables`:
const deleteSentenceVars: DeleteSentenceVariables = {
  id: ..., 
};

// Call the `deleteSentence()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteSentence(deleteSentenceVars);
// Variables can be defined inline as well.
const { data } = await deleteSentence({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteSentence(dataConnect, deleteSentenceVars);

console.log(data.sentence_delete);

// Or, you can use the `Promise` API.
deleteSentence(deleteSentenceVars).then((response) => {
  const data = response.data;
  console.log(data.sentence_delete);
});
```

### Using `DeleteSentence`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteSentenceRef, DeleteSentenceVariables } from '@dataconnect/generated';

// The `DeleteSentence` mutation requires an argument of type `DeleteSentenceVariables`:
const deleteSentenceVars: DeleteSentenceVariables = {
  id: ..., 
};

// Call the `deleteSentenceRef()` function to get a reference to the mutation.
const ref = deleteSentenceRef(deleteSentenceVars);
// Variables can be defined inline as well.
const ref = deleteSentenceRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteSentenceRef(dataConnect, deleteSentenceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.sentence_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.sentence_delete);
});
```

## UpdateSentence
You can execute the `UpdateSentence` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateSentence(vars: UpdateSentenceVariables): MutationPromise<UpdateSentenceData, UpdateSentenceVariables>;

interface UpdateSentenceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSentenceVariables): MutationRef<UpdateSentenceData, UpdateSentenceVariables>;
}
export const updateSentenceRef: UpdateSentenceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateSentence(dc: DataConnect, vars: UpdateSentenceVariables): MutationPromise<UpdateSentenceData, UpdateSentenceVariables>;

interface UpdateSentenceRef {
  ...
  (dc: DataConnect, vars: UpdateSentenceVariables): MutationRef<UpdateSentenceData, UpdateSentenceVariables>;
}
export const updateSentenceRef: UpdateSentenceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSentenceRef:
```typescript
const name = updateSentenceRef.operationName;
console.log(name);
```

### Variables
The `UpdateSentence` mutation requires an argument of type `UpdateSentenceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateSentenceVariables {
  id: UUIDString;
  contextDescription?: string | null;
}
```
### Return Type
Recall that executing the `UpdateSentence` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSentenceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSentenceData {
  sentence_update?: Sentence_Key | null;
}
```
### Using `UpdateSentence`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateSentence, UpdateSentenceVariables } from '@dataconnect/generated';

// The `UpdateSentence` mutation requires an argument of type `UpdateSentenceVariables`:
const updateSentenceVars: UpdateSentenceVariables = {
  id: ..., 
  contextDescription: ..., // optional
};

// Call the `updateSentence()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateSentence(updateSentenceVars);
// Variables can be defined inline as well.
const { data } = await updateSentence({ id: ..., contextDescription: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateSentence(dataConnect, updateSentenceVars);

console.log(data.sentence_update);

// Or, you can use the `Promise` API.
updateSentence(updateSentenceVars).then((response) => {
  const data = response.data;
  console.log(data.sentence_update);
});
```

### Using `UpdateSentence`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSentenceRef, UpdateSentenceVariables } from '@dataconnect/generated';

// The `UpdateSentence` mutation requires an argument of type `UpdateSentenceVariables`:
const updateSentenceVars: UpdateSentenceVariables = {
  id: ..., 
  contextDescription: ..., // optional
};

// Call the `updateSentenceRef()` function to get a reference to the mutation.
const ref = updateSentenceRef(updateSentenceVars);
// Variables can be defined inline as well.
const ref = updateSentenceRef({ id: ..., contextDescription: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSentenceRef(dataConnect, updateSentenceVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.sentence_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.sentence_update);
});
```

## CreateTranslation
You can execute the `CreateTranslation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createTranslation(vars: CreateTranslationVariables): MutationPromise<CreateTranslationData, CreateTranslationVariables>;

interface CreateTranslationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTranslationVariables): MutationRef<CreateTranslationData, CreateTranslationVariables>;
}
export const createTranslationRef: CreateTranslationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createTranslation(dc: DataConnect, vars: CreateTranslationVariables): MutationPromise<CreateTranslationData, CreateTranslationVariables>;

interface CreateTranslationRef {
  ...
  (dc: DataConnect, vars: CreateTranslationVariables): MutationRef<CreateTranslationData, CreateTranslationVariables>;
}
export const createTranslationRef: CreateTranslationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createTranslationRef:
```typescript
const name = createTranslationRef.operationName;
console.log(name);
```

### Variables
The `CreateTranslation` mutation requires an argument of type `CreateTranslationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateTranslationVariables {
  myanmarText: string;
  scriptType: string;
  sentenceId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateTranslation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateTranslationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateTranslationData {
  translation_insert: Translation_Key;
}
```
### Using `CreateTranslation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createTranslation, CreateTranslationVariables } from '@dataconnect/generated';

// The `CreateTranslation` mutation requires an argument of type `CreateTranslationVariables`:
const createTranslationVars: CreateTranslationVariables = {
  myanmarText: ..., 
  scriptType: ..., 
  sentenceId: ..., 
};

// Call the `createTranslation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createTranslation(createTranslationVars);
// Variables can be defined inline as well.
const { data } = await createTranslation({ myanmarText: ..., scriptType: ..., sentenceId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createTranslation(dataConnect, createTranslationVars);

console.log(data.translation_insert);

// Or, you can use the `Promise` API.
createTranslation(createTranslationVars).then((response) => {
  const data = response.data;
  console.log(data.translation_insert);
});
```

### Using `CreateTranslation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createTranslationRef, CreateTranslationVariables } from '@dataconnect/generated';

// The `CreateTranslation` mutation requires an argument of type `CreateTranslationVariables`:
const createTranslationVars: CreateTranslationVariables = {
  myanmarText: ..., 
  scriptType: ..., 
  sentenceId: ..., 
};

// Call the `createTranslationRef()` function to get a reference to the mutation.
const ref = createTranslationRef(createTranslationVars);
// Variables can be defined inline as well.
const ref = createTranslationRef({ myanmarText: ..., scriptType: ..., sentenceId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createTranslationRef(dataConnect, createTranslationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.translation_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.translation_insert);
});
```

## DeleteTranslation
You can execute the `DeleteTranslation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteTranslation(vars: DeleteTranslationVariables): MutationPromise<DeleteTranslationData, DeleteTranslationVariables>;

interface DeleteTranslationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTranslationVariables): MutationRef<DeleteTranslationData, DeleteTranslationVariables>;
}
export const deleteTranslationRef: DeleteTranslationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteTranslation(dc: DataConnect, vars: DeleteTranslationVariables): MutationPromise<DeleteTranslationData, DeleteTranslationVariables>;

interface DeleteTranslationRef {
  ...
  (dc: DataConnect, vars: DeleteTranslationVariables): MutationRef<DeleteTranslationData, DeleteTranslationVariables>;
}
export const deleteTranslationRef: DeleteTranslationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteTranslationRef:
```typescript
const name = deleteTranslationRef.operationName;
console.log(name);
```

### Variables
The `DeleteTranslation` mutation requires an argument of type `DeleteTranslationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteTranslationVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteTranslation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteTranslationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteTranslationData {
  translation_delete?: Translation_Key | null;
}
```
### Using `DeleteTranslation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteTranslation, DeleteTranslationVariables } from '@dataconnect/generated';

// The `DeleteTranslation` mutation requires an argument of type `DeleteTranslationVariables`:
const deleteTranslationVars: DeleteTranslationVariables = {
  id: ..., 
};

// Call the `deleteTranslation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteTranslation(deleteTranslationVars);
// Variables can be defined inline as well.
const { data } = await deleteTranslation({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteTranslation(dataConnect, deleteTranslationVars);

console.log(data.translation_delete);

// Or, you can use the `Promise` API.
deleteTranslation(deleteTranslationVars).then((response) => {
  const data = response.data;
  console.log(data.translation_delete);
});
```

### Using `DeleteTranslation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteTranslationRef, DeleteTranslationVariables } from '@dataconnect/generated';

// The `DeleteTranslation` mutation requires an argument of type `DeleteTranslationVariables`:
const deleteTranslationVars: DeleteTranslationVariables = {
  id: ..., 
};

// Call the `deleteTranslationRef()` function to get a reference to the mutation.
const ref = deleteTranslationRef(deleteTranslationVars);
// Variables can be defined inline as well.
const ref = deleteTranslationRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteTranslationRef(dataConnect, deleteTranslationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.translation_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.translation_delete);
});
```

## UpdateTranslation
You can execute the `UpdateTranslation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateTranslation(vars: UpdateTranslationVariables): MutationPromise<UpdateTranslationData, UpdateTranslationVariables>;

interface UpdateTranslationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTranslationVariables): MutationRef<UpdateTranslationData, UpdateTranslationVariables>;
}
export const updateTranslationRef: UpdateTranslationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateTranslation(dc: DataConnect, vars: UpdateTranslationVariables): MutationPromise<UpdateTranslationData, UpdateTranslationVariables>;

interface UpdateTranslationRef {
  ...
  (dc: DataConnect, vars: UpdateTranslationVariables): MutationRef<UpdateTranslationData, UpdateTranslationVariables>;
}
export const updateTranslationRef: UpdateTranslationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateTranslationRef:
```typescript
const name = updateTranslationRef.operationName;
console.log(name);
```

### Variables
The `UpdateTranslation` mutation requires an argument of type `UpdateTranslationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateTranslationVariables {
  id: UUIDString;
  phoneticTransliteration?: string | null;
}
```
### Return Type
Recall that executing the `UpdateTranslation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateTranslationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateTranslationData {
  translation_update?: Translation_Key | null;
}
```
### Using `UpdateTranslation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateTranslation, UpdateTranslationVariables } from '@dataconnect/generated';

// The `UpdateTranslation` mutation requires an argument of type `UpdateTranslationVariables`:
const updateTranslationVars: UpdateTranslationVariables = {
  id: ..., 
  phoneticTransliteration: ..., // optional
};

// Call the `updateTranslation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateTranslation(updateTranslationVars);
// Variables can be defined inline as well.
const { data } = await updateTranslation({ id: ..., phoneticTransliteration: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateTranslation(dataConnect, updateTranslationVars);

console.log(data.translation_update);

// Or, you can use the `Promise` API.
updateTranslation(updateTranslationVars).then((response) => {
  const data = response.data;
  console.log(data.translation_update);
});
```

### Using `UpdateTranslation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateTranslationRef, UpdateTranslationVariables } from '@dataconnect/generated';

// The `UpdateTranslation` mutation requires an argument of type `UpdateTranslationVariables`:
const updateTranslationVars: UpdateTranslationVariables = {
  id: ..., 
  phoneticTransliteration: ..., // optional
};

// Call the `updateTranslationRef()` function to get a reference to the mutation.
const ref = updateTranslationRef(updateTranslationVars);
// Variables can be defined inline as well.
const ref = updateTranslationRef({ id: ..., phoneticTransliteration: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateTranslationRef(dataConnect, updateTranslationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.translation_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.translation_update);
});
```

## CreateTag
You can execute the `CreateTag` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createTag(vars: CreateTagVariables): MutationPromise<CreateTagData, CreateTagVariables>;

interface CreateTagRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTagVariables): MutationRef<CreateTagData, CreateTagVariables>;
}
export const createTagRef: CreateTagRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createTag(dc: DataConnect, vars: CreateTagVariables): MutationPromise<CreateTagData, CreateTagVariables>;

interface CreateTagRef {
  ...
  (dc: DataConnect, vars: CreateTagVariables): MutationRef<CreateTagData, CreateTagVariables>;
}
export const createTagRef: CreateTagRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createTagRef:
```typescript
const name = createTagRef.operationName;
console.log(name);
```

### Variables
The `CreateTag` mutation requires an argument of type `CreateTagVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateTagVariables {
  name: string;
}
```
### Return Type
Recall that executing the `CreateTag` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateTagData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateTagData {
  tag_insert: Tag_Key;
}
```
### Using `CreateTag`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createTag, CreateTagVariables } from '@dataconnect/generated';

// The `CreateTag` mutation requires an argument of type `CreateTagVariables`:
const createTagVars: CreateTagVariables = {
  name: ..., 
};

// Call the `createTag()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createTag(createTagVars);
// Variables can be defined inline as well.
const { data } = await createTag({ name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createTag(dataConnect, createTagVars);

console.log(data.tag_insert);

// Or, you can use the `Promise` API.
createTag(createTagVars).then((response) => {
  const data = response.data;
  console.log(data.tag_insert);
});
```

### Using `CreateTag`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createTagRef, CreateTagVariables } from '@dataconnect/generated';

// The `CreateTag` mutation requires an argument of type `CreateTagVariables`:
const createTagVars: CreateTagVariables = {
  name: ..., 
};

// Call the `createTagRef()` function to get a reference to the mutation.
const ref = createTagRef(createTagVars);
// Variables can be defined inline as well.
const ref = createTagRef({ name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createTagRef(dataConnect, createTagVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.tag_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.tag_insert);
});
```

## DeleteTag
You can execute the `DeleteTag` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteTag(vars: DeleteTagVariables): MutationPromise<DeleteTagData, DeleteTagVariables>;

interface DeleteTagRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTagVariables): MutationRef<DeleteTagData, DeleteTagVariables>;
}
export const deleteTagRef: DeleteTagRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteTag(dc: DataConnect, vars: DeleteTagVariables): MutationPromise<DeleteTagData, DeleteTagVariables>;

interface DeleteTagRef {
  ...
  (dc: DataConnect, vars: DeleteTagVariables): MutationRef<DeleteTagData, DeleteTagVariables>;
}
export const deleteTagRef: DeleteTagRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteTagRef:
```typescript
const name = deleteTagRef.operationName;
console.log(name);
```

### Variables
The `DeleteTag` mutation requires an argument of type `DeleteTagVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteTagVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteTag` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteTagData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteTagData {
  tag_delete?: Tag_Key | null;
}
```
### Using `DeleteTag`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteTag, DeleteTagVariables } from '@dataconnect/generated';

// The `DeleteTag` mutation requires an argument of type `DeleteTagVariables`:
const deleteTagVars: DeleteTagVariables = {
  id: ..., 
};

// Call the `deleteTag()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteTag(deleteTagVars);
// Variables can be defined inline as well.
const { data } = await deleteTag({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteTag(dataConnect, deleteTagVars);

console.log(data.tag_delete);

// Or, you can use the `Promise` API.
deleteTag(deleteTagVars).then((response) => {
  const data = response.data;
  console.log(data.tag_delete);
});
```

### Using `DeleteTag`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteTagRef, DeleteTagVariables } from '@dataconnect/generated';

// The `DeleteTag` mutation requires an argument of type `DeleteTagVariables`:
const deleteTagVars: DeleteTagVariables = {
  id: ..., 
};

// Call the `deleteTagRef()` function to get a reference to the mutation.
const ref = deleteTagRef(deleteTagVars);
// Variables can be defined inline as well.
const ref = deleteTagRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteTagRef(dataConnect, deleteTagVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.tag_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.tag_delete);
});
```

## UpdateTag
You can execute the `UpdateTag` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateTag(vars: UpdateTagVariables): MutationPromise<UpdateTagData, UpdateTagVariables>;

interface UpdateTagRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTagVariables): MutationRef<UpdateTagData, UpdateTagVariables>;
}
export const updateTagRef: UpdateTagRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateTag(dc: DataConnect, vars: UpdateTagVariables): MutationPromise<UpdateTagData, UpdateTagVariables>;

interface UpdateTagRef {
  ...
  (dc: DataConnect, vars: UpdateTagVariables): MutationRef<UpdateTagData, UpdateTagVariables>;
}
export const updateTagRef: UpdateTagRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateTagRef:
```typescript
const name = updateTagRef.operationName;
console.log(name);
```

### Variables
The `UpdateTag` mutation requires an argument of type `UpdateTagVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateTagVariables {
  id: UUIDString;
  name: string;
}
```
### Return Type
Recall that executing the `UpdateTag` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateTagData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateTagData {
  tag_update?: Tag_Key | null;
}
```
### Using `UpdateTag`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateTag, UpdateTagVariables } from '@dataconnect/generated';

// The `UpdateTag` mutation requires an argument of type `UpdateTagVariables`:
const updateTagVars: UpdateTagVariables = {
  id: ..., 
  name: ..., 
};

// Call the `updateTag()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateTag(updateTagVars);
// Variables can be defined inline as well.
const { data } = await updateTag({ id: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateTag(dataConnect, updateTagVars);

console.log(data.tag_update);

// Or, you can use the `Promise` API.
updateTag(updateTagVars).then((response) => {
  const data = response.data;
  console.log(data.tag_update);
});
```

### Using `UpdateTag`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateTagRef, UpdateTagVariables } from '@dataconnect/generated';

// The `UpdateTag` mutation requires an argument of type `UpdateTagVariables`:
const updateTagVars: UpdateTagVariables = {
  id: ..., 
  name: ..., 
};

// Call the `updateTagRef()` function to get a reference to the mutation.
const ref = updateTagRef(updateTagVars);
// Variables can be defined inline as well.
const ref = updateTagRef({ id: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateTagRef(dataConnect, updateTagVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.tag_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.tag_update);
});
```

## CreateVote
You can execute the `CreateVote` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createVote(vars: CreateVoteVariables): MutationPromise<CreateVoteData, CreateVoteVariables>;

interface CreateVoteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateVoteVariables): MutationRef<CreateVoteData, CreateVoteVariables>;
}
export const createVoteRef: CreateVoteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createVote(dc: DataConnect, vars: CreateVoteVariables): MutationPromise<CreateVoteData, CreateVoteVariables>;

interface CreateVoteRef {
  ...
  (dc: DataConnect, vars: CreateVoteVariables): MutationRef<CreateVoteData, CreateVoteVariables>;
}
export const createVoteRef: CreateVoteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createVoteRef:
```typescript
const name = createVoteRef.operationName;
console.log(name);
```

### Variables
The `CreateVote` mutation requires an argument of type `CreateVoteVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateVoteVariables {
  value: number;
  translationId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateVote` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateVoteData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateVoteData {
  vote_insert: Vote_Key;
}
```
### Using `CreateVote`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createVote, CreateVoteVariables } from '@dataconnect/generated';

// The `CreateVote` mutation requires an argument of type `CreateVoteVariables`:
const createVoteVars: CreateVoteVariables = {
  value: ..., 
  translationId: ..., 
};

// Call the `createVote()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createVote(createVoteVars);
// Variables can be defined inline as well.
const { data } = await createVote({ value: ..., translationId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createVote(dataConnect, createVoteVars);

console.log(data.vote_insert);

// Or, you can use the `Promise` API.
createVote(createVoteVars).then((response) => {
  const data = response.data;
  console.log(data.vote_insert);
});
```

### Using `CreateVote`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createVoteRef, CreateVoteVariables } from '@dataconnect/generated';

// The `CreateVote` mutation requires an argument of type `CreateVoteVariables`:
const createVoteVars: CreateVoteVariables = {
  value: ..., 
  translationId: ..., 
};

// Call the `createVoteRef()` function to get a reference to the mutation.
const ref = createVoteRef(createVoteVars);
// Variables can be defined inline as well.
const ref = createVoteRef({ value: ..., translationId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createVoteRef(dataConnect, createVoteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.vote_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.vote_insert);
});
```

## DeleteVote
You can execute the `DeleteVote` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteVote(vars: DeleteVoteVariables): MutationPromise<DeleteVoteData, DeleteVoteVariables>;

interface DeleteVoteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteVoteVariables): MutationRef<DeleteVoteData, DeleteVoteVariables>;
}
export const deleteVoteRef: DeleteVoteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteVote(dc: DataConnect, vars: DeleteVoteVariables): MutationPromise<DeleteVoteData, DeleteVoteVariables>;

interface DeleteVoteRef {
  ...
  (dc: DataConnect, vars: DeleteVoteVariables): MutationRef<DeleteVoteData, DeleteVoteVariables>;
}
export const deleteVoteRef: DeleteVoteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteVoteRef:
```typescript
const name = deleteVoteRef.operationName;
console.log(name);
```

### Variables
The `DeleteVote` mutation requires an argument of type `DeleteVoteVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteVoteVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteVote` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteVoteData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteVoteData {
  vote_delete?: Vote_Key | null;
}
```
### Using `DeleteVote`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteVote, DeleteVoteVariables } from '@dataconnect/generated';

// The `DeleteVote` mutation requires an argument of type `DeleteVoteVariables`:
const deleteVoteVars: DeleteVoteVariables = {
  id: ..., 
};

// Call the `deleteVote()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteVote(deleteVoteVars);
// Variables can be defined inline as well.
const { data } = await deleteVote({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteVote(dataConnect, deleteVoteVars);

console.log(data.vote_delete);

// Or, you can use the `Promise` API.
deleteVote(deleteVoteVars).then((response) => {
  const data = response.data;
  console.log(data.vote_delete);
});
```

### Using `DeleteVote`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteVoteRef, DeleteVoteVariables } from '@dataconnect/generated';

// The `DeleteVote` mutation requires an argument of type `DeleteVoteVariables`:
const deleteVoteVars: DeleteVoteVariables = {
  id: ..., 
};

// Call the `deleteVoteRef()` function to get a reference to the mutation.
const ref = deleteVoteRef(deleteVoteVars);
// Variables can be defined inline as well.
const ref = deleteVoteRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteVoteRef(dataConnect, deleteVoteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.vote_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.vote_delete);
});
```

## UpdateVote
You can execute the `UpdateVote` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateVote(vars: UpdateVoteVariables): MutationPromise<UpdateVoteData, UpdateVoteVariables>;

interface UpdateVoteRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateVoteVariables): MutationRef<UpdateVoteData, UpdateVoteVariables>;
}
export const updateVoteRef: UpdateVoteRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateVote(dc: DataConnect, vars: UpdateVoteVariables): MutationPromise<UpdateVoteData, UpdateVoteVariables>;

interface UpdateVoteRef {
  ...
  (dc: DataConnect, vars: UpdateVoteVariables): MutationRef<UpdateVoteData, UpdateVoteVariables>;
}
export const updateVoteRef: UpdateVoteRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateVoteRef:
```typescript
const name = updateVoteRef.operationName;
console.log(name);
```

### Variables
The `UpdateVote` mutation requires an argument of type `UpdateVoteVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateVoteVariables {
  id: UUIDString;
  value: number;
}
```
### Return Type
Recall that executing the `UpdateVote` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateVoteData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateVoteData {
  vote_update?: Vote_Key | null;
}
```
### Using `UpdateVote`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateVote, UpdateVoteVariables } from '@dataconnect/generated';

// The `UpdateVote` mutation requires an argument of type `UpdateVoteVariables`:
const updateVoteVars: UpdateVoteVariables = {
  id: ..., 
  value: ..., 
};

// Call the `updateVote()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateVote(updateVoteVars);
// Variables can be defined inline as well.
const { data } = await updateVote({ id: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateVote(dataConnect, updateVoteVars);

console.log(data.vote_update);

// Or, you can use the `Promise` API.
updateVote(updateVoteVars).then((response) => {
  const data = response.data;
  console.log(data.vote_update);
});
```

### Using `UpdateVote`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateVoteRef, UpdateVoteVariables } from '@dataconnect/generated';

// The `UpdateVote` mutation requires an argument of type `UpdateVoteVariables`:
const updateVoteVars: UpdateVoteVariables = {
  id: ..., 
  value: ..., 
};

// Call the `updateVoteRef()` function to get a reference to the mutation.
const ref = updateVoteRef(updateVoteVars);
// Variables can be defined inline as well.
const ref = updateVoteRef({ id: ..., value: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateVoteRef(dataConnect, updateVoteVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.vote_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.vote_update);
});
```

## CreateUserCollection
You can execute the `CreateUserCollection` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUserCollection(vars: CreateUserCollectionVariables): MutationPromise<CreateUserCollectionData, CreateUserCollectionVariables>;

interface CreateUserCollectionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserCollectionVariables): MutationRef<CreateUserCollectionData, CreateUserCollectionVariables>;
}
export const createUserCollectionRef: CreateUserCollectionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUserCollection(dc: DataConnect, vars: CreateUserCollectionVariables): MutationPromise<CreateUserCollectionData, CreateUserCollectionVariables>;

interface CreateUserCollectionRef {
  ...
  (dc: DataConnect, vars: CreateUserCollectionVariables): MutationRef<CreateUserCollectionData, CreateUserCollectionVariables>;
}
export const createUserCollectionRef: CreateUserCollectionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserCollectionRef:
```typescript
const name = createUserCollectionRef.operationName;
console.log(name);
```

### Variables
The `CreateUserCollection` mutation requires an argument of type `CreateUserCollectionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserCollectionVariables {
  sentenceId: UUIDString;
}
```
### Return Type
Recall that executing the `CreateUserCollection` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserCollectionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserCollectionData {
  userCollection_insert: UserCollection_Key;
}
```
### Using `CreateUserCollection`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUserCollection, CreateUserCollectionVariables } from '@dataconnect/generated';

// The `CreateUserCollection` mutation requires an argument of type `CreateUserCollectionVariables`:
const createUserCollectionVars: CreateUserCollectionVariables = {
  sentenceId: ..., 
};

// Call the `createUserCollection()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUserCollection(createUserCollectionVars);
// Variables can be defined inline as well.
const { data } = await createUserCollection({ sentenceId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUserCollection(dataConnect, createUserCollectionVars);

console.log(data.userCollection_insert);

// Or, you can use the `Promise` API.
createUserCollection(createUserCollectionVars).then((response) => {
  const data = response.data;
  console.log(data.userCollection_insert);
});
```

### Using `CreateUserCollection`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserCollectionRef, CreateUserCollectionVariables } from '@dataconnect/generated';

// The `CreateUserCollection` mutation requires an argument of type `CreateUserCollectionVariables`:
const createUserCollectionVars: CreateUserCollectionVariables = {
  sentenceId: ..., 
};

// Call the `createUserCollectionRef()` function to get a reference to the mutation.
const ref = createUserCollectionRef(createUserCollectionVars);
// Variables can be defined inline as well.
const ref = createUserCollectionRef({ sentenceId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserCollectionRef(dataConnect, createUserCollectionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userCollection_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userCollection_insert);
});
```

## DeleteUserCollection
You can execute the `DeleteUserCollection` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteUserCollection(vars: DeleteUserCollectionVariables): MutationPromise<DeleteUserCollectionData, DeleteUserCollectionVariables>;

interface DeleteUserCollectionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUserCollectionVariables): MutationRef<DeleteUserCollectionData, DeleteUserCollectionVariables>;
}
export const deleteUserCollectionRef: DeleteUserCollectionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteUserCollection(dc: DataConnect, vars: DeleteUserCollectionVariables): MutationPromise<DeleteUserCollectionData, DeleteUserCollectionVariables>;

interface DeleteUserCollectionRef {
  ...
  (dc: DataConnect, vars: DeleteUserCollectionVariables): MutationRef<DeleteUserCollectionData, DeleteUserCollectionVariables>;
}
export const deleteUserCollectionRef: DeleteUserCollectionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteUserCollectionRef:
```typescript
const name = deleteUserCollectionRef.operationName;
console.log(name);
```

### Variables
The `DeleteUserCollection` mutation requires an argument of type `DeleteUserCollectionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteUserCollectionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteUserCollection` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteUserCollectionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteUserCollectionData {
  userCollection_delete?: UserCollection_Key | null;
}
```
### Using `DeleteUserCollection`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteUserCollection, DeleteUserCollectionVariables } from '@dataconnect/generated';

// The `DeleteUserCollection` mutation requires an argument of type `DeleteUserCollectionVariables`:
const deleteUserCollectionVars: DeleteUserCollectionVariables = {
  id: ..., 
};

// Call the `deleteUserCollection()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteUserCollection(deleteUserCollectionVars);
// Variables can be defined inline as well.
const { data } = await deleteUserCollection({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteUserCollection(dataConnect, deleteUserCollectionVars);

console.log(data.userCollection_delete);

// Or, you can use the `Promise` API.
deleteUserCollection(deleteUserCollectionVars).then((response) => {
  const data = response.data;
  console.log(data.userCollection_delete);
});
```

### Using `DeleteUserCollection`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteUserCollectionRef, DeleteUserCollectionVariables } from '@dataconnect/generated';

// The `DeleteUserCollection` mutation requires an argument of type `DeleteUserCollectionVariables`:
const deleteUserCollectionVars: DeleteUserCollectionVariables = {
  id: ..., 
};

// Call the `deleteUserCollectionRef()` function to get a reference to the mutation.
const ref = deleteUserCollectionRef(deleteUserCollectionVars);
// Variables can be defined inline as well.
const ref = deleteUserCollectionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteUserCollectionRef(dataConnect, deleteUserCollectionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userCollection_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userCollection_delete);
});
```

