import { isAriaAttribute, isGlobalHtmlAttribute } from '@lwc/shared';
import type { LwcBundleParseResult } from '../../parser/Lwc/parser';
import {
    findSpanSourceInfo,
    getLightningComponentSpec,
    type ConvertKeys,
    type LwcBundleJson,
    type LwcComponentJson,
    type LwcElementJson,
    type LwcExpressionJson,
    type LwcImportReferenceJson,
    type LwcMemberJson,
    type LwcMetadataRefType,
    type LwcModifiersJson,
    type LwcSourceJson,
    type LwcTemplateNodeJson,
    SLDS_ICONS,
    SLDS_ICONS_REFERENCE_VERSION,
    LIGHTNING_COMPONENT_ATTRIBUTES,
    LWC_COMPONENTS_REFERENCE_SOURCE,
    VERIFIED_LIGHTNING_COMPONENTS,
} from '../../types';

import type { ObjectInfo } from '../Metadata/analysis';

import { LWC_TOAST_EVENT_NAME, analyzeLwcModuleCalls, lwcInitReferencesOf } from './calls';
import { lwcHeritageOf, walkLwcJson } from './walker';
import { isCustomObjectName } from '../commons/standardObjects';

// LWC のバンドルをまたぐ解析 (docs/lwc-implementation.md)。
// 子コンポーネントの @api・イベント・slot、lightning-* のカタログ、メタデータ (オブジェクト・項目) への参照を突き合わせる。
// ほかのバンドルの変更で結果が変わるので、resolvedError (バンドルごとの差分に出る) にはせず、解析の結果として返す。
// メタデータの解析 (processor/Metadata/analysis.ts) と同じく、1 つの時点の JSON だけを入力にする

/** バンドル 1 つの、ほかのバンドルから見える情報 */
export type LwcComponentInfo = {
    name: string;
    namespace: string;
    /** @api のフィールド・getter / setter の名前 (親から属性で渡せるもの) */
    apiProperties: string[];
    /** dispatchEvent で発行するイベントの名前 */
    events: string[];
    /** テンプレートの <slot> の名前 (名前なしは '') */
    slots: string[];
};

export type LwcAnalysisCode =
    | 'UNKNOWN_COMPONENT'
    | 'UNKNOWN_PROPERTY'
    | 'UNKNOWN_EVENT'
    | 'UNKNOWN_SLOT'
    | 'UNKNOWN_LIGHTNING_COMPONENT'
    | 'UNKNOWN_OBJECT'
    | 'UNKNOWN_FIELD'
    /** @wire の設定の '$x' (プロパティに追従する値) の x が、コンポーネントのプロパティにない */
    | 'UNKNOWN_WIRE_PARAM'
    /** icon-name などの <種類>:<名前> が、SLDS のアイコンにない (standardSldsIcons.ts。SLDS の版が古いと誤検出がありうる) */
    | 'UNKNOWN_SLDS_ICON'
    /**
     * 照合済みの基本コンポーネント (lightning-*) に、その属性がない (書き間違いなど。standardComponentAttributes.ts。
     * 言語サーバーの版が古いと、新しい属性を誤検出しうる)
     */
    | 'UNKNOWN_LIGHTNING_ATTRIBUTE';

/** 突き合わせで見つかったこと。誤検出がありうるので、すべて warning として扱う */
export type LwcAnalysisFinding = {
    code: LwcAnalysisCode;
    /** 対象 (c/accountRow / recordId / Account.Name など) */
    target: string;
    message: string;
    /** バンドルのフォルダの親からの相対パス (位置が分からなければ持たない) */
    filePath?: string;
    sourceKeys: ConvertKeys;
};

/** メタデータへの参照 (テンプレートの metadataRefs と、JS の @salesforce/schema の import) */
export type LwcMetadataDependency = {
    refType: LwcMetadataRefType;
    /** Account / Account.Name / MyFlow など。式で書かれていて解決できなければ持たない */
    value?: string;
    /** 式で書かれた参照 ({fields}) を、JS の @salesforce/schema の import から解決したか */
    resolvedFrom?: string;
    /** どこから: テンプレートの属性 / JS の import */
    origin: 'template' | 'import';
    /** template のときの属性名 */
    attribute?: string;
    filePath?: string;
    sourceKeys: ConvertKeys;
};

export type LwcBundleAnalysis = {
    bundle: string;
    component: LwcComponentInfo;
    findings: LwcAnalysisFinding[];
    /** 使っている子コンポーネント (c/accountRow など。同じ名前空間のもの) */
    localComponents: string[];
    /** 使っている基本コンポーネント (lightning/card など) */
    lightningComponents: string[];
    /** Salesforce のデータを読み書きする基本コンポーネント (カタログの dataAccess) */
    dataAccessComponents: string[];
    /** ほかの名前空間のコンポーネント (管理パッケージなど。突き合わせない) */
    packageComponents: string[];
    metadataDependencies: LwcMetadataDependency[];
};

// ---------------------------------------------------------------------------
// バンドルの情報
// ---------------------------------------------------------------------------

/** すべてのコンポーネントが持つ、HTML の標準のプロパティ (@api でなくても属性で渡せる) */
const GLOBAL_PROPERTIES = new Set([
    'id',
    'title',
    'tabIndex',
    'hidden',
    'lang',
    'dir',
    'accessKey',
    'draggable',
    'spellcheck',
    'role',
    'part',
]);
const isGlobalProperty = (name: string) => GLOBAL_PROPERTIES.has(name) || /^aria[A-Z]/.test(name);

const hasApi = (modifier: LwcModifiersJson | undefined) =>
    (modifier?.decorator ?? []).some((d) => d.name === 'api');

const isApiProperty = (member: LwcMemberJson) => {
    if (member.kind === 'lwcField') return hasApi(member.modifier);
    if (member.kind === 'lwcProperty') {
        return hasApi(member.getterContent?.modifier) || hasApi(member.setterContent?.modifier);
    }
    return false;
};

/**
 * @wire の設定の値の中の、プロパティに追従する値 ('$recordId'・'$record.data.Id' の $ のあと)。
 * 値そのもの・配列・オブジェクトの中の文字列のリテラルを見る (書いた順、同じものは 1 つ)
 */
export const lwcWireReactiveParamsOf = (value: unknown): string[] => {
    const params = new Set<string>();
    walkLwcJson(value, {
        jsString: (node) => {
            if (/^\$[A-Za-z_$]/.test(node.value)) params.add(node.value.slice(1));
        },
    });
    return [...params];
};

/** 継承元が LightningElement だけ (ほかに知らないメンバーを足すミックスイン・基底クラスがない) か */
const KNOWN_MIXINS = new Set(['NavigationMixin']);
const extendsOnlyLightningElement = (component: LwcComponentJson) => {
    const { extend, mixins } = lwcHeritageOf(component.superClass);
    return extend === 'LightningElement' && mixins.every((m) => m !== null && KNOWN_MIXINS.has(m));
};

/** メインのモジュールのコンポーネント (モジュールが読めなかった (null) ときはない) */
const mainComponentOf = (bundle: LwcBundleJson): LwcComponentJson | undefined =>
    bundle.modules.find((m) => m.main)?.module?.component;

/** テンプレートのすべての要素 (分岐・繰り返しの中も) を、祖先の要素とともにたどる */
const walkElements = (
    nodes: LwcTemplateNodeJson[],
    visit: (element: LwcElementJson, parent: LwcElementJson | undefined) => void,
    parent?: LwcElementJson,
) => {
    for (const node of nodes) {
        if (node.kind === 'lwcElement') {
            visit(node, parent);
            walkElements(node.children, visit, node);
        } else if (node.kind === 'lwcIf') {
            node.branches.forEach((branch) => walkElements(branch.children, visit, parent));
        } else if (node.kind === 'lwcForEach') {
            walkElements(node.children, visit, parent);
        }
    }
};

const templatesOf = (bundle: LwcBundleJson) =>
    bundle.templates.flatMap((t) => (t.template ? [t.template] : []));

/** バンドル 1 つの、ほかのバンドルから見える情報 */
export const analyzeLwcComponent = (bundle: LwcBundleJson): LwcComponentInfo => {
    const component = mainComponentOf(bundle);
    const members = component?.block ?? [];
    // メソッド・getter / setter・関数を初期値にしたフィールド (handleClick = () => {...}) の本体のイベント
    // (JSON には持たず、文の JSON から解析で出す。calls.ts)
    const main = bundle.modules.find((m) => m.main)?.module;
    // トースト (ShowToastEvent) は親ではなくコンテナーが受け取るので、親が受け取れるイベントに入れない
    const events = (main ? analyzeLwcModuleCalls(main) : [])
        .filter((content) => content.ownerKind === 'lwcComponent')
        .flatMap((content) => content.events)
        .filter((event) => event.name !== LWC_TOAST_EVENT_NAME);
    const slots: string[] = [];
    templatesOf(bundle).forEach((template) =>
        walkElements(template.children, (element) => {
            if (element.elementType === 'slot') slots.push(element.slotName ?? '');
        }),
    );
    return {
        name: bundle.name,
        namespace: bundle.namespace,
        apiProperties: [
            ...new Set(
                members.flatMap((m) =>
                    isApiProperty(m) && 'name' in m && typeof m.name === 'string' ? [m.name] : [],
                ),
            ),
        ],
        events: [...new Set(events.map((e) => e.name))],
        slots: [...new Set(slots)],
    };
};

// ---------------------------------------------------------------------------
// 式で書かれたメタデータの参照の解決 (JS の @salesforce/schema の import)
// ---------------------------------------------------------------------------

const schemaValue = (reference: LwcImportReferenceJson) =>
    reference.schema
        ? reference.schema.fieldApiName
            ? `${reference.schema.objectApiName}.${reference.schema.fieldApiName}`
            : reference.schema.objectApiName
        : undefined;

/**
 * 式の先頭の名前が、@salesforce/schema の import (そのもの、または初期値でそれを使うフィールド) なら、その値。
 * objectApiName = ACCOUNT_OBJECT / fields = [NAME_FIELD, INDUSTRY_FIELD] など
 */
const resolveSchema = (
    expression: LwcExpressionJson,
    component: LwcComponentJson | undefined,
    imports: Map<string, LwcImportReferenceJson>,
): string[] => {
    const name = expression.path?.[0];
    if (!name || expression.local) return [];
    const direct = imports.get(name);
    if (direct) return schemaValue(direct) ? [schemaValue(direct)!] : [];
    const field = component?.block.find((m) => m.kind === 'lwcField' && m.name === name) as
        Extract<LwcMemberJson, { kind: 'lwcField' }> | undefined;
    // 初期値の中の import の参照 (解析で出す。json-redesign-plan.md 4 章の 4)
    return (field ? lwcInitReferencesOf(field, { imports }) : []).flatMap((r) =>
        schemaValue(r) ? [schemaValue(r)!] : [],
    );
};

/** モジュールの import の名前 → 参照 (@salesforce/schema のもの) */
const schemaImportsOf = (bundle: LwcBundleJson) => {
    const imports = new Map<string, LwcImportReferenceJson>();
    for (const { module } of bundle.modules) {
        if (!module) continue;
        for (const item of module.imports) {
            if (!item.schema) continue;
            for (const specifier of item.specifiers) {
                if (specifier.specifierType !== 'default') continue;
                imports.set(specifier.local, {
                    local: specifier.local,
                    source: item.source,
                    schema: item.schema,
                });
            }
        }
    }
    return imports;
};

// ---------------------------------------------------------------------------
// 解析
// ---------------------------------------------------------------------------

type LwcBundleResult = Extract<LwcBundleParseResult, { dataType: 'lwcBundle' }>;

const filePathOf = (sourceObject: LwcSourceJson[], sourceKeys: ConvertKeys) => {
    try {
        return findSpanSourceInfo(sourceObject, sourceKeys).filePath;
    } catch {
        return undefined;
    }
};

const sortUnique = (values: string[]) => [...new Set(values)].sort();

/**
 * バンドルをまたぐ解析。objects (メタデータの解析結果) を渡すと、メタデータへの参照も突き合わせる。
 * オブジェクトがリポジトリにないとき (標準オブジェクトでフォルダがないなど) は、項目を確かめられないので何も出さない
 */
export const analyzeLwcBundles = (
    bundles: LwcBundleParseResult[],
    objects?: ObjectInfo[],
): LwcBundleAnalysis[] => {
    const readable = bundles.filter((b): b is LwcBundleResult => b.dataType === 'lwcBundle');
    const infos = new Map(
        readable.map((b) => [
            `${b.result.base.namespace}/${b.result.base.name}`,
            analyzeLwcComponent(b.result.base),
        ]),
    );
    const objectsByName = new Map((objects ?? []).map((o) => [o.apiName.toLowerCase(), o]));

    return readable.map(({ result }) => {
        const bundle = result.base;
        const sourceObject = result.sourceObject;
        const component = mainComponentOf(bundle);
        const imports = schemaImportsOf(bundle);
        const findings: LwcAnalysisFinding[] = [];
        const dependencies: LwcMetadataDependency[] = [];
        const local: string[] = [];
        const lightning: string[] = [];
        const dataAccess: string[] = [];
        const packages: string[] = [];

        const find = (
            code: LwcAnalysisCode,
            target: string,
            message: string,
            sourceKeys: ConvertKeys,
        ) => {
            const filePath = filePathOf(sourceObject, sourceKeys);
            findings.push({ code, target, message, ...(filePath ? { filePath } : {}), sourceKeys });
        };

        /**
         * オブジェクト・項目がメタデータにあるか。リポジトリにあるはずのもの (カスタムオブジェクト・カスタム項目、
         * カスタムオブジェクトの項目) だけを確かめる。標準オブジェクト・標準項目 (Account・Industry など) は、
         * リポジトリにファイルがないことが普通なので出さない
         */
        const checkMetadata = (dependency: LwcMetadataDependency) => {
            if (!objects || !dependency.value) return;
            if (dependency.refType !== 'object' && dependency.refType !== 'field') return;
            const [objectName, fieldName] = dependency.value.split('.');
            const object = objectsByName.get(objectName!.toLowerCase());
            if (!object) {
                if (isCustomObjectName(objectName!)) {
                    find(
                        'UNKNOWN_OBJECT',
                        objectName!,
                        `オブジェクト ${objectName} がメタデータにない`,
                        dependency.sourceKeys,
                    );
                }
                return;
            }
            if (
                dependency.refType === 'field' &&
                fieldName &&
                (isCustomObjectName(fieldName) || isCustomObjectName(objectName!)) &&
                !object.fields.some((f) => f.apiName.toLowerCase() === fieldName.toLowerCase())
            ) {
                find(
                    'UNKNOWN_FIELD',
                    dependency.value,
                    `項目 ${dependency.value} がメタデータにない`,
                    dependency.sourceKeys,
                );
            }
        };

        // JS の @salesforce/schema の import
        for (const { module } of bundle.modules) {
            if (!module) continue;
            for (const item of module.imports) {
                if (!item.schema) continue;
                const value = schemaValue({ local: '', source: item.source, schema: item.schema })!;
                dependencies.push({
                    refType: item.schema.fieldApiName ? 'field' : 'object',
                    value,
                    origin: 'import',
                    sourceKeys: item.sourceKeys,
                    ...(filePathOf(sourceObject, item.sourceKeys)
                        ? { filePath: filePathOf(sourceObject, item.sourceKeys)! }
                        : {}),
                });
            }
        }

        for (const template of templatesOf(bundle)) {
            walkElements(template.children, (element) => {
                const ref = element.component;
                if (ref?.source === 'lightning') {
                    lightning.push(ref.module);
                    const spec = getLightningComponentSpec(element.tag);
                    if (!spec) {
                        find(
                            'UNKNOWN_LIGHTNING_COMPONENT',
                            element.tag,
                            `<${element.tag}> は基本コンポーネントのカタログにない`,
                            element.sourceKeys,
                        );
                    } else if (spec.dataAccess) {
                        dataAccess.push(ref.module);
                    }
                    // 照合済みの基本コンポーネントの属性 (書き間違い)。HTML の全体の属性・aria-*・data-*・on*・slot・key・
                    // ディレクティブ (lwc:* など) は見ない
                    const known = LIGHTNING_COMPONENT_ATTRIBUTES[element.tag];
                    if (known && VERIFIED_LIGHTNING_COMPONENTS.has(element.tag)) {
                        for (const attribute of element.attributes) {
                            const name = attribute.name;
                            if (
                                known.includes(name) ||
                                isGlobalHtmlAttribute(name) ||
                                isAriaAttribute(name) ||
                                name.startsWith('data-') ||
                                name.startsWith('on') ||
                                name.includes(':') ||
                                ['slot', 'key', 'class', 'style', 'part'].includes(name)
                            ) {
                                continue;
                            }
                            find(
                                'UNKNOWN_LIGHTNING_ATTRIBUTE',
                                `${element.tag}.${name}`,
                                `<${element.tag}> に属性 ${name} がない (${LWC_COMPONENTS_REFERENCE_SOURCE} の一覧)`,
                                attribute.sourceKeys,
                            );
                        }
                    }
                    // SLDS のアイコン (icon-name="utility:add" など。静的な値で、種類が SLDS のものだけ)
                    for (const metadataRef of element.metadataRefs ?? []) {
                        if (metadataRef.refType !== 'icon' || !metadataRef.value) continue;
                        const [category = '', name = ''] = metadataRef.value.split(':');
                        const icons = (SLDS_ICONS as Readonly<Record<string, readonly string[]>>)[
                            category
                        ];
                        if (icons && !icons.includes(name)) {
                            find(
                                'UNKNOWN_SLDS_ICON',
                                metadataRef.value,
                                `<${element.tag}> の ${metadataRef.attribute} の ${metadataRef.value} は SLDS (${SLDS_ICONS_REFERENCE_VERSION}) のアイコンにない`,
                                metadataRef.sourceKeys,
                            );
                        }
                    }
                } else if (ref?.source === 'package') {
                    packages.push(ref.module);
                } else if (ref?.source === 'local') {
                    local.push(ref.module);
                    const child = infos.get(ref.module);
                    if (!child) {
                        find(
                            'UNKNOWN_COMPONENT',
                            ref.module,
                            `<${element.tag}> のバンドル ${ref.module} がない`,
                            element.sourceKeys,
                        );
                    } else {
                        for (const attribute of element.attributes) {
                            const property = attribute.propertyName;
                            if (
                                !property ||
                                isGlobalProperty(property) ||
                                child.apiProperties.includes(property)
                            ) {
                                continue;
                            }
                            find(
                                'UNKNOWN_PROPERTY',
                                `${ref.module}.${property}`,
                                `${property} は ${ref.module} の @api にない`,
                                attribute.sourceKeys,
                            );
                        }
                        for (const handler of element.events) {
                            if (child.events.includes(handler.event)) continue;
                            find(
                                'UNKNOWN_EVENT',
                                `${ref.module}:${handler.event}`,
                                `${ref.module} は ${handler.event} イベントを発行しない`,
                                handler.sourceKeys,
                            );
                        }
                        // 子コンポーネントの中身 (slot="…" を付けた要素) が、子の <slot name> にあるか
                        for (const node of element.children) {
                            if (node.kind !== 'lwcElement') continue;
                            const slot = node.attributes.find((a) => a.name === 'slot');
                            if (
                                slot?.value.type !== 'static' ||
                                child.slots.includes(slot.value.value)
                            ) {
                                continue;
                            }
                            find(
                                'UNKNOWN_SLOT',
                                `${ref.module}:${slot.value.value}`,
                                `${ref.module} に slot "${slot.value.value}" がない`,
                                slot.sourceKeys,
                            );
                        }
                    }
                }

                // メタデータへの参照。式は JS の @salesforce/schema の import から解決する
                for (const metadataRef of element.metadataRefs ?? []) {
                    const filePath = filePathOf(sourceObject, element.sourceKeys);
                    const base = {
                        refType: metadataRef.refType,
                        origin: 'template' as const,
                        attribute: metadataRef.attribute,
                        ...(filePath ? { filePath } : {}),
                        sourceKeys: element.sourceKeys,
                    };
                    const resolved = metadataRef.expression
                        ? resolveSchema(metadataRef.expression, component, imports)
                        : metadataRef.objectExpression
                          ? resolveSchema(metadataRef.objectExpression, component, imports).map(
                                (object) => `${object}.${metadataRef.value}`,
                            )
                          : [];
                    const expression = metadataRef.expression ?? metadataRef.objectExpression;
                    const entries: LwcMetadataDependency[] = resolved.length
                        ? resolved.map((value) => ({
                              ...base,
                              value,
                              resolvedFrom: `{${expression!.text}}`,
                          }))
                        : [
                              {
                                  ...base,
                                  ...(metadataRef.value !== undefined &&
                                  !metadataRef.objectExpression
                                      ? { value: metadataRef.value }
                                      : {}),
                              },
                          ];
                    dependencies.push(...entries);
                }
            });
        }

        dependencies.forEach(checkMetadata);

        // @wire の設定の '$x' が、コンポーネントのプロパティ (フィールド・getter / setter) にあるか (デコレーターの引数の解析)。
        // 継承元・ミックスインが足すメンバーは分からないので、LightningElement だけを継承するときに確かめる
        if (component && extendsOnlyLightningElement(component)) {
            const properties = new Set(
                component.block.flatMap((m) =>
                    m.kind === 'lwcField' || m.kind === 'lwcProperty' ? [m.name] : [],
                ),
            );
            for (const member of component.block) {
                if (member.kind === 'lwcStaticBlock' || member.kind === 'lwcConstructor') continue;
                const decorators =
                    member.kind === 'lwcProperty'
                        ? [
                              ...(member.getterContent?.modifier.decorator ?? []),
                              ...(member.setterContent?.modifier.decorator ?? []),
                          ]
                        : (member.modifier.decorator ?? []);
                for (const decorator of decorators) {
                    for (const config of decorator.wire?.config ?? []) {
                        for (const param of lwcWireReactiveParamsOf(config.value)) {
                            const name = param.split('.')[0]!;
                            if (properties.has(name)) continue;
                            find(
                                'UNKNOWN_WIRE_PARAM',
                                param,
                                `@wire (${member.name}) の ${config.key} の '$${param}' のプロパティ ${name} がない`,
                                config.sourceKeys,
                            );
                        }
                    }
                }
            }
        }

        return {
            bundle: bundle.name,
            component: infos.get(`${bundle.namespace}/${bundle.name}`)!,
            findings,
            localComponents: sortUnique(local),
            lightningComponents: sortUnique(lightning),
            dataAccessComponents: sortUnique(dataAccess),
            packageComponents: sortUnique(packages),
            metadataDependencies: dependencies,
        };
    });
};
