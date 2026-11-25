import type { ApexNodeJson, BaseExpressionJson, ConvertKeys } from '../../../types';
import type { DependencyKind } from '../../dependency/types';
import { walkJson } from '../../commons/node';
import type { ApexBodySemantics, ApexResolvedCall } from './analyze';
import { type ApexExpressionRef, namePathOf } from './call';
import type { ApexReferenceResolution } from './dependencies';
import type { ApexTypeRef } from './type';

// 名前を文字列などで渡す標準の API の参照 (docs/plan.md 10 章 P2 の「古い処理からの移行」)。
// 今の抽出 (dependency/apex.ts) と同じ参照を、新しい解析の結果 (呼び出し・メンバーの参照・式) から作る。
// - 文字列はリテラルのときだけ (変数・連結は推測しない)
// - Label・Page・Flow などの名前が変数でないことは、名前の解決の結果で確かめる (今の抽出は名前の頭文字で推測していた)
// - handled に入れた呼び出し・メンバーの参照は、一般の参照 (apexTypeMember) にしない

/** 名前を渡す参照 1 つ */
export type ApexNamedReference = {
    refType: string;
    target: string;
    kind: DependencyKind;
    via: string;
    expression: ConvertKeys;
    resolution: ApexReferenceResolution;
};

export type ApexNamedReferences = {
    references: ApexNamedReference[];
    /** 一般の参照にしない呼び出し・メンバーの参照のノードの sourceKey */
    handled: Set<string>;
};

const APEX_LABEL = /^(?:System\.)?Label\.(\w+)$/i;
const APEX_PAGE = /^(?:System\.)?Page\.(\w+)$/i;
const SCHEMA_SOBJECT_TYPE = /^(?:Schema\.)?SObjectType\.(\w+)(?:\.fields\.(\w+))?$/i;
const SOBJECT_TYPE = /^(?:Schema\.)?(\w+)\.SObjectType$/i;
const FLOW_INTERVIEW = /^(?:System\.)?Flow\.Interview\.(\w+)$/i;
const CALLOUT = /^callout:(\w+)/i;
const APEX_PAGE_URL = /^\/apex\/(\w+)(?:[?#/]|$)/i;
const PAGE_REFERENCE = /^(?:System\.)?PageReference$/i;
const WORD = /^\w+$/;
const QUALIFIED_WORD = /^\w+(?:\.\w+)*$/;

/** カスタム設定の読み取りのメソッド (小文字) */
const SETTINGS_METHODS = new Set(['getinstance', 'getorgdefaults', 'getvalues', 'getall']);

const BY_NAME: ApexReferenceResolution = { status: 'byName' };

/** 式の根が、変数・メンバーでない名前 (型名・名前空間など) か */
const rootIsName = (ref: ApexExpressionRef): boolean => {
    let current = ref;
    while (current.kind === 'member') current = current.object;
    return current.kind === 'name' && current.target.kind === 'unresolved';
};

/** 変数でない名前の並び (`System.Label.X` など)。名前にできなければ undefined */
const namesOf = (ref: ApexExpressionRef): string[] | undefined =>
    rootIsName(ref) ? namePathOf(ref) : undefined;

/** 文字列のリテラルの値 */
const literalOf = (expression: BaseExpressionJson | undefined): string | undefined =>
    expression?.kind === 'string' ? expression.value : undefined;

/** 名前空間の引数が「なし」('' か null) か */
const isNoNamespace = (expression: BaseExpressionJson | undefined): boolean =>
    literalOf(expression) === '' || expression?.kind === 'null';

/**
 * 名前空間と名前を受け取る呼び出し (Type.forName('X') / Type.forName('', 'X') など) の名前。
 * 名前空間が '' / null でないとき (パッケージのもの) と、名前がリテラルでないときは undefined
 */
const namespacedNameArg = (
    args: readonly BaseExpressionJson[],
    nameIndex: number,
): string | undefined => {
    if (nameIndex > 0 && !isNoNamespace(args[0])) return undefined;
    const name = literalOf(args[nameIndex]);
    return name && QUALIFIED_WORD.test(name) ? name : undefined;
};

/** 型から、名前 (List・Set は要素の型) */
const elementNameOf = (type: ApexTypeRef | undefined): string | undefined => {
    if (!type) return undefined;
    if (type.kind === 'list' || type.kind === 'set') return elementNameOf(type.element);
    return type.kind === 'named' ? type.name.join('.') : undefined;
};

/** カスタム設定・カスタムメタデータ型の読み取りの呼び出し */
type SettingsCall = { type: string; single: boolean; via: string; record?: string };

/** 実行本体 1 つの、名前を渡す参照 */
export const apexNamedReferencesOf = (semantics: ApexBodySemantics): ApexNamedReferences => {
    const references: ApexNamedReference[] = [];
    const handled = new Set<string>();
    const callsById = new Map(semantics.calls.map((call) => [call.id, call]));

    const add = (
        refType: string,
        target: string,
        kind: DependencyKind,
        via: string,
        expression: ConvertKeys,
        resolution: ApexReferenceResolution = BY_NAME,
    ) => references.push({ refType, target, kind, via, expression, resolution });

    /** X__c.getInstance() / X__mdt.getInstance('Rec') / X__mdt.getAll() */
    const settingsCallOf = (call: ApexResolvedCall | undefined): SettingsCall | undefined => {
        if (!call?.receiver || call.kind !== 'method') return undefined;
        const names = namesOf(call.receiver);
        // Apex の変数名は __ を持てないので、X__c / X__mdt はいつも型の名前
        if (!names || names.length !== 1) return undefined;
        const type = names[0]!;
        const member = call.name.toLowerCase();
        if (/__c$/i.test(type) && SETTINGS_METHODS.has(member)) {
            return { type, single: member !== 'getall', via: 'customSetting' };
        }
        if (/__mdt$/i.test(type) && (member === 'getinstance' || member === 'getall')) {
            const record = literalOf(call.args[0]);
            return {
                type,
                single: member === 'getinstance',
                via: 'customMetadata',
                ...(member === 'getinstance' && record && WORD.test(record) ? { record } : {}),
            };
        }
        return undefined;
    };

    const metadataRecordOf = (type: string, record: string) =>
        `${type.replace(/__mdt$/i, '')}.${record}`;

    for (const call of semantics.calls) {
        const keys = call.sourceKeys;
        if (call.kind === 'new') {
            const created =
                call.type?.type === 'custom' ? call.type.customType.join('.') : undefined;
            const flow = created?.match(FLOW_INTERVIEW);
            // new Flow.Interview.X(params) は Flow X の呼び出し
            if (flow) add('flow', flow[1]!, 'calls', 'Flow.Interview', keys);
            // new PageReference('/apex/X')
            const url =
                created && PAGE_REFERENCE.test(created) ? literalOf(call.args[0]) : undefined;
            const page = url?.match(APEX_PAGE_URL);
            if (page) add('apexPage', page[1]!, 'uses', 'PageReference', keys);
            continue;
        }
        if (call.kind !== 'method' || !call.receiver) continue;

        // カスタム設定・カスタムメタデータ型の読み取り
        const settings = settingsCallOf(call);
        if (settings) {
            handled.add(call.id);
            add('object', settings.type, 'reads', settings.via, keys);
            if (settings.record) {
                add(
                    'customMetadata',
                    metadataRecordOf(settings.type, settings.record),
                    'reads',
                    settings.via,
                    keys,
                );
            }
            continue;
        }
        // X__mdt.getAll().get('Rec')
        if (call.name.toLowerCase() === 'get' && call.receiver.kind === 'call') {
            const owner = settingsCallOf(callsById.get(call.receiver.callId));
            const record = literalOf(call.args[0]);
            if (owner?.via === 'customMetadata' && record && WORD.test(record)) {
                handled.add(call.id);
                add(
                    'customMetadata',
                    metadataRecordOf(owner.type, record),
                    'reads',
                    owner.via,
                    keys,
                );
                continue;
            }
        }

        const names = namesOf(call.receiver);
        if (!names) continue;
        const owner = names
            .join('.')
            .replace(/^System\./i, '')
            .toLowerCase();
        const args = call.args;
        switch (`${owner}.${call.name.toLowerCase()}`) {
            case 'pagereference.forresource': {
                // forResource('Name') / forResource('Name', 'path/in/zip')
                const name = literalOf(args[0]);
                if (name && WORD.test(name)) {
                    add('staticResource', name, 'uses', 'PageReference.forResource', keys);
                }
                break;
            }
            case 'type.forname': {
                // forName('X') / forName('Outer.Inner') / forName('', 'X')。名前空間のある (パッケージの) クラスは取らない
                const name = namespacedNameArg(args, args.length >= 2 ? 1 : 0);
                // 標準の型 (String など) もありうるので、クラスかはグラフで決める (apexType)
                if (name) add('apexType', name, 'uses', 'Type.forName', keys);
                break;
            }
            case 'flow.interview.createinterview': {
                // createInterview('Name', params) / createInterview('', 'Name', params)
                const name = namespacedNameArg(args, args.length >= 3 ? 1 : 0);
                if (name && WORD.test(name)) {
                    add('flow', name, 'calls', 'Flow.Interview.createInterview', keys);
                }
                break;
            }
            case 'label.get': {
                // Label.get('', 'X') / Label.get('', 'X', 'ja')
                const name = namespacedNameArg(args, 1);
                if (name && WORD.test(name)) add('customLabel', name, 'uses', 'Label.get', keys);
                break;
            }
            case 'eventbus.publish': {
                // EventBus.publish(new X__e(...)) / EventBus.publish(events) (型が X__e のときだけ)
                const event = elementNameOf(call.argTypes[0]);
                if (event && /__e$/i.test(event)) {
                    add('object', event, 'publishes', 'EventBus.publish', keys);
                }
                break;
            }
            case 'featuremanagement.checkpermission': {
                const permission = literalOf(args[0]);
                if (permission !== undefined) {
                    add('customPermission', permission, 'uses', 'FeatureManagement', keys);
                }
                break;
            }
            default:
                break;
        }
    }

    for (const access of semantics.memberAccesses) {
        const keys = access.sourceKeys;
        // 設定の読み取りの結果の項目 (Conf__c.getInstance().Rate__c)
        if (access.object.kind === 'call') {
            const owner = settingsCallOf(callsById.get(access.object.callId));
            if (owner?.single) {
                handled.add(keys.sourceKey);
                add('field', `${owner.type}.${access.member}`, 'reads', owner.via, keys);
            }
            continue;
        }
        const object = namesOf(access.object);
        if (!object) continue;
        const dotted = [...object, access.member].join('.');
        const label = dotted.match(APEX_LABEL);
        if (label) {
            handled.add(keys.sourceKey);
            add('customLabel', label[1]!, 'uses', 'Label', keys);
            continue;
        }
        const page = dotted.match(APEX_PAGE);
        if (page) {
            handled.add(keys.sourceKey);
            add('apexPage', page[1]!, 'uses', 'Page', keys);
            continue;
        }
        // Schema.SObjectType.Account(.fields.Name) / Account.SObjectType / Schema.Account.SObjectType
        const schema = dotted.match(SCHEMA_SOBJECT_TYPE);
        if (schema) {
            handled.add(keys.sourceKey);
            add('object', schema[1]!, 'uses', 'Schema', keys);
            if (schema[2]) add('field', `${schema[1]}.${schema[2]}`, 'uses', 'Schema', keys);
            continue;
        }
        const sObjectType = dotted.match(SOBJECT_TYPE);
        if (sObjectType) {
            handled.add(keys.sourceKey);
            add('object', sObjectType[1]!, 'uses', 'Schema', keys);
        }
    }

    // 文字列のリテラル ('callout:Name/path') と、StaticResource の SOQL の WHERE Name = 'X' / IN ('X', 'Y')
    for (const statement of semantics.body.statements) {
        walkJson<ApexNodeJson>(statement as ApexNodeJson, {
            enter: {
                string: (node) => {
                    const callout = node.value.match(CALLOUT);
                    if (callout) {
                        add('namedCredential', callout[1]!, 'uses', 'callout', node.sourceKeys);
                    }
                },
                soql: (node) => {
                    const object = node.from.field[0]?.field.join('.');
                    if (object?.toLowerCase() !== 'staticresource' || !node.where) return;
                    walkJson<ApexNodeJson>(node.where as ApexNodeJson, {
                        enter: {
                            subQuery: () => 'skip',
                            singleCondition: (condition) => {
                                const field = condition.field;
                                const isName =
                                    field.type === 'field' &&
                                    field.field.length === 1 &&
                                    field.field[0]?.toLowerCase() === 'name';
                                const operator = condition.operator.toLowerCase();
                                if (!isName || (operator !== '=' && operator !== 'in'))
                                    return 'skip';
                                const value = condition.value;
                                const values = value.type === 'list' ? value.value : [value];
                                for (const item of values) {
                                    const text = item.type === 'string' ? item.value : undefined;
                                    const name =
                                        text && /^'.*'$/s.test(text)
                                            ? text.slice(1, -1)
                                            : undefined;
                                    if (name && WORD.test(name)) {
                                        add(
                                            'staticResource',
                                            name,
                                            'uses',
                                            'soql.where',
                                            node.sourceKeys,
                                        );
                                    }
                                }
                                return 'skip';
                            },
                        },
                    });
                },
            },
        });
    }

    return { references, handled };
};
