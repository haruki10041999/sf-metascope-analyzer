import path from 'path';

import type { JsonType } from '../../types';
import { CustomLabelsParser } from './customLabels';
import { FlowParser } from './flow';
import { MetadataFolderParser } from './folder';
import { FlexiPageParser, LayoutParser } from './page';
import {
    MutingPermissionSetParser,
    PermissionSetGroupParser,
    PermissionSetParser,
    ProfileParser,
} from './permission';
import {
    ApexComponentParser,
    ApexPageParser,
    ApprovalProcessParser,
    AuraParser,
    CustomApplicationParser,
    CustomMetadataRecordParser,
    CustomPermissionParser,
    CustomTabParser,
    DashboardParser,
    EmailTemplateParser,
    GlobalValueSetParser,
    GroupParser,
    NamedCredentialParser,
    QueueParser,
    QuickActionParser,
    RemoteSiteSettingParser,
    ReportParser,
    RoleParser,
    SharingRulesParser,
    StandardValueSetParser,
    StaticResourceParser,
    TranslationsParser,
    WorkflowParser,
} from './record';

// フォルダ単位のメタデータの parser の一覧。worker はフォルダ名・保存名の接頭辞から parser を選ぶ

/** どの種類の parser も入る型。種類ごとの型 (PermissionSetParser など) は、それぞれの parser を直接使う */
export type AnyMetadataFolderParser = MetadataFolderParser<string, JsonType<string>>;

/**
 * すべての種類の parser。型は AnyMetadataFolderParser に広げる
 * (種類ごとの parser の型の共用体にすると、map などで「複雑すぎて表現できない共用体型」になるため)
 */
export const METADATA_FOLDER_PARSERS: readonly AnyMetadataFolderParser[] = [
    // A
    PermissionSetParser,
    MutingPermissionSetParser,
    ProfileParser,
    PermissionSetGroupParser,
    CustomLabelsParser,
    FlowParser,
    LayoutParser,
    FlexiPageParser,
    // B
    CustomMetadataRecordParser,
    CustomTabParser,
    CustomApplicationParser,
    GlobalValueSetParser,
    StandardValueSetParser,
    CustomPermissionParser,
    QuickActionParser,
    SharingRulesParser,
    ApexPageParser,
    ApexComponentParser,
    AuraParser,
    // C
    StaticResourceParser,
    EmailTemplateParser,
    ReportParser,
    DashboardParser,
    TranslationsParser,
    NamedCredentialParser,
    RemoteSiteSettingParser,
    WorkflowParser,
    ApprovalProcessParser,
    QueueParser,
    GroupParser,
    RoleParser,
] as AnyMetadataFolderParser[];

/** 保存名の接頭辞 (<種類>_) の一覧。オブジェクトの readSavedObjects が除く */
export const METADATA_FOLDER_SAVE_PREFIXES: string[] = METADATA_FOLDER_PARSERS.map(
    (parser) => parser.prefix,
);

/** フォルダ名 (permissionsets など) の parser */
export const findParserByFolder = (directory: string): AnyMetadataFolderParser | undefined => {
    const name = path.basename(directory);
    return METADATA_FOLDER_PARSERS.find((parser) => parser.spec.folder === name);
};

/** 保存名 (<種類>_<名前>) の parser */
export const findParserBySaveId = (id: string): AnyMetadataFolderParser | undefined =>
    METADATA_FOLDER_PARSERS.find((parser) => id.startsWith(parser.prefix));
