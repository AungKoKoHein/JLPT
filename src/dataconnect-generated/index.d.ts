import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateSentenceData {
  sentence_insert: Sentence_Key;
}

export interface CreateSentenceVariables {
  englishText: string;
  contextDescription?: string | null;
}

export interface CreateTagData {
  tag_insert: Tag_Key;
}

export interface CreateTagVariables {
  name: string;
}

export interface CreateTranslationData {
  translation_insert: Translation_Key;
}

export interface CreateTranslationVariables {
  myanmarText: string;
  scriptType: string;
  sentenceId: UUIDString;
}

export interface CreateUserCollectionData {
  userCollection_insert: UserCollection_Key;
}

export interface CreateUserCollectionVariables {
  sentenceId: UUIDString;
}

export interface CreateVoteData {
  vote_insert: Vote_Key;
}

export interface CreateVoteVariables {
  value: number;
  translationId: UUIDString;
}

export interface DeleteSentenceData {
  sentence_delete?: Sentence_Key | null;
}

export interface DeleteSentenceVariables {
  id: UUIDString;
}

export interface DeleteTagData {
  tag_delete?: Tag_Key | null;
}

export interface DeleteTagVariables {
  id: UUIDString;
}

export interface DeleteTranslationData {
  translation_delete?: Translation_Key | null;
}

export interface DeleteTranslationVariables {
  id: UUIDString;
}

export interface DeleteUserCollectionData {
  userCollection_delete?: UserCollection_Key | null;
}

export interface DeleteUserCollectionVariables {
  id: UUIDString;
}

export interface DeleteVoteData {
  vote_delete?: Vote_Key | null;
}

export interface DeleteVoteVariables {
  id: UUIDString;
}

export interface GetSentenceData {
  sentence?: {
    englishText: string;
    createdAt: TimestampString;
    creator: {
      username: string;
    };
  };
}

export interface GetSentenceVariables {
  id: UUIDString;
}

export interface GetTagData {
  tag?: {
    name: string;
  };
}

export interface GetTagVariables {
  id: UUIDString;
}

export interface GetTranslationData {
  translation?: {
    myanmarText: string;
    phoneticTransliteration?: string | null;
  };
}

export interface GetTranslationVariables {
  id: UUIDString;
}

export interface GetVoteData {
  vote?: {
    value: number;
    translation: {
      myanmarText: string;
    };
  };
}

export interface GetVoteVariables {
  id: UUIDString;
}

export interface ListMyCollectionData {
  userCollections: ({
    sentence: {
      englishText: string;
    };
  })[];
}

export interface ListMyVotesData {
  votes: ({
    value: number;
    translation: {
      myanmarText: string;
    };
  })[];
}

export interface ListSentencesData {
  sentences: ({
    englishText: string;
    createdAt: TimestampString;
  })[];
}

export interface ListTagsData {
  tags: ({
    name: string;
  })[];
}

export interface ListTranslationsData {
  translations: ({
    myanmarText: string;
  })[];
}

export interface SentenceTag_Key {
  sentenceId: UUIDString;
  tagId: UUIDString;
  __typename?: 'SentenceTag_Key';
}

export interface Sentence_Key {
  id: UUIDString;
  __typename?: 'Sentence_Key';
}

export interface Tag_Key {
  id: UUIDString;
  __typename?: 'Tag_Key';
}

export interface Translation_Key {
  id: UUIDString;
  __typename?: 'Translation_Key';
}

export interface UpdateSentenceData {
  sentence_update?: Sentence_Key | null;
}

export interface UpdateSentenceVariables {
  id: UUIDString;
  contextDescription?: string | null;
}

export interface UpdateTagData {
  tag_update?: Tag_Key | null;
}

export interface UpdateTagVariables {
  id: UUIDString;
  name: string;
}

export interface UpdateTranslationData {
  translation_update?: Translation_Key | null;
}

export interface UpdateTranslationVariables {
  id: UUIDString;
  phoneticTransliteration?: string | null;
}

export interface UpdateVoteData {
  vote_update?: Vote_Key | null;
}

export interface UpdateVoteVariables {
  id: UUIDString;
  value: number;
}

export interface UserCollection_Key {
  id: UUIDString;
  __typename?: 'UserCollection_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface Vote_Key {
  id: UUIDString;
  __typename?: 'Vote_Key';
}

interface CreateSentenceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSentenceVariables): MutationRef<CreateSentenceData, CreateSentenceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSentenceVariables): MutationRef<CreateSentenceData, CreateSentenceVariables>;
  operationName: string;
}
export const createSentenceRef: CreateSentenceRef;

export function createSentence(vars: CreateSentenceVariables): MutationPromise<CreateSentenceData, CreateSentenceVariables>;
export function createSentence(dc: DataConnect, vars: CreateSentenceVariables): MutationPromise<CreateSentenceData, CreateSentenceVariables>;

interface DeleteSentenceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSentenceVariables): MutationRef<DeleteSentenceData, DeleteSentenceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteSentenceVariables): MutationRef<DeleteSentenceData, DeleteSentenceVariables>;
  operationName: string;
}
export const deleteSentenceRef: DeleteSentenceRef;

export function deleteSentence(vars: DeleteSentenceVariables): MutationPromise<DeleteSentenceData, DeleteSentenceVariables>;
export function deleteSentence(dc: DataConnect, vars: DeleteSentenceVariables): MutationPromise<DeleteSentenceData, DeleteSentenceVariables>;

interface UpdateSentenceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateSentenceVariables): MutationRef<UpdateSentenceData, UpdateSentenceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateSentenceVariables): MutationRef<UpdateSentenceData, UpdateSentenceVariables>;
  operationName: string;
}
export const updateSentenceRef: UpdateSentenceRef;

export function updateSentence(vars: UpdateSentenceVariables): MutationPromise<UpdateSentenceData, UpdateSentenceVariables>;
export function updateSentence(dc: DataConnect, vars: UpdateSentenceVariables): MutationPromise<UpdateSentenceData, UpdateSentenceVariables>;

interface GetSentenceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetSentenceVariables): QueryRef<GetSentenceData, GetSentenceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetSentenceVariables): QueryRef<GetSentenceData, GetSentenceVariables>;
  operationName: string;
}
export const getSentenceRef: GetSentenceRef;

export function getSentence(vars: GetSentenceVariables, options?: ExecuteQueryOptions): QueryPromise<GetSentenceData, GetSentenceVariables>;
export function getSentence(dc: DataConnect, vars: GetSentenceVariables, options?: ExecuteQueryOptions): QueryPromise<GetSentenceData, GetSentenceVariables>;

interface ListSentencesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSentencesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListSentencesData, undefined>;
  operationName: string;
}
export const listSentencesRef: ListSentencesRef;

export function listSentences(options?: ExecuteQueryOptions): QueryPromise<ListSentencesData, undefined>;
export function listSentences(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSentencesData, undefined>;

interface CreateTranslationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTranslationVariables): MutationRef<CreateTranslationData, CreateTranslationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTranslationVariables): MutationRef<CreateTranslationData, CreateTranslationVariables>;
  operationName: string;
}
export const createTranslationRef: CreateTranslationRef;

export function createTranslation(vars: CreateTranslationVariables): MutationPromise<CreateTranslationData, CreateTranslationVariables>;
export function createTranslation(dc: DataConnect, vars: CreateTranslationVariables): MutationPromise<CreateTranslationData, CreateTranslationVariables>;

interface DeleteTranslationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTranslationVariables): MutationRef<DeleteTranslationData, DeleteTranslationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteTranslationVariables): MutationRef<DeleteTranslationData, DeleteTranslationVariables>;
  operationName: string;
}
export const deleteTranslationRef: DeleteTranslationRef;

export function deleteTranslation(vars: DeleteTranslationVariables): MutationPromise<DeleteTranslationData, DeleteTranslationVariables>;
export function deleteTranslation(dc: DataConnect, vars: DeleteTranslationVariables): MutationPromise<DeleteTranslationData, DeleteTranslationVariables>;

interface UpdateTranslationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTranslationVariables): MutationRef<UpdateTranslationData, UpdateTranslationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTranslationVariables): MutationRef<UpdateTranslationData, UpdateTranslationVariables>;
  operationName: string;
}
export const updateTranslationRef: UpdateTranslationRef;

export function updateTranslation(vars: UpdateTranslationVariables): MutationPromise<UpdateTranslationData, UpdateTranslationVariables>;
export function updateTranslation(dc: DataConnect, vars: UpdateTranslationVariables): MutationPromise<UpdateTranslationData, UpdateTranslationVariables>;

interface GetTranslationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTranslationVariables): QueryRef<GetTranslationData, GetTranslationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetTranslationVariables): QueryRef<GetTranslationData, GetTranslationVariables>;
  operationName: string;
}
export const getTranslationRef: GetTranslationRef;

export function getTranslation(vars: GetTranslationVariables, options?: ExecuteQueryOptions): QueryPromise<GetTranslationData, GetTranslationVariables>;
export function getTranslation(dc: DataConnect, vars: GetTranslationVariables, options?: ExecuteQueryOptions): QueryPromise<GetTranslationData, GetTranslationVariables>;

interface ListTranslationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTranslationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListTranslationsData, undefined>;
  operationName: string;
}
export const listTranslationsRef: ListTranslationsRef;

export function listTranslations(options?: ExecuteQueryOptions): QueryPromise<ListTranslationsData, undefined>;
export function listTranslations(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTranslationsData, undefined>;

interface CreateTagRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateTagVariables): MutationRef<CreateTagData, CreateTagVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateTagVariables): MutationRef<CreateTagData, CreateTagVariables>;
  operationName: string;
}
export const createTagRef: CreateTagRef;

export function createTag(vars: CreateTagVariables): MutationPromise<CreateTagData, CreateTagVariables>;
export function createTag(dc: DataConnect, vars: CreateTagVariables): MutationPromise<CreateTagData, CreateTagVariables>;

interface DeleteTagRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteTagVariables): MutationRef<DeleteTagData, DeleteTagVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteTagVariables): MutationRef<DeleteTagData, DeleteTagVariables>;
  operationName: string;
}
export const deleteTagRef: DeleteTagRef;

export function deleteTag(vars: DeleteTagVariables): MutationPromise<DeleteTagData, DeleteTagVariables>;
export function deleteTag(dc: DataConnect, vars: DeleteTagVariables): MutationPromise<DeleteTagData, DeleteTagVariables>;

interface UpdateTagRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateTagVariables): MutationRef<UpdateTagData, UpdateTagVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateTagVariables): MutationRef<UpdateTagData, UpdateTagVariables>;
  operationName: string;
}
export const updateTagRef: UpdateTagRef;

export function updateTag(vars: UpdateTagVariables): MutationPromise<UpdateTagData, UpdateTagVariables>;
export function updateTag(dc: DataConnect, vars: UpdateTagVariables): MutationPromise<UpdateTagData, UpdateTagVariables>;

interface GetTagRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetTagVariables): QueryRef<GetTagData, GetTagVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetTagVariables): QueryRef<GetTagData, GetTagVariables>;
  operationName: string;
}
export const getTagRef: GetTagRef;

export function getTag(vars: GetTagVariables, options?: ExecuteQueryOptions): QueryPromise<GetTagData, GetTagVariables>;
export function getTag(dc: DataConnect, vars: GetTagVariables, options?: ExecuteQueryOptions): QueryPromise<GetTagData, GetTagVariables>;

interface ListTagsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListTagsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListTagsData, undefined>;
  operationName: string;
}
export const listTagsRef: ListTagsRef;

export function listTags(options?: ExecuteQueryOptions): QueryPromise<ListTagsData, undefined>;
export function listTags(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListTagsData, undefined>;

interface CreateVoteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateVoteVariables): MutationRef<CreateVoteData, CreateVoteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateVoteVariables): MutationRef<CreateVoteData, CreateVoteVariables>;
  operationName: string;
}
export const createVoteRef: CreateVoteRef;

export function createVote(vars: CreateVoteVariables): MutationPromise<CreateVoteData, CreateVoteVariables>;
export function createVote(dc: DataConnect, vars: CreateVoteVariables): MutationPromise<CreateVoteData, CreateVoteVariables>;

interface DeleteVoteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteVoteVariables): MutationRef<DeleteVoteData, DeleteVoteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteVoteVariables): MutationRef<DeleteVoteData, DeleteVoteVariables>;
  operationName: string;
}
export const deleteVoteRef: DeleteVoteRef;

export function deleteVote(vars: DeleteVoteVariables): MutationPromise<DeleteVoteData, DeleteVoteVariables>;
export function deleteVote(dc: DataConnect, vars: DeleteVoteVariables): MutationPromise<DeleteVoteData, DeleteVoteVariables>;

interface UpdateVoteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateVoteVariables): MutationRef<UpdateVoteData, UpdateVoteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateVoteVariables): MutationRef<UpdateVoteData, UpdateVoteVariables>;
  operationName: string;
}
export const updateVoteRef: UpdateVoteRef;

export function updateVote(vars: UpdateVoteVariables): MutationPromise<UpdateVoteData, UpdateVoteVariables>;
export function updateVote(dc: DataConnect, vars: UpdateVoteVariables): MutationPromise<UpdateVoteData, UpdateVoteVariables>;

interface GetVoteRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetVoteVariables): QueryRef<GetVoteData, GetVoteVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetVoteVariables): QueryRef<GetVoteData, GetVoteVariables>;
  operationName: string;
}
export const getVoteRef: GetVoteRef;

export function getVote(vars: GetVoteVariables, options?: ExecuteQueryOptions): QueryPromise<GetVoteData, GetVoteVariables>;
export function getVote(dc: DataConnect, vars: GetVoteVariables, options?: ExecuteQueryOptions): QueryPromise<GetVoteData, GetVoteVariables>;

interface ListMyVotesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyVotesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyVotesData, undefined>;
  operationName: string;
}
export const listMyVotesRef: ListMyVotesRef;

export function listMyVotes(options?: ExecuteQueryOptions): QueryPromise<ListMyVotesData, undefined>;
export function listMyVotes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyVotesData, undefined>;

interface CreateUserCollectionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserCollectionVariables): MutationRef<CreateUserCollectionData, CreateUserCollectionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserCollectionVariables): MutationRef<CreateUserCollectionData, CreateUserCollectionVariables>;
  operationName: string;
}
export const createUserCollectionRef: CreateUserCollectionRef;

export function createUserCollection(vars: CreateUserCollectionVariables): MutationPromise<CreateUserCollectionData, CreateUserCollectionVariables>;
export function createUserCollection(dc: DataConnect, vars: CreateUserCollectionVariables): MutationPromise<CreateUserCollectionData, CreateUserCollectionVariables>;

interface DeleteUserCollectionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteUserCollectionVariables): MutationRef<DeleteUserCollectionData, DeleteUserCollectionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteUserCollectionVariables): MutationRef<DeleteUserCollectionData, DeleteUserCollectionVariables>;
  operationName: string;
}
export const deleteUserCollectionRef: DeleteUserCollectionRef;

export function deleteUserCollection(vars: DeleteUserCollectionVariables): MutationPromise<DeleteUserCollectionData, DeleteUserCollectionVariables>;
export function deleteUserCollection(dc: DataConnect, vars: DeleteUserCollectionVariables): MutationPromise<DeleteUserCollectionData, DeleteUserCollectionVariables>;

interface ListMyCollectionRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyCollectionData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMyCollectionData, undefined>;
  operationName: string;
}
export const listMyCollectionRef: ListMyCollectionRef;

export function listMyCollection(options?: ExecuteQueryOptions): QueryPromise<ListMyCollectionData, undefined>;
export function listMyCollection(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyCollectionData, undefined>;

