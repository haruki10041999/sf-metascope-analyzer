import {
    makeMutingPermissionSetJson,
    makePermissionSetGroupJson,
    makePermissionSetJson,
    makeProfileJson,
} from '../../types';
import { MetadataFolderParser, type MetadataFileParseResult } from './folder';

// 権限の parser。方針: docs/metadata-implementation.md 10 章

export const PermissionSetParser = new MetadataFolderParser({
    type: 'permissionSet',
    folder: 'permissionsets',
    suffix: '.permissionset-meta.xml',
    // decomposePermissionSetBeta2: permissionsets/<名前>/ の下に <名前>.permissionset-meta.xml と、
    // objectSettings/<オブジェクト>.objectSettings-meta.xml・<名前>.<種類>-meta.xml (ルートは PermissionSet)
    decomposed: { unit: 'folder', root: 'PermissionSet', children: { '-meta.xml': undefined } },
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
