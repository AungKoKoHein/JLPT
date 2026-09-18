# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateSentence, useDeleteSentence, useUpdateSentence, useGetSentence, useListSentences, useCreateTranslation, useDeleteTranslation, useUpdateTranslation, useGetTranslation, useListTranslations } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateSentence(createSentenceVars);

const { data, isPending, isSuccess, isError, error } = useDeleteSentence(deleteSentenceVars);

const { data, isPending, isSuccess, isError, error } = useUpdateSentence(updateSentenceVars);

const { data, isPending, isSuccess, isError, error } = useGetSentence(getSentenceVars);

const { data, isPending, isSuccess, isError, error } = useListSentences();

const { data, isPending, isSuccess, isError, error } = useCreateTranslation(createTranslationVars);

const { data, isPending, isSuccess, isError, error } = useDeleteTranslation(deleteTranslationVars);

const { data, isPending, isSuccess, isError, error } = useUpdateTranslation(updateTranslationVars);

const { data, isPending, isSuccess, isError, error } = useGetTranslation(getTranslationVars);

const { data, isPending, isSuccess, isError, error } = useListTranslations();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createSentence, deleteSentence, updateSentence, getSentence, listSentences, createTranslation, deleteTranslation, updateTranslation, getTranslation, listTranslations } from '@dataconnect/generated';


// Operation CreateSentence:  For variables, look at type CreateSentenceVars in ../index.d.ts
const { data } = await CreateSentence(dataConnect, createSentenceVars);

// Operation DeleteSentence:  For variables, look at type DeleteSentenceVars in ../index.d.ts
const { data } = await DeleteSentence(dataConnect, deleteSentenceVars);

// Operation UpdateSentence:  For variables, look at type UpdateSentenceVars in ../index.d.ts
const { data } = await UpdateSentence(dataConnect, updateSentenceVars);

// Operation GetSentence:  For variables, look at type GetSentenceVars in ../index.d.ts
const { data } = await GetSentence(dataConnect, getSentenceVars);

// Operation ListSentences: 
const { data } = await ListSentences(dataConnect);

// Operation CreateTranslation:  For variables, look at type CreateTranslationVars in ../index.d.ts
const { data } = await CreateTranslation(dataConnect, createTranslationVars);

// Operation DeleteTranslation:  For variables, look at type DeleteTranslationVars in ../index.d.ts
const { data } = await DeleteTranslation(dataConnect, deleteTranslationVars);

// Operation UpdateTranslation:  For variables, look at type UpdateTranslationVars in ../index.d.ts
const { data } = await UpdateTranslation(dataConnect, updateTranslationVars);

// Operation GetTranslation:  For variables, look at type GetTranslationVars in ../index.d.ts
const { data } = await GetTranslation(dataConnect, getTranslationVars);

// Operation ListTranslations: 
const { data } = await ListTranslations(dataConnect);


```