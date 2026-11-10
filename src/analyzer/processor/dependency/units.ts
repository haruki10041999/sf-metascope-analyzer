import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { LwcBundleParseResult } from '../../parser/Lwc/parser';
import type { MetadataFileParseResult } from '../../parser/Metadata/folder';
import type { ObjectParseResult } from '../../parser/Metadata/parser';
import type { ConvertKeys } from '../../types';
import { extractMetadataReferences } from '../Metadata/referenceAnalysis';

import { getApexDependencies } from './apex';
import { type FormulaReference, getFormulaReferences } from './formula';
import type { DependencyKind, UnitDefinition, UnitDependencies, UnitReference } from './types';

// 単位の種類ごとの定義と参照 (Apex は apex.ts)。どれも UnitDependencies の形にする。方針: docs/analysis-plan.md 3 章

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const keysOf = (node: unknown): ConvertKeys | undefined =>
    isRecord(node) && isRecord(node.sourceKeys) ? (node.sourceKeys as ConvertKeys) : undefined;

const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const rows = (json: Json, name: string): Json[] =>
    Array.isArray(json[name]) ? (json[name] as unknown[]).filter(isRecord) : [];

const reference = (
    refType: string,
    target: string,
    kind: DependencyKind,
    via: string,
    site: {
        member?: string | undefined;
        statement?: ConvertKeys | undefined;
        expression?: ConvertKeys | undefined;
    } = {},
): UnitReference => ({
    refType,
    target,
    kind,
    via,
    from: {
        ...(site.member ? { member: site.member } : {}),
        ...(site.statement ? { statement: site.statement } : {}),
        ...(site.expression ? { expression: site.expression } : {}),
    },
});

/** 数式の参照を UnitReference にする */
const formulaReferences = (
    formula: string | undefined,
    object: string | undefined,
    via: string,
    site: { member?: string | undefined; statement?: ConvertKeys | undefined },
): UnitReference[] =>
    formula
        ? getFormulaReferences(formula, object).map((r: FormulaReference) => {
              switch (r.refType) {
                  case 'field':
                      return reference('field', `${r.object}.${r.field}`, 'reads', via, site);
                  case 'object':
                      return reference('object', r.name, 'reads', via, site);
                  default:
                      return reference(r.refType, r.name, 'uses', via, site);
              }
          })
        : [];

// ---------------------------------------------------------------------------
// オブジェクト
// ---------------------------------------------------------------------------

/** オブジェクトの単位の定義と参照 (項目・入力規則などの子は <オブジェクト>.<名前>) */
export const getObjectUnitDependencies = (unit: ObjectParseResult): UnitDependencies => {
    const definitions: UnitDefinition[] = [];
    const references: UnitReference[] = [];
    if (unit.dataType !== 'object') return { definitions, references };
    const object = unit.result.base as unknown as Json;
    const apiName = String(object.apiName);
    const def = (defType: string, name: string, node?: unknown) => {
        const sourceKeys = keysOf(node);
        definitions.push({ defType, name, ...(sourceKeys ? { sourceKeys } : {}) });
    };
    def('object', apiName, object);

    for (const field of rows(object, 'fields')) {
        if (field.kind !== 'field') continue;
        const name = `${apiName}.${String(field.apiName)}`;
        def('field', name, field);
        const site = { member: name, statement: keysOf(field) };
        if (str(field.referenceTo)) {
            references.push(
                reference('object', field.referenceTo as string, 'uses', 'referenceTo', site),
            );
        }
        references.push(...formulaReferences(str(field.formula), apiName, 'formula', site));
        references.push(
            ...formulaReferences(str(field.defaultValue), apiName, 'defaultValue', site),
        );
        // 積み上げ集計: 子のオブジェクトの項目 (Child__c.Amount__c) と、子の参照項目
        const summarized = str(field.summarizedField);
        if (summarized)
            references.push(reference('field', summarized, 'reads', 'summarizedField', site));
        const foreignKey = str(field.summaryForeignKey);
        if (foreignKey) {
            references.push(reference('field', foreignKey, 'reads', 'summaryForeignKey', site));
            references.push(
                reference('object', foreignKey.split('.')[0]!, 'reads', 'summaryForeignKey', site),
            );
        }
        const valueSet = isRecord(field.valueSet) ? field.valueSet : undefined;
        if (str(valueSet?.controllingField)) {
            references.push(
                reference(
                    'field',
                    `${apiName}.${valueSet!.controllingField as string}`,
                    'reads',
                    'controllingField',
                    site,
                ),
            );
        }
        if (str(valueSet?.valueSetName)) {
            references.push(
                reference(
                    'globalValueSet',
                    valueSet!.valueSetName as string,
                    'uses',
                    'valueSet',
                    site,
                ),
            );
        }
        // 絞り込み条件: 項目は <オブジェクト>.<項目> か $Source.<項目> (参照元のレコード)
        const lookupFilter = isRecord(field.lookupFilter) ? field.lookupFilter : undefined;
        for (const item of lookupFilter ? rows(lookupFilter, 'filterItems') : []) {
            for (const path of [str(item.field), str(item.valueField)]) {
                if (!path) continue;
                const [head, ...rest] = path.split('.');
                if (!head || rest.length === 0) continue;
                const target =
                    head.toLowerCase() === '$source' ? `${apiName}.${rest.join('.')}` : path;
                references.push(reference('field', target, 'reads', 'lookupFilter', site));
            }
        }
    }

    for (const rule of rows(object, 'validationRules')) {
        if (rule.kind !== 'validationRule') continue;
        const name = `${apiName}.${String(rule.fullName)}`;
        def('validationRule', name, rule);
        references.push(
            ...formulaReferences(
                str(rule.errorConditionFormula),
                apiName,
                'errorConditionFormula',
                {
                    member: name,
                    statement: keysOf(rule),
                } as { member: string; statement: ConvertKeys },
            ),
        );
        if (str(rule.errorDisplayField)) {
            references.push(
                reference(
                    'field',
                    `${apiName}.${rule.errorDisplayField as string}`,
                    'uses',
                    'errorDisplayField',
                    {
                        member: name,
                        statement: keysOf(rule),
                    },
                ),
            );
        }
    }

    const memberDefs: [string, string][] = [
        ['recordTypes', 'recordType'],
        ['listViews', 'listView'],
        ['fieldSets', 'fieldSet'],
        ['compactLayouts', 'compactLayout'],
        ['webLinks', 'webLink'],
        ['businessProcesses', 'businessProcess'],
        ['sharingReasons', 'sharingReason'],
    ];
    for (const [key, defType] of memberDefs) {
        for (const member of rows(object, key)) {
            const name = `${apiName}.${String(member.fullName)}`;
            def(defType, name, member);
            const site = { member: name, statement: keysOf(member) };
            const fieldRef = (field: string | undefined, via: string) => {
                if (field)
                    references.push(
                        reference(
                            'field',
                            field.includes('.') ? field : `${apiName}.${field}`,
                            'uses',
                            via,
                            site,
                        ),
                    );
            };
            for (const item of rows(member, 'displayedFields'))
                fieldRef(str(item.field), 'fieldSet.displayedFields');
            for (const field of Array.isArray(member.fields) ? member.fields : [])
                fieldRef(str(field), `${key}.fields`);
            for (const column of Array.isArray(member.columns) ? member.columns : [])
                fieldRef(str(column), 'listView.columns');
            for (const filter of rows(member, 'filters'))
                fieldRef(str(filter.field), 'listView.filters');
        }
    }
    return { definitions, references };
};

// ---------------------------------------------------------------------------
// LWC
// ---------------------------------------------------------------------------

const LWC_IMPORTS: {
    pattern: RegExp;
    refType: string;
    kind: DependencyKind;
    target: (m: RegExpMatchArray) => string;
}[] = [
    {
        pattern: /^@salesforce\/apex\/([\w.]+)$/,
        refType: 'apexMethod',
        kind: 'calls',
        target: (m) => m[1]!,
    },
    {
        pattern: /^@salesforce\/schema\/(\w+)\.([\w.]+)$/,
        refType: 'field',
        kind: 'uses',
        target: (m) => `${m[1]}.${m[2]!.split('.')[0]}`,
    },
    {
        pattern: /^@salesforce\/schema\/(\w+)$/,
        refType: 'object',
        kind: 'uses',
        target: (m) => m[1]!,
    },
    {
        pattern: /^@salesforce\/label\/c\.(\w+)$/,
        refType: 'customLabel',
        kind: 'uses',
        target: (m) => m[1]!,
    },
    {
        pattern: /^@salesforce\/customPermission\/(\w+)$/,
        refType: 'customPermission',
        kind: 'uses',
        target: (m) => m[1]!,
    },
    {
        pattern: /^@salesforce\/resourceUrl\/(\w+)$/,
        refType: 'staticResource',
        kind: 'uses',
        target: (m) => m[1]!,
    },
    {
        pattern: /^@salesforce\/messageChannel\/(\w+?)(?:__c)?$/,
        refType: 'messageChannel',
        kind: 'uses',
        target: (m) => m[1]!,
    },
    { pattern: /^c\/(\w+)$/, refType: 'lwc', kind: 'imports', target: (m) => m[1]! },
];

/** LWC のバンドルの定義 (バンドル・@api) と参照 (import・子コンポーネント・テンプレートのメタデータ) */
export const getLwcDependencies = (unit: LwcBundleParseResult): UnitDependencies => {
    const definitions: UnitDefinition[] = [];
    const references: UnitReference[] = [];
    if (unit.dataType === 'error') return { definitions, references };
    const bundle = unit.result.id;
    definitions.push({ defType: 'lwc', name: bundle });
    const walk = (node: unknown, statement?: ConvertKeys): void => {
        if (Array.isArray(node)) {
            node.forEach((child) => walk(child, statement));
            return;
        }
        if (!isRecord(node)) return;
        const keys = keysOf(node) ?? statement;
        if (node.kind === 'lwcImport' && typeof node.source === 'string') {
            for (const { pattern, refType, kind, target } of LWC_IMPORTS) {
                const match = node.source.match(pattern);
                if (match) {
                    references.push(
                        reference(refType, target(match), kind, 'import', {
                            statement: keys,
                            expression: keys,
                        }),
                    );
                    break;
                }
            }
        }
        if (node.kind === 'lwcElement' && isRecord(node.component)) {
            const { namespace, name } = node.component as Json;
            if (namespace === 'c' && typeof name === 'string') {
                references.push(
                    reference('lwc', name, 'places', 'template', {
                        statement: keys,
                        expression: keys,
                    }),
                );
            }
            for (const ref of rows(node, 'metadataRefs')) {
                const refType = str(ref.refType);
                const value = str(ref.value);
                if (!refType || !value || refType === 'icon') continue;
                references.push(
                    reference(refType, value, 'uses', `template.${String(ref.attribute ?? '')}`, {
                        statement: keys,
                        expression: keys,
                    }),
                );
            }
        }
        // @api のメンバー
        if (node.kind === 'lwcComponent' && Array.isArray(node.block)) {
            for (const member of node.block) {
                if (!isRecord(member)) continue;
                // デコレーターは modifier.decorator (getter / setter は getterContent・setterContent の modifier)
                const decorators = [member, member.getterContent, member.setterContent].flatMap(
                    (owner) =>
                        isRecord(owner) && isRecord(owner.modifier)
                            ? rows(owner.modifier, 'decorator')
                            : [],
                );
                if (
                    decorators.some((decorator) => decorator.name === 'api') &&
                    typeof member.name === 'string'
                ) {
                    const sourceKeys = keysOf(member);
                    definitions.push({
                        defType: 'lwcProperty',
                        name: `${bundle}.${member.name}`,
                        ...(sourceKeys ? { sourceKeys } : {}),
                    });
                }
            }
        }
        for (const [key, child] of Object.entries(node)) {
            if (key !== 'sourceKeys') walk(child, keys);
        }
    };
    walk(unit.result.base);
    return { definitions, references: dedupe(references) };
};

// ---------------------------------------------------------------------------
// フォルダ単位のメタデータ (権限・ラベル・Flow・画面・B / C の種類)
// ---------------------------------------------------------------------------

/** フォルダ単位のメタデータの単位の名前 (JSON の fullName / name、なければ id から) */
const metadataNameOf = (result: MetadataFileParseResult): string => {
    const base = result.result.base as Json;
    return (
        str(base.fullName) ??
        str(base.name) ??
        result.result.id.slice(result.result.id.indexOf('_') + 1)
    );
};

/** Flow の要素の参照 (FlowReference) を UnitReference にする */
const FLOW_REF_TYPES: Record<string, string> = {
    object: 'object',
    field: 'field',
    apexClass: 'apexClass',
    flow: 'flow',
    lwc: 'lwc',
    component: 'auraComponent',
    label: 'customLabel',
    global: 'globalVariable',
};

const flowReferences = (flow: Json, flowName: string): UnitReference[] =>
    ['elements', 'resources', 'start'].flatMap((key) => {
        const value = flow[key];
        const items = Array.isArray(value)
            ? value.filter(isRecord)
            : isRecord(value)
              ? [value]
              : [];
        return items.flatMap((element) =>
            (Array.isArray(element.references) ? element.references.filter(isRecord) : []).flatMap(
                (r) => {
                    const refType = FLOW_REF_TYPES[String(r.refType)];
                    const target = str(r.value);
                    if (!refType || !target) return [];
                    const member = str(element.name)
                        ? `${flowName}.${element.name as string}`
                        : flowName;
                    return [
                        reference(refType, target, 'uses', `flow.${String(element.kind)}`, {
                            member,
                            statement: keysOf(element),
                        }),
                    ];
                },
            ),
        );
    });

/** 行の値の参照 (権限の行など)。行ごとに文の単位 */
const rowReferences = (
    json: Json,
    rowName: string,
    property: string,
    refType: string,
    kind: DependencyKind,
    toTarget: (value: string) => string = (value) => value,
): UnitReference[] =>
    rows(json, rowName).flatMap((row) => {
        const value = str(row[property]);
        const keys = keysOf(row);
        return value
            ? [
                  reference(refType, toTarget(value), kind, `${rowName}.${property}`, {
                      statement: keys,
                      expression: keys,
                  }),
              ]
            : [];
    });

/** 権限 (権限セット・プロファイル) が与えるもの */
const permissionReferences = (json: Json): UnitReference[] => [
    ...rowReferences(json, 'objectPermissions', 'object', 'object', 'grants'),
    ...rowReferences(json, 'fieldPermissions', 'field', 'field', 'grants'),
    ...rowReferences(json, 'classAccesses', 'apexClass', 'apexClass', 'grants'),
    ...rowReferences(json, 'pageAccesses', 'apexPage', 'visualforcePage', 'grants'),
    ...rowReferences(json, 'recordTypeVisibilities', 'recordType', 'recordType', 'grants'),
    ...rowReferences(json, 'layoutAssignments', 'layout', 'layout', 'uses'),
    ...rowReferences(json, 'loginFlows', 'flow', 'flow', 'uses'),
];

/**
 * 優先度 A の種類の参照のうち、今の参照の解析 (extractMetadataReferences) にないもの
 * (A の解析 (権限の表・画面の解析) が自分で確かめているもの)
 */
const A_TYPE_REFERENCES: Partial<Record<string, (json: Json, name: string) => UnitReference[]>> = {
    permissionSet: permissionReferences,
    mutingPermissionSet: permissionReferences,
    profile: permissionReferences,
    layout: (json) => {
        const object = str(json.objectApiName);
        return object
            ? rowReferences(
                  json,
                  'items',
                  'field',
                  'field',
                  'places',
                  (field) => `${object}.${field}`,
              )
            : [];
    },
    permissionSetGroup: (json) => {
        const keys = keysOf(json);
        const names = (key: string) =>
            Array.isArray(json[key])
                ? (json[key] as unknown[]).filter((v) => typeof v === 'string')
                : [];
        return [
            ...names('permissionSets').map((name) =>
                reference('permissionSet', name as string, 'uses', 'permissionSets', {
                    statement: keys,
                }),
            ),
            ...names('mutingPermissionSets').map((name) =>
                reference('mutingPermissionSet', name as string, 'uses', 'mutingPermissionSets', {
                    statement: keys,
                }),
            ),
        ];
    },
    flexiPage: (json) => {
        const object = str(json.sobjectType);
        return [
            ...(object ? [reference('object', object, 'uses', 'sobjectType')] : []),
            ...(object
                ? rowReferences(
                      json,
                      'fields',
                      'fieldItem',
                      'field',
                      'places',
                      (item) => `${object}.${item.replace(/^Record\./, '')}`,
                  )
                : []),
            ...rows(json, 'components').flatMap((component) => {
                const componentName = str(component.componentName);
                const keys = keysOf(component);
                // c:<名前> (自分の名前空間の LWC / Aura)
                const local = componentName?.match(/^c:(\w+)$/);
                return local
                    ? [
                          reference('lwc', local[1]!, 'places', 'components', {
                              statement: keys,
                              expression: keys,
                          }),
                      ]
                    : [];
            }),
        ];
    },
};

/** 数式を持つプロパティ (Flow の数式・ワークフローのルール・承認の条件など) */
const FORMULA_KEYS = new Set(['formula', 'expression', 'errorConditionFormula']);

/** 種類ごとの、数式の基準のオブジェクト */
const formulaObjectOf = (dataType: string, json: Json, name: string): string | undefined => {
    switch (dataType) {
        case 'flow':
            return isRecord(json.start) ? str(json.start.object) : undefined;
        case 'workflow':
        case 'sharingRules':
            return name;
        case 'approvalProcess':
            return name.split('.')[0];
        default:
            return undefined;
    }
};

/** JSON の中の数式 (FORMULA_KEYS の文字列) の参照。文は数式を持つノード */
const embeddedFormulaReferences = (dataType: string, json: Json, name: string): UnitReference[] => {
    const object = formulaObjectOf(dataType, json, name);
    const found: UnitReference[] = [];
    const walk = (node: unknown, statement?: ConvertKeys, member?: string): void => {
        if (Array.isArray(node)) {
            node.forEach((child) => walk(child, statement, member));
            return;
        }
        if (!isRecord(node)) return;
        const keys = keysOf(node) ?? statement;
        const memberName = str(node.name) ?? str(node.fullName) ?? member;
        for (const [key, child] of Object.entries(node)) {
            if (key === 'sourceKeys') continue;
            if (FORMULA_KEYS.has(key) && typeof child === 'string') {
                found.push(
                    ...formulaReferences(child, object, `formula.${key}`, {
                        member:
                            memberName && memberName !== name ? `${name}.${memberName}` : undefined,
                        statement: keys,
                    }),
                );
            } else {
                walk(child, keys, memberName);
            }
        }
    };
    walk(json);
    return found;
};

/** フォルダ単位のメタデータの単位の定義と参照 */
export const getMetadataFileDependencies = (unit: MetadataFileParseResult): UnitDependencies => {
    if (unit.dataType === 'error') return { definitions: [], references: [] };
    const name = metadataNameOf(unit);
    const base = unit.result.base as Json;
    const sourceKeys = keysOf(base);
    const definitions: UnitDefinition[] = [
        { defType: unit.dataType, name, ...(sourceKeys ? { sourceKeys } : {}) },
    ];
    // カスタム表示ラベルのファイルは、ラベルごとに定義する
    if (unit.dataType === 'customLabels') {
        for (const label of rows(base, 'labels')) {
            const labelKeys = keysOf(label);
            if (str(label.fullName))
                definitions.push({
                    defType: 'customLabel',
                    name: label.fullName as string,
                    ...(labelKeys ? { sourceKeys: labelKeys } : {}),
                });
        }
    }
    const references: UnitReference[] = extractMetadataReferences(unit).map((r) =>
        reference(r.refType, r.target, 'uses', r.via, {
            statement: r.sourceKeys,
            expression: r.sourceKeys,
        }),
    );
    if (unit.dataType === 'flow') references.push(...flowReferences(base, name));
    references.push(...embeddedFormulaReferences(unit.dataType, base, name));
    references.push(...(A_TYPE_REFERENCES[unit.dataType]?.(base, name) ?? []));
    return { definitions, references: dedupe(references) };
};

// ---------------------------------------------------------------------------
// 単位の種類ごとの入口
// ---------------------------------------------------------------------------

/** 単位の種類 (UnitType.type) と解析結果から、定義と参照 */
export const getUnitDependencies = (type: string, result: unknown): UnitDependencies => {
    switch (type) {
        case 'apexClass':
        case 'apexTrigger':
            return getApexDependencies(result as ApexUnitParseResult);
        case 'anonymousApex': {
            // 匿名 Apex は、スクリプトそのものを単位のノードにする (中で宣言したクラスはメンバー)
            const unit = result as ApexUnitParseResult;
            const { definitions, references } = getApexDependencies(unit);
            return {
                definitions: [{ defType: 'anonymousApex', name: unit.result.id }, ...definitions],
                references,
            };
        }
        case 'lwc':
            return getLwcDependencies(result as LwcBundleParseResult);
        case 'object':
            return getObjectUnitDependencies(result as ObjectParseResult);
        case 'objectTranslation':
            return { definitions: [], references: [] };
        default:
            return getMetadataFileDependencies(result as MetadataFileParseResult);
    }
};

const dedupe = (references: UnitReference[]): UnitReference[] => {
    const seen = new Set<string>();
    return references.filter((r) => {
        const key = JSON.stringify([
            r.refType,
            r.target,
            r.kind,
            r.via,
            r.from.member,
            r.from.statement?.sourceKey,
            r.from.expression?.sourceKey,
        ]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};
