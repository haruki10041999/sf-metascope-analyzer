import {
    makeMutingPermissionSetJson,
    makePermissionSetGroupJson,
    makePermissionSetJson,
    makeProfileJson,
} from '../../types';
import { MetadataFolderParser, type MetadataFileParseResult } from './folder';

// 権限の parser。方針: docs/metadata-a-plan.md 3・4 章

export const PermissionSetParser = new MetadataFolderParser({
    type: 'permissionSet',
    folder: 'permissionsets',
    suffix: '.permissionset-meta.xml',
    make: makePermissionSetJson,
});

export const MutingPermissionSetParser = new MetadataFolderParser({
    type: 'mutingPermissionSet',
    folder: 'mutingpermissionsets',
    suffix: '.mutingpermissionset-meta.xml',
    make: makeMutingPermissionSetJson,
});

export const ProfileParser = new MetadataFolderParser({
    type: 'profile',
    folder: 'profiles',
    suffix: '.profile-meta.xml',
    make: makeProfileJson,
});

export const PermissionSetGroupParser = new MetadataFolderParser({
    type: 'permissionSetGroup',
    folder: 'permissionsetgroups',
    suffix: '.permissionsetgroup-meta.xml',
    make: makePermissionSetGroupJson,
});

/** 解析結果の型 (parser ごと) */
export type ParseResultOf<P> =
    P extends MetadataFolderParser<infer T, infer J> ? MetadataFileParseResult<T, J> : never;

export type PermissionSetParseResult = ParseResultOf<typeof PermissionSetParser>;
export type MutingPermissionSetParseResult = ParseResultOf<typeof MutingPermissionSetParser>;
export type ProfileParseResult = ParseResultOf<typeof ProfileParser>;
export type PermissionSetGroupParseResult = ParseResultOf<typeof PermissionSetGroupParser>;
