import type {
    CustomLabelsJson,
    CustomObjectJson,
    CustomObjectTranslationJson,
    FlexiPageJson,
    FlowJson,
    LayoutJson,
    LwcBundleJson,
    MutingPermissionSetJson,
    PermissionSetGroupJson,
    PermissionSetJson,
    ProfileJson,
} from '../types';
import type { ApexUnitJson } from './Apex/unit';

// 解析結果の中身 (result.base) の型を、解析結果の種類 (dataType) から引く (docs/plan.md 10 章 P2「解析の結果の
// base: unknown」)。解析結果の共通の形 (IdParseResult) は種類をまたぐので base が unknown になる。種類ごとの型への
// 変換はここに集め、使う側はキャストを書かない。表にない種類は、使うようになったら足す

/** 解析結果の種類 (dataType) → 中身 (result.base) の JSON の型 */
export type UnitBaseJsonMap = {
    apexUnit: ApexUnitJson;
    lwcBundle: LwcBundleJson;
    object: CustomObjectJson;
    objectTranslation: CustomObjectTranslationJson;
    flow: FlowJson;
    customLabels: CustomLabelsJson;
    layout: LayoutJson;
    flexiPage: FlexiPageJson;
    permissionSet: PermissionSetJson;
    mutingPermissionSet: MutingPermissionSetJson;
    profile: ProfileJson;
    permissionSetGroup: PermissionSetGroupJson;
};

export type UnitBaseType = keyof UnitBaseJsonMap;

/** 中身を持つ解析結果 (IdParseResult・各種類の ParseResult の共通の部分) */
type WithBase = { dataType: string; result: { base: unknown } };

/** 解析結果が dataType の種類か (読めなかった解析結果 (dataType: 'error') は違う) */
export const isUnitOfType = <K extends UnitBaseType>(
    result: WithBase,
    dataType: K,
): result is WithBase & { dataType: K; result: { base: UnitBaseJsonMap[K] } } =>
    result.dataType === dataType;

/** 解析結果の中身 (dataType の種類でなければ undefined) */
export const unitBaseOf = <K extends UnitBaseType>(
    result: WithBase,
    dataType: K,
): UnitBaseJsonMap[K] | undefined =>
    result.dataType === dataType ? (result.result.base as UnitBaseJsonMap[K]) : undefined;
