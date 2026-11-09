import type { ApexUnitParseResult } from '../parser/Apex/unit';
import type { LwcBundleParseResult } from '../parser/Lwc/parser';
import type { CustomLabelsParseResult } from '../parser/Metadata/customLabels';
import type { FlowParseResult } from '../parser/Metadata/flow';
import type { MetadataFileParseResult } from '../parser/Metadata/folder';
import type { FlexiPageParseResult, LayoutParseResult } from '../parser/Metadata/page';
import type { ObjectParseResult } from '../parser/Metadata/parser';
import type {
    MutingPermissionSetParseResult,
    PermissionSetGroupParseResult,
    PermissionSetParseResult,
    ProfileParseResult,
} from '../parser/Metadata/permission';
import type { Repository } from '../unit/repository';

import type { MetadataSnapshot, ReportInput, SnapshotInput } from './types';

// Repository (単位の種類 → 解析結果) を、種類ごとの provider が使う MetadataSnapshot にする

/** MetadataSnapshot の名前を持つ種類 (ほかのフォルダ単位の種類は others) */
const NAMED_TYPES = new Set([
    'apexClass',
    'apexTrigger',
    'anonymousApex',
    'lwc',
    'object',
    'objectTranslation',
    'permissionSet',
    'mutingPermissionSet',
    'profile',
    'permissionSetGroup',
    'customLabels',
    'flow',
    'layout',
    'flexiPage',
]);

const snapshots = new WeakMap<Repository, MetadataSnapshot>();

/** リポジトリの MetadataSnapshot (同じリポジトリには、作ったものを使い回す) */
export const snapshotOf = (repository: Repository): MetadataSnapshot => {
    const cached = snapshots.get(repository);
    if (cached) return cached;
    const get = <T>(type: string) => repository.get(type) as unknown as T[];
    const snapshot: MetadataSnapshot = {
        permissionSets: get<PermissionSetParseResult>('permissionSet'),
        mutingPermissionSets: get<MutingPermissionSetParseResult>('mutingPermissionSet'),
        profiles: get<ProfileParseResult>('profile'),
        permissionSetGroups: get<PermissionSetGroupParseResult>('permissionSetGroup'),
        customLabels: get<CustomLabelsParseResult>('customLabels'),
        flows: get<FlowParseResult>('flow'),
        layouts: get<LayoutParseResult>('layout'),
        flexiPages: get<FlexiPageParseResult>('flexiPage'),
        others: repository
            .entries()
            .filter(([type]) => !NAMED_TYPES.has(type))
            .flatMap(([, results]) => results as unknown as MetadataFileParseResult[]),
        objects: get<ObjectParseResult>('object'),
        apex: [
            ...get<ApexUnitParseResult>('apexClass'),
            ...get<ApexUnitParseResult>('apexTrigger'),
            ...get<ApexUnitParseResult>('anonymousApex'),
        ],
        lwc: get<LwcBundleParseResult>('lwc'),
    };
    snapshots.set(repository, snapshot);
    return snapshot;
};

/** provider の入力 (Repository) を、種類ごとの provider の入力にする */
export const snapshotInputOf = (input: ReportInput): SnapshotInput => ({
    ...(input.before ? { before: snapshotOf(input.before) } : {}),
    after: snapshotOf(input.after),
});
