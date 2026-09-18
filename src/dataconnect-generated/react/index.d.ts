import { CreateSentenceData, CreateSentenceVariables, DeleteSentenceData, DeleteSentenceVariables, UpdateSentenceData, UpdateSentenceVariables, GetSentenceData, GetSentenceVariables, ListSentencesData, CreateTranslationData, CreateTranslationVariables, DeleteTranslationData, DeleteTranslationVariables, UpdateTranslationData, UpdateTranslationVariables, GetTranslationData, GetTranslationVariables, ListTranslationsData, CreateTagData, CreateTagVariables, DeleteTagData, DeleteTagVariables, UpdateTagData, UpdateTagVariables, GetTagData, GetTagVariables, ListTagsData, CreateVoteData, CreateVoteVariables, DeleteVoteData, DeleteVoteVariables, UpdateVoteData, UpdateVoteVariables, GetVoteData, GetVoteVariables, ListMyVotesData, CreateUserCollectionData, CreateUserCollectionVariables, DeleteUserCollectionData, DeleteUserCollectionVariables, ListMyCollectionData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateSentence(options?: useDataConnectMutationOptions<CreateSentenceData, FirebaseError, CreateSentenceVariables>): UseDataConnectMutationResult<CreateSentenceData, CreateSentenceVariables>;
export function useCreateSentence(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSentenceData, FirebaseError, CreateSentenceVariables>): UseDataConnectMutationResult<CreateSentenceData, CreateSentenceVariables>;

export function useDeleteSentence(options?: useDataConnectMutationOptions<DeleteSentenceData, FirebaseError, DeleteSentenceVariables>): UseDataConnectMutationResult<DeleteSentenceData, DeleteSentenceVariables>;
export function useDeleteSentence(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteSentenceData, FirebaseError, DeleteSentenceVariables>): UseDataConnectMutationResult<DeleteSentenceData, DeleteSentenceVariables>;

export function useUpdateSentence(options?: useDataConnectMutationOptions<UpdateSentenceData, FirebaseError, UpdateSentenceVariables>): UseDataConnectMutationResult<UpdateSentenceData, UpdateSentenceVariables>;
export function useUpdateSentence(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSentenceData, FirebaseError, UpdateSentenceVariables>): UseDataConnectMutationResult<UpdateSentenceData, UpdateSentenceVariables>;

export function useGetSentence(vars: GetSentenceVariables, options?: useDataConnectQueryOptions<GetSentenceData>): UseDataConnectQueryResult<GetSentenceData, GetSentenceVariables>;
export function useGetSentence(dc: DataConnect, vars: GetSentenceVariables, options?: useDataConnectQueryOptions<GetSentenceData>): UseDataConnectQueryResult<GetSentenceData, GetSentenceVariables>;

export function useListSentences(options?: useDataConnectQueryOptions<ListSentencesData>): UseDataConnectQueryResult<ListSentencesData, undefined>;
export function useListSentences(dc: DataConnect, options?: useDataConnectQueryOptions<ListSentencesData>): UseDataConnectQueryResult<ListSentencesData, undefined>;

export function useCreateTranslation(options?: useDataConnectMutationOptions<CreateTranslationData, FirebaseError, CreateTranslationVariables>): UseDataConnectMutationResult<CreateTranslationData, CreateTranslationVariables>;
export function useCreateTranslation(dc: DataConnect, options?: useDataConnectMutationOptions<CreateTranslationData, FirebaseError, CreateTranslationVariables>): UseDataConnectMutationResult<CreateTranslationData, CreateTranslationVariables>;

export function useDeleteTranslation(options?: useDataConnectMutationOptions<DeleteTranslationData, FirebaseError, DeleteTranslationVariables>): UseDataConnectMutationResult<DeleteTranslationData, DeleteTranslationVariables>;
export function useDeleteTranslation(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteTranslationData, FirebaseError, DeleteTranslationVariables>): UseDataConnectMutationResult<DeleteTranslationData, DeleteTranslationVariables>;

export function useUpdateTranslation(options?: useDataConnectMutationOptions<UpdateTranslationData, FirebaseError, UpdateTranslationVariables>): UseDataConnectMutationResult<UpdateTranslationData, UpdateTranslationVariables>;
export function useUpdateTranslation(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateTranslationData, FirebaseError, UpdateTranslationVariables>): UseDataConnectMutationResult<UpdateTranslationData, UpdateTranslationVariables>;

export function useGetTranslation(vars: GetTranslationVariables, options?: useDataConnectQueryOptions<GetTranslationData>): UseDataConnectQueryResult<GetTranslationData, GetTranslationVariables>;
export function useGetTranslation(dc: DataConnect, vars: GetTranslationVariables, options?: useDataConnectQueryOptions<GetTranslationData>): UseDataConnectQueryResult<GetTranslationData, GetTranslationVariables>;

export function useListTranslations(options?: useDataConnectQueryOptions<ListTranslationsData>): UseDataConnectQueryResult<ListTranslationsData, undefined>;
export function useListTranslations(dc: DataConnect, options?: useDataConnectQueryOptions<ListTranslationsData>): UseDataConnectQueryResult<ListTranslationsData, undefined>;

export function useCreateTag(options?: useDataConnectMutationOptions<CreateTagData, FirebaseError, CreateTagVariables>): UseDataConnectMutationResult<CreateTagData, CreateTagVariables>;
export function useCreateTag(dc: DataConnect, options?: useDataConnectMutationOptions<CreateTagData, FirebaseError, CreateTagVariables>): UseDataConnectMutationResult<CreateTagData, CreateTagVariables>;

export function useDeleteTag(options?: useDataConnectMutationOptions<DeleteTagData, FirebaseError, DeleteTagVariables>): UseDataConnectMutationResult<DeleteTagData, DeleteTagVariables>;
export function useDeleteTag(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteTagData, FirebaseError, DeleteTagVariables>): UseDataConnectMutationResult<DeleteTagData, DeleteTagVariables>;

export function useUpdateTag(options?: useDataConnectMutationOptions<UpdateTagData, FirebaseError, UpdateTagVariables>): UseDataConnectMutationResult<UpdateTagData, UpdateTagVariables>;
export function useUpdateTag(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateTagData, FirebaseError, UpdateTagVariables>): UseDataConnectMutationResult<UpdateTagData, UpdateTagVariables>;

export function useGetTag(vars: GetTagVariables, options?: useDataConnectQueryOptions<GetTagData>): UseDataConnectQueryResult<GetTagData, GetTagVariables>;
export function useGetTag(dc: DataConnect, vars: GetTagVariables, options?: useDataConnectQueryOptions<GetTagData>): UseDataConnectQueryResult<GetTagData, GetTagVariables>;

export function useListTags(options?: useDataConnectQueryOptions<ListTagsData>): UseDataConnectQueryResult<ListTagsData, undefined>;
export function useListTags(dc: DataConnect, options?: useDataConnectQueryOptions<ListTagsData>): UseDataConnectQueryResult<ListTagsData, undefined>;

export function useCreateVote(options?: useDataConnectMutationOptions<CreateVoteData, FirebaseError, CreateVoteVariables>): UseDataConnectMutationResult<CreateVoteData, CreateVoteVariables>;
export function useCreateVote(dc: DataConnect, options?: useDataConnectMutationOptions<CreateVoteData, FirebaseError, CreateVoteVariables>): UseDataConnectMutationResult<CreateVoteData, CreateVoteVariables>;

export function useDeleteVote(options?: useDataConnectMutationOptions<DeleteVoteData, FirebaseError, DeleteVoteVariables>): UseDataConnectMutationResult<DeleteVoteData, DeleteVoteVariables>;
export function useDeleteVote(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteVoteData, FirebaseError, DeleteVoteVariables>): UseDataConnectMutationResult<DeleteVoteData, DeleteVoteVariables>;

export function useUpdateVote(options?: useDataConnectMutationOptions<UpdateVoteData, FirebaseError, UpdateVoteVariables>): UseDataConnectMutationResult<UpdateVoteData, UpdateVoteVariables>;
export function useUpdateVote(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateVoteData, FirebaseError, UpdateVoteVariables>): UseDataConnectMutationResult<UpdateVoteData, UpdateVoteVariables>;

export function useGetVote(vars: GetVoteVariables, options?: useDataConnectQueryOptions<GetVoteData>): UseDataConnectQueryResult<GetVoteData, GetVoteVariables>;
export function useGetVote(dc: DataConnect, vars: GetVoteVariables, options?: useDataConnectQueryOptions<GetVoteData>): UseDataConnectQueryResult<GetVoteData, GetVoteVariables>;

export function useListMyVotes(options?: useDataConnectQueryOptions<ListMyVotesData>): UseDataConnectQueryResult<ListMyVotesData, undefined>;
export function useListMyVotes(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyVotesData>): UseDataConnectQueryResult<ListMyVotesData, undefined>;

export function useCreateUserCollection(options?: useDataConnectMutationOptions<CreateUserCollectionData, FirebaseError, CreateUserCollectionVariables>): UseDataConnectMutationResult<CreateUserCollectionData, CreateUserCollectionVariables>;
export function useCreateUserCollection(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserCollectionData, FirebaseError, CreateUserCollectionVariables>): UseDataConnectMutationResult<CreateUserCollectionData, CreateUserCollectionVariables>;

export function useDeleteUserCollection(options?: useDataConnectMutationOptions<DeleteUserCollectionData, FirebaseError, DeleteUserCollectionVariables>): UseDataConnectMutationResult<DeleteUserCollectionData, DeleteUserCollectionVariables>;
export function useDeleteUserCollection(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserCollectionData, FirebaseError, DeleteUserCollectionVariables>): UseDataConnectMutationResult<DeleteUserCollectionData, DeleteUserCollectionVariables>;

export function useListMyCollection(options?: useDataConnectQueryOptions<ListMyCollectionData>): UseDataConnectQueryResult<ListMyCollectionData, undefined>;
export function useListMyCollection(dc: DataConnect, options?: useDataConnectQueryOptions<ListMyCollectionData>): UseDataConnectQueryResult<ListMyCollectionData, undefined>;
