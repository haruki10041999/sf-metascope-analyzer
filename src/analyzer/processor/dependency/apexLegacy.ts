import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { ConvertKeys } from '../../types';
import { APEX_DML_OPERATIONS, apexDmlTargetOf, apexSoqlObjectOf } from '../Apex/calls';
import {
    type ApexVisitor,
    type ApexWalkContext,
    apexCustomTypeName,
    apexCustomTypesOf,
    apexDottedNameOf,
    apexElementTypeOf,
    apexIdentifierOf,
    apexStringLiteralOf,
    apexVariableOf,
    initialApexWalkContext,
    walkApexUnit,
} from '../Apex/walker';

import type {
    DependencyKind,
    ReferenceSite,
    UnitDefinition,
    UnitDependencies,
    UnitReference,
} from './types';

// Apex の単位 (クラス・トリガー・匿名 Apex) の定義と参照。方針: docs/analysis-plan.md 3.3
// - 定義: クラス (内側のクラスは Outer.Inner)・インターフェース・enum・メソッド・プロパティ・項目
// - 参照: SOQL / SOSL の対象 (オブジェクト・項目・サブクエリの子リレーション)、DML の対象 (文と Database のメソッド)、
//   メソッドの呼び出し、型 (extends / implements / 変数の型 / new)、Label.<名前>、Schema の参照、
//   カスタム権限 (FeatureManagement.checkPermission)、トリガーのオブジェクト、
//   カスタム設定・カスタムメタデータ型の読み取り (X__c.getInstance() / X__mdt.getInstance('Rec') など)、
//   名前を文字列などで渡すもの (Page.X / new PageReference('/apex/X') / PageReference.forResource('X') /
//   StaticResource の SOQL / Type.forName('X') / 'callout:X' / Flow.Interview.X / Label.get('', 'X'))、
//   プラットフォームイベントの発行 (EventBus.publish)。文字列はリテラルのときだけ (変数・連結は推測しない)
// - JSON は共通の走査 (Apex/walker.ts。docs/json-redesign-plan.md の段階 A3) でたどる。変数の型は走査のスコープから引く
//   (同じ名前は内側を優先。ブロックの中の変数は外に漏れない)。型がクラスかオブジェクトかは決めず
//   (apexType / apexTypeMember)、グラフで定義と突き合わせて決める

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * ノードのキー。宣言 (class・method など) の sourceKeys は { base, name, ... } の形なので、ノード自身の base にする
 * (そのままだと sourceKey がなく、宣言どうしが同じ場所に見える)
 */
const keysOf = (node: Json): ConvertKeys | undefined => {
    const keys = node.sourceKeys;
    if (!isRecord(keys)) return undefined;
    return (isRecord(keys.base) ? keys.base : keys) as ConvertKeys;
};

const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

/** SOQL / SOSL の項目のパス (['Owner', 'Name']) を、オブジェクトの項目の名前にする (関係の名前 __r は __c) */
const fieldOfPath = (object: string, field: unknown): string | undefined => {
    const parts = Array.isArray(field) ? (field as unknown[]).map(String) : [];
    const [first] = parts;
    if (!first) return undefined;
    if (parts.length === 1) return `${object}.${first}`;
    // 関係をたどる参照 (Owner.Name / Account__r.Name)。最初の関係の項目だけを参照にする
    return `${object}.${first.replace(/__r$/i, '__c')}`;
};

const DML_KINDS: Record<string, DependencyKind> = {
    insert: 'inserts',
    update: 'updates',
    upsert: 'upserts',
    delete: 'deletes',
    undelete: 'undeletes',
    merge: 'merges',
};

/** 呼び出しの最初の引数が名前の文字列のリテラル ('Default') なら、その名前 */
const nameArgOf = (node: Json): string | undefined => {
    const literal = apexStringLiteralOf(
        Array.isArray(node.memberArg) ? node.memberArg[0] : undefined,
    );
    return literal && /^\w+$/.test(literal) ? literal : undefined;
};

/** カスタム設定の読み取りのメソッド (小文字) */
const SETTINGS_METHODS = new Set(['getinstance', 'getorgdefaults', 'getvalues', 'getall']);

const APEX_LABEL = /^(?:System\.)?Label\.(\w+)$/i;

/** Visualforce のページ (Page.X) */
const APEX_PAGE = /^(?:System\.)?Page\.(\w+)$/i;

/** Flow の型 (Flow.Interview.X) */
const FLOW_INTERVIEW = /^Flow\.Interview\.(\w+)$/i;

/** SOQL の文字列の値 ('...'。SOQL の値は引用符つきのまま) の中身 */
const soqlLiteralOf = (value: unknown): string | undefined => {
    const literal = isRecord(value) ? str(value.value) : undefined;
    return literal && /^'.*'$/s.test(literal) ? literal.slice(1, -1) : undefined;
};

/** 名前空間の引数が「なし」('' か null) か */
const isNoNamespace = (value: unknown): boolean =>
    apexStringLiteralOf(value) === '' || (isRecord(value) && value.kind === 'null');

/**
 * 名前空間と名前を受け取る呼び出し (Type.forName('X') / Type.forName('', 'X') など) の名前。
 * 名前空間が '' / null でないとき (パッケージのもの) と、名前がリテラルでないときは undefined
 */
const namespacedNameArg = (args: unknown[], nameIndex: number): string | undefined => {
    if (nameIndex > 0 && !isNoNamespace(args[0])) return undefined;
    const name = apexStringLiteralOf(args[nameIndex]);
    return name && /^\w+(?:\.\w+)*$/.test(name) ? name : undefined;
};

/** 指定ログイン情報 ('callout:Name/path') */
const CALLOUT = /^callout:(\w+)/i;

/** Visualforce のページの URL ('/apex/X?id=...') */
const APEX_PAGE_URL = /^\/apex\/(\w+)(?:[?#/]|$)/i;

/**
 * node の下を深さ優先でたどる (SOQL の中の項目を集めるのに使う)。visit が false を返したら、その下は見ない
 */
const walkQuery = (node: unknown, visit: (node: Json) => boolean) => {
    if (Array.isArray(node)) {
        node.forEach((child) => walkQuery(child, visit));
        return;
    }
    if (!isRecord(node)) return;
    if (!visit(node)) return;
    for (const [key, child] of Object.entries(node)) {
        if (key === 'sourceKeys') continue;
        walkQuery(child, visit);
    }
};

/** SOQL・サブクエリの SELECT・WHERE・ORDER BY・GROUP BY の項目のパス (サブクエリの中は見ない) */
const queryFieldRefs = (query: Json, fieldRef: (field: unknown, via: string) => void) => {
    walkQuery(query, (node) => {
        if (node === query) return true;
        if (node.kind === 'subQuery' || node.kind === 'soql') return false;
        if (node.kind === 'selectEntry') {
            if (node.type === 'field') fieldRef(node.field, 'soql.select');
            else if (Array.isArray(node.arg)) fieldRef(node.arg, 'soql.select');
        } else if (node.kind === 'singleCondition' && isRecord(node.field)) {
            if (node.field.type === 'field') fieldRef(node.field.field, 'soql.where');
        } else if (node.kind === 'orderField' && node.type === 'field') {
            fieldRef(node.field, 'soql.orderBy');
        } else if (node.kind === 'groupBy' && Array.isArray(node.field)) {
            for (const field of node.field) {
                if (isRecord(field) && field.type === 'field') {
                    fieldRef(field.field, 'soql.groupBy');
                }
            }
        }
        return true;
    });
};

/** Apex の単位 1 つの定義と参照 */
export const getLegacyApexDependencies = (unit: ApexUnitParseResult): UnitDependencies => {
    const definitions: UnitDefinition[] = [];
    const references: UnitReference[] = [];
    const source = unit.result.base.source as Json | undefined;
    const content = isRecord(source?.content) ? (source!.content as Json) : undefined;
    if (!content) return { definitions, references };

    const add = (
        context: ApexWalkContext,
        refType: string,
        target: string,
        kind: DependencyKind,
        via: string,
        expression?: ConvertKeys,
    ) => {
        const from: ReferenceSite = {
            ...(context.member ? { member: context.member } : {}),
            ...(context.statement ? { statement: context.statement } : {}),
            ...(expression ? { expression } : {}),
        };
        references.push({ refType, target, kind, via, from });
    };

    const typeOfVariable = (context: ApexWalkContext, name: string): string | undefined =>
        apexVariableOf(context, name)?.type;

    /** 宣言で参照にした型 (type の処理で、もう一度 type の参照にしない) */
    const handledTypes = new WeakSet<object>();
    /** 代入の左辺 (acc.Name = ...) のメンバーの参照。読み取り (reads) にはしない */
    const assignmentTargets = new WeakSet<object>();

    const typeRefs = (
        context: ApexWalkContext,
        type: unknown,
        via: string,
        kind: DependencyKind = 'uses',
    ) => {
        if (isRecord(type)) handledTypes.add(type);
        for (const name of apexCustomTypesOf(type)) {
            const keys = isRecord(type) ? keysOf(type) : undefined;
            // Flow.Interview.X 型の変数は Flow X を使う
            const flow = name.match(FLOW_INTERVIEW);
            if (flow) add(context, 'flow', flow[1]!, 'uses', 'Flow.Interview', keys);
            else add(context, 'apexType', name, kind, via, keys);
        }
    };

    /** SOQL 1 つ */
    const soqlRefs = (context: ApexWalkContext, soql: Json) => {
        const keys = keysOf(soql);
        const object = apexSoqlObjectOf(soql);
        if (!object) return;
        add(context, 'object', object, 'queries', 'soql.from', keys);
        if (object.toLowerCase() === 'staticresource') staticResourceRefs(context, soql);
        queryFieldRefs(soql, (field, via) => {
            const name = fieldOfPath(object, field);
            if (name) add(context, 'field', name, 'reads', via, keys);
        });
        // サブクエリ ((SELECT LastName FROM Contacts))。子のオブジェクトは、グラフで子リレーションの名前から決める
        walkQuery(soql.select, (node) => {
            if (node.kind === 'soql') return false;
            if (node.kind !== 'subQuery') return true;
            const relationship = apexSoqlObjectOf(node);
            if (!relationship) return false;
            const target = `${object}.${relationship}`;
            add(context, 'childRelationship', target, 'queries', 'soql.subquery', keys);
            queryFieldRefs(node, (field) => {
                const name = fieldOfPath(target, field);
                if (name) {
                    add(context, 'childRelationshipField', name, 'reads', 'soql.subquery', keys);
                }
            });
            return false;
        });
    };

    /** StaticResource の SOQL の WHERE Name = 'X' / Name IN ('X', 'Y') (文字列のリテラル) の静的リソース */
    const staticResourceRefs = (context: ApexWalkContext, soql: Json) => {
        walkQuery(soql.where, (node) => {
            if (node.kind === 'subQuery' || node.kind === 'soql') return false;
            if (node.kind !== 'singleCondition' || !isRecord(node.field)) return true;
            const field = node.field.field;
            const isName =
                node.field.type === 'field' &&
                Array.isArray(field) &&
                field.length === 1 &&
                String(field[0]).toLowerCase() === 'name';
            const operator = str(node.operator)?.toLowerCase();
            if (!isName || (operator !== '=' && operator !== 'in')) return false;
            const values = isRecord(node.value)
                ? node.value.type === 'list' && Array.isArray(node.value.value)
                    ? node.value.value
                    : [node.value]
                : [];
            for (const value of values) {
                const name =
                    isRecord(value) && value.type === 'string' ? soqlLiteralOf(value) : undefined;
                if (name && /^\w+$/.test(name)) {
                    add(context, 'staticResource', name, 'uses', 'soql.where', keysOf(soql));
                }
            }
            return false;
        });
    };

    /** SOSL 1 つ */
    const soslRefs = (context: ApexWalkContext, sosl: Json) => {
        const keys = keysOf(sosl);
        for (const spec of Array.isArray(sosl.fieldSpec) ? sosl.fieldSpec : []) {
            if (!isRecord(spec) || !Array.isArray(spec.object)) continue;
            const object = String(spec.object[0]);
            add(context, 'object', object, 'queries', 'sosl.returning', keys);
            for (const field of Array.isArray(spec.field) ? spec.field : []) {
                if (!isRecord(field)) continue;
                const name = fieldOfPath(object, field.field);
                if (name) add(context, 'field', name, 'reads', 'sosl.returning', keys);
            }
        }
    };

    /**
     * カスタム設定 (X__c) ・カスタムメタデータ型 (X__mdt) の読み取りの呼び出し (X__c.getInstance() など)。
     * single はレコード 1 つを返すもの (続く .Field__c を項目の読み取りにする)
     */
    const settingsCallOf = (
        node: Json,
    ): { type: string; single: boolean; via: string; record?: string } | undefined => {
        if (node.kind !== 'memberAccess' || node.type !== 'method') return undefined;
        const object = apexIdentifierOf(node.object);
        const member = str(node.member)?.toLowerCase();
        // Apex の変数名は __ を持てないので、X__c / X__mdt はいつも型の名前
        if (!object || !member) return undefined;
        const record = nameArgOf(node);
        if (/__c$/i.test(object) && SETTINGS_METHODS.has(member)) {
            return { type: object, single: member !== 'getall', via: 'customSetting' };
        }
        if (/__mdt$/i.test(object) && (member === 'getinstance' || member === 'getall')) {
            return {
                type: object,
                single: member === 'getinstance',
                via: 'customMetadata',
                ...(member === 'getinstance' && record ? { record } : {}),
            };
        }
        return undefined;
    };

    /** 設定の読み取りの呼び出しなら参照にして true (X__c.getInstance は項目ではない) */
    const settingsRefs = (context: ApexWalkContext, node: Json): boolean => {
        const keys = keysOf(node);
        // X__mdt.getAll().get('Rec')
        if (isRecord(node.object) && str(node.member)?.toLowerCase() === 'get') {
            const owner = settingsCallOf(node.object);
            const name = nameArgOf(node);
            if (owner?.via === 'customMetadata' && name) {
                const record = `${owner.type.replace(/__mdt$/i, '')}.${name}`;
                add(context, 'customMetadata', record, 'reads', owner.via, keys);
                return true;
            }
            return false;
        }
        const call = settingsCallOf(node);
        if (!call) return false;
        add(context, 'object', call.type, 'reads', call.via, keys);
        if (call.record) {
            const record = `${call.type.replace(/__mdt$/i, '')}.${call.record}`;
            add(context, 'customMetadata', record, 'reads', call.via, keys);
        }
        return true;
    };

    /** メンバーの参照 (a.b / a.b() / X.method()) */
    const memberAccessRefs = (context: ApexWalkContext, node: Json) => {
        const keys = keysOf(node);
        const member = str(node.member);
        if (!member) return;
        const dotted = apexDottedNameOf(node);
        const label = dotted?.match(APEX_LABEL);
        if (label) {
            add(context, 'customLabel', label[1]!, 'uses', 'Label', keys);
            return;
        }
        // Page.X (Page という名前の変数のメンバーは除く)
        const page = dotted?.match(APEX_PAGE);
        if (page && !apexVariableOf(context, dotted!.split('.')[0]!)) {
            add(context, 'apexPage', page[1]!, 'uses', 'Page', keys);
            return;
        }
        const object = node.object;
        const objectName = apexIdentifierOf(object);
        if (node.type === 'method') {
            stringArgRefs(context, node);
            // FeatureManagement.checkPermission('Name')
            if (
                objectName?.toLowerCase() === 'featuremanagement' &&
                /^check(Permission)$/i.test(member) &&
                Array.isArray(node.memberArg)
            ) {
                const permission = apexStringLiteralOf(node.memberArg[0]);
                if (permission !== undefined) {
                    add(context, 'customPermission', permission, 'uses', 'FeatureManagement', keys);
                }
            }
            if (settingsRefs(context, node)) return;
            databaseDmlRefs(context, node);
            if (isRecord(object) && object.kind === 'this') {
                // this.sync(...) は同じクラスのメソッドの呼び出し
                if (context.className) {
                    add(
                        context,
                        'apexMethod',
                        `${context.className}.${member}`,
                        'calls',
                        'call',
                        keys,
                    );
                }
            } else if (objectName !== undefined) {
                const variable = apexVariableOf(context, objectName);
                // 集合のメソッド (accounts.size()) と、型の分からない変数 (小文字で始まる名前) は参照にしない
                if (variable?.collection) return;
                if (!variable && /^[a-z]/.test(objectName)) return;
                add(
                    context,
                    'apexTypeMember',
                    `${variable?.type ?? objectName}.${member}`,
                    'calls',
                    'call',
                    keys,
                );
            }
            return;
        }
        // 設定の読み取りの結果の項目 (Conf__c.getInstance().Rate__c)
        if (isRecord(object)) {
            const owner = settingsCallOf(object);
            if (owner?.single) {
                add(context, 'field', `${owner.type}.${member}`, 'reads', owner.via, keys);
                return;
            }
        }
        if (objectName === undefined) return;
        // Schema.SObjectType.Account / Account.SObjectType / Schema.Account
        if (dotted) {
            const schema = dotted.match(/^(?:Schema\.)?SObjectType\.(\w+)(?:\.fields\.(\w+))?/i);
            if (schema) {
                add(context, 'object', schema[1]!, 'uses', 'Schema', keys);
                if (schema[2])
                    add(context, 'field', `${schema[1]}.${schema[2]}`, 'uses', 'Schema', keys);
                return;
            }
            const sobjectType = dotted.match(/^(?:Schema\.)?(\w+)\.SObjectType$/i);
            if (sobjectType) {
                add(context, 'object', sobjectType[1]!, 'uses', 'Schema', keys);
                return;
            }
        }
        // 代入の左辺は書き込み (writes。assignmentRefs) なので、読み取りにしない (docs/apex-json-review.md 5 章の 9)
        if (assignmentTargets.has(node)) return;
        const variable = apexVariableOf(context, objectName);
        if (variable && !variable.collection) {
            add(context, 'apexTypeMember', `${variable.type}.${member}`, 'reads', 'member', keys);
        }
    };

    /**
     * 名前を文字列の引数で渡す標準のメソッドの呼び出し (文字列のリテラルのときだけ)。
     * PageReference.forResource('X') / Type.forName('X') / Flow.Interview.createInterview('X', …) /
     * Label.get('', 'X')、と EventBus.publish (プラットフォームイベントの発行)
     */
    const stringArgRefs = (context: ApexWalkContext, node: Json) => {
        const keys = keysOf(node);
        const owner = apexDottedNameOf(node.object)
            ?.replace(/^System\./i, '')
            .toLowerCase();
        const member = str(node.member)?.toLowerCase();
        const args: unknown[] = Array.isArray(node.memberArg) ? node.memberArg : [];
        if (!owner || !member || apexVariableOf(context, owner.split('.')[0]!)) return;
        const call = `${owner}.${member}`;
        if (call === 'pagereference.forresource') {
            // forResource('Name') / forResource('Name', 'path/in/zip')
            const name = apexStringLiteralOf(args[0]);
            if (name && /^\w+$/.test(name)) {
                add(context, 'staticResource', name, 'uses', 'PageReference.forResource', keys);
            }
        } else if (call === 'type.forname') {
            // forName('X') / forName('Outer.Inner') / forName('', 'X')。名前空間のある (パッケージの) クラスは取らない
            const name = namespacedNameArg(args, args.length >= 2 ? 1 : 0);
            // 標準の型 (String など) もありうるので、クラスかはグラフで決める (apexType)
            if (name) add(context, 'apexType', name, 'uses', 'Type.forName', keys);
        } else if (call === 'flow.interview.createinterview') {
            // createInterview('Name', params) / createInterview('', 'Name', params)
            const name = namespacedNameArg(args, args.length >= 3 ? 1 : 0);
            if (name && /^\w+$/.test(name)) {
                add(context, 'flow', name, 'calls', 'Flow.Interview.createInterview', keys);
            }
        } else if (call === 'label.get') {
            // Label.get('', 'X') / Label.get('', 'X', 'ja')
            const name = namespacedNameArg(args, 1);
            if (name && /^\w+$/.test(name)) {
                add(context, 'customLabel', name, 'uses', 'Label.get', keys);
            }
        } else if (call === 'eventbus.publish') {
            // EventBus.publish(new X__e(...)) / EventBus.publish(events) (変数の型が X__e のときだけ)
            const event = eventTypeOf(context, args[0]);
            if (event) add(context, 'object', event, 'publishes', 'EventBus.publish', keys);
        }
    };

    /** Database.insert(records, false) などの DML のメソッド (DML の文と同じ参照にする) */
    const databaseDmlRefs = (context: ApexWalkContext, node: Json) => {
        const owner = apexDottedNameOf(node.object)
            ?.replace(/^System\./i, '')
            .toLowerCase();
        const member = str(node.member)?.toLowerCase();
        if (owner !== 'database' || !member || !APEX_DML_OPERATIONS.has(member)) return;
        if (apexVariableOf(context, 'Database')) return;
        const args: unknown[] = Array.isArray(node.memberArg) ? node.memberArg : [];
        const object = apexDmlTargetOf(context, args[0]);
        if (object) {
            add(context, 'object', object, DML_KINDS[member]!, `Database.${member}`, keysOf(node));
        }
    };

    /** new X(...) / new X[n] (List / Set / Map は参照にしない)、new Flow.Interview.X(...)、new PageReference('/apex/X') */
    const newRefs = (context: ApexWalkContext, node: Json) => {
        const keys = keysOf(node);
        const newType = isRecord(node.newType) ? node.newType : undefined;
        // 作る型は new の参照にするので、型の参照 (type) にはしない
        if (newType) handledTypes.add(newType);
        const target =
            newType?.type === 'array' && isRecord(newType.elementType)
                ? newType.elementType
                : newType;
        const created =
            target?.type === 'custom'
                ? apexCustomTypeName(target.customType)
                : target?.type === 'primitive'
                  ? str(target.primitiveType)
                  : undefined;
        if (!created) return;
        const flow = created.match(FLOW_INTERVIEW);
        if (flow) {
            // new Flow.Interview.X(params) は Flow X の呼び出し
            add(context, 'flow', flow[1]!, 'calls', 'Flow.Interview', keys);
        } else {
            add(context, 'apexType', created, 'creates', 'new', keys);
        }
        // new PageReference('/apex/X')
        const url = /^(System\.)?PageReference$/i.test(created)
            ? apexStringLiteralOf(Array.isArray(node.arg) ? node.arg[0] : undefined)?.match(
                  APEX_PAGE_URL,
              )
            : undefined;
        if (url) add(context, 'apexPage', url[1]!, 'uses', 'PageReference', keys);
    };

    /** 発行するプラットフォームイベント (X__e) の名前 */
    const eventTypeOf = (context: ApexWalkContext, arg: unknown): string | undefined => {
        let type: string | undefined;
        const variable = apexIdentifierOf(arg);
        if (variable !== undefined) type = typeOfVariable(context, variable);
        // new X__e(...) / new List<X__e>{ ... } (集合は要素の型)
        else if (isRecord(arg) && arg.kind === 'new') type = apexElementTypeOf(arg.newType);
        return type && /__e$/i.test(type) ? type : undefined;
    };

    /** 代入の左辺 (acc.Name = ...) の項目は writes */
    const assignmentRefs = (context: ApexWalkContext, node: Json) => {
        const value = node.value;
        if (!isRecord(value) || value.kind !== 'assignment') return;
        const left = value.left;
        if (!isRecord(left) || left.kind !== 'memberAccess' || left.type !== 'object') return;
        assignmentTargets.add(left);
        const object = apexIdentifierOf(left.object);
        const member = str(left.member);
        const variable = object ? apexVariableOf(context, object) : undefined;
        if (variable && !variable.collection && member) {
            add(
                context,
                'apexTypeMember',
                `${variable.type}.${member}`,
                'writes',
                'assignment',
                keysOf(left),
            );
        }
    };

    /** クラス・インターフェース・enum の定義と、extends / implements */
    const typeDeclaration = (node: Json, context: ApexWalkContext) => {
        if (!str(node.name) || !context.className) return false;
        definitions.push({
            defType: 'apexClass',
            name: context.className,
            ...(keysOf(node) ? { sourceKeys: keysOf(node)! } : {}),
        });
        // インターフェースは複数を extends できる (extend が型の配列)
        for (const type of Array.isArray(node.extend)
            ? node.extend
            : node.extend
              ? [node.extend]
              : []) {
            typeRefs(context, type, 'extends', 'extends');
        }
        for (const type of Array.isArray(node.implement) ? node.implement : []) {
            typeRefs(context, type, 'implements', 'implements');
        }
        return true;
    };

    /** メソッド・コンストラクタ・インターフェースのメソッド・プロパティの定義と、戻り値・引数・プロパティの型 */
    const memberDeclaration = (node: Json, context: ApexWalkContext) => {
        const kind = String(node.kind);
        const name = str(node.name);
        if (name && context.className && kind !== 'constructor' && context.member) {
            definitions.push({
                defType: kind === 'property' ? 'apexProperty' : 'apexMethod',
                name: context.member,
                ...(keysOf(node) ? { sourceKeys: keysOf(node)! } : {}),
            });
        }
        if (isRecord(node.returnType)) typeRefs(context, node.returnType, 'returnType');
        for (const param of Array.isArray(node.param) ? node.param : []) {
            if (isRecord(param)) typeRefs(context, param.variantType, 'parameter');
        }
        if (kind === 'property') typeRefs(context, node.variantType, 'property');
    };

    const visitor: ApexVisitor = {
        class: typeDeclaration,
        interface: typeDeclaration,
        enum: typeDeclaration,
        method: memberDeclaration,
        constructor: memberDeclaration,
        interfaceMethod: memberDeclaration,
        property: memberDeclaration,
        field: (node, context) => {
            const keys = keysOf(node);
            if (context.className) {
                for (const variant of Array.isArray(node.variants) ? node.variants : []) {
                    if (isRecord(variant) && str(variant.name)) {
                        definitions.push({
                            defType: 'apexProperty',
                            name: `${context.className}.${variant.name}`,
                            ...(keys ? { sourceKeys: keys } : {}),
                        });
                    }
                }
            }
            typeRefs(context, node.variantType, 'field');
        },
        type: (node, context) => {
            if (!handledTypes.has(node)) typeRefs(context, node, 'type');
        },
        soql: (node, context) => {
            soqlRefs(context, node);
        },
        sosl: (node, context) => {
            soslRefs(context, node);
            return false;
        },
        memberAccess: (node, context) => {
            memberAccessRefs(context, node);
        },
        call: (node, context) => {
            // 同じクラスのメソッドの呼び出し (sync(...))。this(...) / super(...) は参照にしない
            const callee = apexIdentifierOf(node.callee);
            if (callee && context.className) {
                add(
                    context,
                    'apexMethod',
                    `${context.className}.${callee}`,
                    'calls',
                    'call',
                    keysOf(node),
                );
            }
        },
        new: (node, context) => {
            newRefs(context, node);
        },
        string: (node, context) => {
            // 'callout:Name/path' (文字列のリテラル。setEndpoint の引数・定数など、どこにあっても)
            const callout = apexStringLiteralOf(node)?.match(CALLOUT);
            if (callout)
                add(context, 'namedCredential', callout[1]!, 'uses', 'callout', keysOf(node));
        },
        try: (node, context) => {
            // catch の例外の型 (catch の節は kind を持たないので、try で見る)
            for (const clause of Array.isArray(node.block) ? node.block : []) {
                if (isRecord(clause) && clause.condition === 'catch') {
                    typeRefs(context, clause.variantType, 'catch');
                }
            }
        },
        expression: (node, context) => {
            assignmentRefs(context, node);
        },
        ...Object.fromEntries(
            Object.entries(DML_KINDS).map(([operation, kind]) => [
                operation,
                (node: Json, context: ApexWalkContext) => {
                    const object = apexDmlTargetOf(context, node.field ?? node.master);
                    if (object)
                        add(context, 'object', object, kind, `dml.${operation}`, keysOf(node));
                },
            ]),
        ),
    };

    const unitType = unit.result.id.split('_')[0]!;
    if (unitType === 'trigger') {
        const name = str(content.name);
        if (name) definitions.push({ defType: 'apexTrigger', name });
        const object = str(content.object);
        if (object) {
            add(
                initialApexWalkContext(name ? { member: name } : {}),
                'object',
                object,
                'triggers',
                'trigger.object',
            );
        }
    }
    walkApexUnit({ unitType, content }, visitor, initialApexWalkContext());

    return { definitions, references: dedupe(references) };
};

/** 同じ場所の同じ参照は 1 つにする */
const dedupe = (references: UnitReference[]): UnitReference[] => {
    const seen = new Set<string>();
    return references.filter((reference) => {
        const key = JSON.stringify([
            reference.refType,
            reference.target,
            reference.kind,
            reference.via,
            reference.from.member,
            reference.from.statement?.sourceKey,
            reference.from.expression?.sourceKey,
        ]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};
