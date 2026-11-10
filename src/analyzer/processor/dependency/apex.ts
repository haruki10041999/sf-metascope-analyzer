import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { ConvertKeys } from '../../types';

import type {
    DependencyKind,
    ReferenceSite,
    UnitDefinition,
    UnitDependencies,
    UnitReference,
} from './types';

// Apex の単位 (クラス・トリガー・匿名 Apex) の定義と参照。方針: docs/analysis-plan.md 3.3
// - 定義: クラス (内側のクラスは Outer.Inner)・インターフェース・enum・メソッド・プロパティ・項目
// - 参照: SOQL / SOSL の対象 (オブジェクト・項目)、DML の対象、メソッドの呼び出し、型 (extends / implements /
//   変数の型 / new)、Label.<名前>、Schema の参照、カスタム権限 (FeatureManagement.checkPermission)、トリガーのオブジェクト、
//   カスタム設定・カスタムメタデータ型の読み取り (X__c.getInstance() / X__mdt.getInstance('Rec') など)、
//   名前を文字列などで渡すもの (Page.X / new PageReference('/apex/X') / PageReference.forResource('X') /
//   StaticResource の SOQL / Type.forName('X') / 'callout:X' / Flow.Interview.X / Label.get('', 'X'))、
//   プラットフォームイベントの発行 (EventBus.publish)。文字列はリテラルのときだけ (変数・連結は推測しない)
// - 変数の型は、メソッドの引数・ローカル変数・for の変数・クラスの項目から決める (同じ名前は内側を優先)。
//   型がクラスかオブジェクトかは決めず (apexType / apexTypeMember)、グラフで定義と突き合わせて決める

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const keysOf = (node: Json): ConvertKeys | undefined =>
    isRecord(node.sourceKeys) ? (node.sourceKeys as ConvertKeys) : undefined;

const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

/** 文の種類 (block の直下に並ぶもの) */
const isStatement = (node: Json) => typeof node.kind === 'string' && keysOf(node) !== undefined;

/** 型 ({ type: 'custom', customType } など) の中の、名前の型 (List<Account> なら Account) */
const customTypesOf = (type: unknown): string[] => {
    if (!isRecord(type)) return [];
    // . でつないだ型 (['Flow', 'Interview', 'X']) は、今は Flow.Interview.X だけを取る
    const dotted = Array.isArray(type.customType) ? type.customType.map(String).join('.') : '';
    const own = str(type.customType)
        ? [type.customType as string]
        : FLOW_INTERVIEW.test(dotted)
          ? [dotted]
          : [];
    return [
        ...own,
        ...customTypesOf(type.elementType),
        ...customTypesOf(type.keyType),
        ...customTypesOf(type.valueType),
        ...(Array.isArray(type.generic) ? type.generic.flatMap(customTypesOf) : []),
    ];
};

/** 変数の型 (List<Account> は要素の型 Account)。名前の型でなければ undefined */
const elementTypeOf = (type: unknown): string | undefined => {
    if (!isRecord(type)) return undefined;
    if (str(type.customType)) return type.customType as string;
    if (type.type === 'list' || type.type === 'set' || type.type === 'array') {
        return elementTypeOf(type.elementType);
    }
    if (type.type === 'map') return elementTypeOf(type.valueType);
    return undefined;
};

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
    const arg = Array.isArray(node.memberArg) ? node.memberArg[0] : undefined;
    const literal = isRecord(arg) ? str(arg.value) : undefined;
    return literal && /^'\w+'$/.test(literal) ? literal.slice(1, -1) : undefined;
};

/** カスタム設定の読み取りのメソッド (小文字) */
const SETTINGS_METHODS = new Set(['getinstance', 'getorgdefaults', 'getvalues', 'getall']);

const APEX_LABEL = /^(?:System\.)?Label\.(\w+)$/i;

/** Visualforce のページ (Page.X) */
const APEX_PAGE = /^(?:System\.)?Page\.(\w+)$/i;

/** Flow の型 (Flow.Interview.X) */
const FLOW_INTERVIEW = /^Flow\.Interview\.(\w+)$/i;

/** 文字列のリテラル ('...') の中身。リテラルでなければ undefined */
const literalOf = (value: unknown): string | undefined => {
    const literal = isRecord(value) ? str(value.value) : undefined;
    return literal && /^'.*'$/s.test(literal) ? literal.slice(1, -1) : undefined;
};

/** 名前空間の引数が「なし」('' か null) か */
const isNoNamespace = (value: unknown): boolean =>
    literalOf(value) === '' || (isRecord(value) && value.valueType === 'null') || value === 'null';

/**
 * 名前空間と名前を受け取る呼び出し (Type.forName('X') / Type.forName('', 'X') など) の名前。
 * 名前空間が '' / null でないとき (パッケージのもの) と、名前がリテラルでないときは undefined
 */
const namespacedNameArg = (args: unknown[], nameIndex: number): string | undefined => {
    if (nameIndex > 0 && !isNoNamespace(args[0])) return undefined;
    const name = literalOf(args[nameIndex]);
    return name && /^\w+(?:\.\w+)*$/.test(name) ? name : undefined;
};

/** 指定ログイン情報 ('callout:Name/path') */
const CALLOUT = /^callout:(\w+)/i;

/** Visualforce のページの URL ('/apex/X?id=...') */
const APEX_PAGE_URL = /^\/apex\/(\w+)(?:[?#/]|$)/i;

/** . でつないだ名前 (System.Label.Greeting)。名前だけの並びでなければ undefined */
const dottedName = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value;
    if (isRecord(value) && value.kind === 'memberAccess' && value.type === 'object') {
        const object = dottedName(value.object);
        return object === undefined ? undefined : `${object}.${String(value.member)}`;
    }
    return undefined;
};

/** 名前のスコープ (変数名 → 型) */
type Scope = Map<string, VariableType>;

/** 変数の型。collection は List / Set / Map / 配列 (メソッドは集合のもの) */
type VariableType = { type: string; collection: boolean };

type Context = {
    /** 今のメンバー (Outer.Inner.method) */
    member?: string | undefined;
    /** 今のクラス (Outer.Inner) */
    className?: string | undefined;
    statement?: ConvertKeys | undefined;
    scopes: Scope[];
};

/** Apex の単位 1 つの定義と参照 */
export const getApexDependencies = (unit: ApexUnitParseResult): UnitDependencies => {
    const definitions: UnitDefinition[] = [];
    const references: UnitReference[] = [];
    const source = unit.result.base.source as Json | undefined;
    const content = isRecord(source?.content) ? (source!.content as Json) : undefined;
    if (!content) return { definitions, references };

    const add = (
        context: Context,
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

    /** 変数の型 (Apex の名前は大文字小文字を区別しない) */
    const variableOf = (context: Context, name: string): VariableType | undefined => {
        for (let i = context.scopes.length - 1; i >= 0; i--) {
            const type = context.scopes[i]!.get(name.toLowerCase());
            if (type) return type;
        }
        return undefined;
    };
    const typeOfVariable = (context: Context, name: string): string | undefined =>
        variableOf(context, name)?.type;

    const declare = (context: Context, name: unknown, type: unknown) => {
        const element = elementTypeOf(type);
        if (typeof name !== 'string' || !element) return;
        const collection = isRecord(type) && !str(type.customType);
        context.scopes[context.scopes.length - 1]!.set(name.toLowerCase(), {
            type: element,
            collection,
        });
    };

    const typeRefs = (
        context: Context,
        type: unknown,
        via: string,
        kind: DependencyKind = 'uses',
    ) => {
        for (const name of customTypesOf(type)) {
            const keys = isRecord(type) ? keysOf(type) : undefined;
            // Flow.Interview.X 型の変数は Flow X を使う
            const flow = name.match(FLOW_INTERVIEW);
            if (flow) add(context, 'flow', flow[1]!, 'uses', 'Flow.Interview', keys);
            else add(context, 'apexType', name, kind, via, keys);
        }
    };

    /** SOQL 1 つ */
    const soqlRefs = (context: Context, soql: Json) => {
        const keys = keysOf(soql);
        const from = isRecord(soql.from) && Array.isArray(soql.from.field) ? soql.from.field : [];
        const object = from
            .map((f) => (isRecord(f) && Array.isArray(f.field) ? String(f.field[0]) : undefined))
            .find((name) => name !== undefined);
        if (!object) return;
        add(context, 'object', object, 'queries', 'soql.from', keys);
        if (object.toLowerCase() === 'staticresource') staticResourceRefs(context, soql);
        const fieldRef = (field: unknown, via: string) => {
            const name = fieldOfPath(object, field);
            if (name) add(context, 'field', name, 'reads', via, keys);
        };
        walk(soql, (node) => {
            if (node === soql) return true;
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

    /** StaticResource の SOQL の WHERE Name = 'X' / Name IN ('X', 'Y') (文字列のリテラル) の静的リソース */
    const staticResourceRefs = (context: Context, soql: Json) => {
        walk(soql.where, (node) => {
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
                    isRecord(value) && value.type === 'string' ? literalOf(value) : undefined;
                if (name && /^\w+$/.test(name)) {
                    add(context, 'staticResource', name, 'uses', 'soql.where', keysOf(soql));
                }
            }
            return false;
        });
    };

    /** SOSL 1 つ */
    const soslRefs = (context: Context, sosl: Json) => {
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

    /** DML の対象 (変数・SOQL・new) のオブジェクト */
    const dmlTarget = (context: Context, field: unknown): string | undefined => {
        if (typeof field === 'string') return typeOfVariable(context, field);
        if (Array.isArray(field)) return dmlTarget(context, field[0]);
        if (!isRecord(field)) return undefined;
        if (field.kind === 'soql' && isRecord(field.from) && Array.isArray(field.from.field)) {
            const first = field.from.field[0];
            return isRecord(first) && Array.isArray(first.field)
                ? String(first.field[0])
                : undefined;
        }
        if (Array.isArray(field.collection)) return String(field.collection[0]);
        if ('value' in field) return dmlTarget(context, field.value);
        return undefined;
    };

    /**
     * カスタム設定 (X__c) ・カスタムメタデータ型 (X__mdt) の読み取りの呼び出し (X__c.getInstance() など)。
     * single はレコード 1 つを返すもの (続く .Field__c を項目の読み取りにする)
     */
    const settingsCallOf = (
        node: Json,
    ): { type: string; single: boolean; via: string; record?: string } | undefined => {
        if (node.kind !== 'memberAccess' || node.type !== 'method') return undefined;
        const object = str(node.object);
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
    const settingsRefs = (context: Context, node: Json): boolean => {
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
    const memberAccessRefs = (context: Context, node: Json) => {
        const keys = keysOf(node);
        const member = str(node.member);
        if (!member) return;
        const dotted = dottedName(node);
        const label = dotted?.match(APEX_LABEL);
        if (label) {
            add(context, 'customLabel', label[1]!, 'uses', 'Label', keys);
            return;
        }
        // Page.X (Page という名前の変数のメンバーは除く)
        const page = dotted?.match(APEX_PAGE);
        if (page && !variableOf(context, dotted!.split('.')[0]!)) {
            add(context, 'visualforcePage', page[1]!, 'uses', 'Page', keys);
            return;
        }
        const object = node.object;
        if (node.type === 'method') {
            stringArgRefs(context, node);
            // FeatureManagement.checkPermission('Name')
            if (
                object === 'FeatureManagement' &&
                /^check(Permission)$/i.test(member) &&
                Array.isArray(node.memberArg)
            ) {
                const arg = node.memberArg[0];
                const literal = isRecord(arg) ? str(arg.value) : undefined;
                if (literal && /^'.*'$/.test(literal)) {
                    add(
                        context,
                        'customPermission',
                        literal.slice(1, -1),
                        'uses',
                        'FeatureManagement',
                        keys,
                    );
                }
            }
            if (settingsRefs(context, node)) return;
            if (typeof object === 'string' && object !== 'this' && object !== 'super') {
                const variable = variableOf(context, object);
                // 集合のメソッド (accounts.size()) と、型の分からない変数 (小文字で始まる名前) は参照にしない
                if (variable?.collection) return;
                if (!variable && /^[a-z]/.test(object)) return;
                add(
                    context,
                    'apexTypeMember',
                    `${variable?.type ?? object}.${member}`,
                    'calls',
                    'call',
                    keys,
                );
            } else if (
                object === undefined &&
                member !== 'this' &&
                member !== 'super' &&
                context.className
            ) {
                // 同じクラスのメソッドの呼び出し (sync(...))
                add(context, 'apexMethod', `${context.className}.${member}`, 'calls', 'call', keys);
            }
            return;
        }
        // 設定の読み取りの結果の項目 (Conf__c.getInstance().Rate__c)
        if (node.type === 'object' && isRecord(object)) {
            const owner = settingsCallOf(object);
            if (owner?.single) {
                add(context, 'field', `${owner.type}.${member}`, 'reads', owner.via, keys);
                return;
            }
        }
        if (node.type === 'object' && typeof object === 'string') {
            // Schema.SObjectType.Account / Account.SObjectType / Schema.Account
            if (dotted) {
                const schema = dotted.match(
                    /^(?:Schema\.)?SObjectType\.(\w+)(?:\.fields\.(\w+))?/i,
                );
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
            if (object === 'this' || object === 'super') return;
            const variable = variableOf(context, object);
            if (variable && !variable.collection) {
                add(
                    context,
                    'apexTypeMember',
                    `${variable.type}.${member}`,
                    'reads',
                    'member',
                    keys,
                );
            }
        }
    };

    /**
     * 名前を文字列の引数で渡す標準のメソッドの呼び出し (文字列のリテラルのときだけ)。
     * PageReference.forResource('X') / Type.forName('X') / Flow.Interview.createInterview('X', …) /
     * Label.get('', 'X')、と EventBus.publish (プラットフォームイベントの発行)
     */
    const stringArgRefs = (context: Context, node: Json) => {
        const keys = keysOf(node);
        const owner = dottedName(node.object)
            ?.replace(/^System\./i, '')
            .toLowerCase();
        const member = str(node.member)?.toLowerCase();
        const args: unknown[] = Array.isArray(node.memberArg) ? node.memberArg : [];
        if (!owner || !member || variableOf(context, owner.split('.')[0]!)) return;
        const call = `${owner}.${member}`;
        if (call === 'pagereference.forresource') {
            // forResource('Name') / forResource('Name', 'path/in/zip')
            const name = literalOf(args[0]);
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

    /** 発行するプラットフォームイベント (X__e) の名前 */
    const eventTypeOf = (context: Context, arg: unknown): string | undefined => {
        let type: string | undefined;
        if (typeof arg === 'string') type = typeOfVariable(context, arg);
        else if (isRecord(arg) && Array.isArray(arg.collection)) {
            const created = arg.collection.map(String).join('.');
            // new List<X__e>{ ... }
            type = /^(List|Set)$/i.test(created)
                ? customTypesOf(Array.isArray(arg.generic) ? arg.generic[0] : undefined)[0]
                : created;
        }
        return type && /__e$/i.test(type) ? type : undefined;
    };

    /** 代入の左辺 (acc.Name = ...) の項目は writes */
    const assignmentRefs = (context: Context, node: Json) => {
        const value = node.value;
        if (!isRecord(value) || typeof value.operator !== 'string' || !/=$/.test(value.operator))
            return;
        if (['==', '!=', '<=', '>=', '==='].includes(value.operator)) return;
        const left = value.left;
        if (!isRecord(left) || left.kind !== 'memberAccess' || left.type !== 'object') return;
        const object = str(left.object);
        const member = str(left.member);
        const variable = object ? variableOf(context, object) : undefined;
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

    /**
     * node の下を深さ優先でたどる。visit が false を返したら、その下は見ない
     */
    const walk = (node: unknown, visit: (node: Json) => boolean) => {
        if (Array.isArray(node)) {
            node.forEach((child) => walk(child, visit));
            return;
        }
        if (!isRecord(node)) return;
        if (!visit(node)) return;
        for (const [key, child] of Object.entries(node)) {
            if (key === 'sourceKeys') continue;
            walk(child, visit);
        }
    };

    /** 宣言・文・式をたどって、定義と参照を集める */
    const visit = (node: unknown, context: Context): void => {
        if (Array.isArray(node)) {
            for (const child of node) visit(child, context);
            return;
        }
        if (!isRecord(node)) return;
        const kind = str(node.kind);
        const keys = keysOf(node);

        switch (kind) {
            case 'class':
            case 'interface':
            case 'enum': {
                const name = str(node.name);
                if (!name) return;
                const className = context.className ? `${context.className}.${name}` : name;
                definitions.push({
                    defType: 'apexClass',
                    name: className,
                    ...(keys ? { sourceKeys: keys } : {}),
                });
                const inner: Context = {
                    member: className,
                    className,
                    statement: keys,
                    scopes: [...context.scopes, new Map()],
                };
                if (node.extend) typeRefs(inner, node.extend, 'extends', 'extends');
                for (const type of Array.isArray(node.implement) ? node.implement : []) {
                    typeRefs(inner, type, 'implements', 'implements');
                }
                // 項目・プロパティの型を先に登録する (メソッドから使う)
                for (const member of Array.isArray(node.block) ? node.block : []) {
                    if (!isRecord(member)) continue;
                    if (member.kind === 'field' && Array.isArray(member.variants)) {
                        for (const variant of member.variants) {
                            if (isRecord(variant)) declare(inner, variant.name, member.variantType);
                        }
                    } else if (member.kind === 'property') {
                        declare(inner, member.name, member.type ?? member.propertyType);
                    }
                }
                visit(node.block, inner);
                return;
            }
            case 'method':
            case 'constructor':
            case 'interfaceMethod':
            case 'property': {
                const name =
                    str(node.name) ??
                    (kind === 'constructor' ? context.className?.split('.').pop() : undefined);
                const member =
                    context.className && name ? `${context.className}.${name}` : context.member;
                if (name && context.className && kind !== 'constructor') {
                    definitions.push({
                        defType: kind === 'property' ? 'apexProperty' : 'apexMethod',
                        name: member!,
                        ...(keys ? { sourceKeys: keys } : {}),
                    });
                }
                const inner: Context = {
                    ...context,
                    member,
                    statement: keys,
                    scopes: [...context.scopes, new Map()],
                };
                if (isRecord(node.returnType)) typeRefs(inner, node.returnType, 'returnType');
                for (const param of Array.isArray(node.param) ? node.param : []) {
                    if (!isRecord(param)) continue;
                    declare(inner, param.variant, param.variantType);
                    typeRefs(inner, param.variantType, 'parameter');
                }
                if (kind === 'property')
                    typeRefs(inner, node.type ?? node.propertyType, 'property');
                visit(node.block ?? node.accessor ?? node.content, inner);
                return;
            }
            case 'field': {
                const inner: Context = { ...context, statement: keys ?? context.statement };
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
                typeRefs(inner, node.variantType, 'field');
                visit(node.variants, inner);
                return;
            }
            case 'type':
                typeRefs(context, node, 'type');
                return;
            case 'soql':
                soqlRefs(context, node);
                // バインド変数・サブクエリの中も見る
                visitChildren(node, context);
                return;
            case 'sosl':
                soslRefs(context, node);
                return;
            case 'memberAccess':
                memberAccessRefs(context, node);
                visitChildren(node, context);
                return;
            default:
                break;
        }

        // 文 (block の中の 1 つ)。ローカル変数・for の変数を登録する
        const inner: Context =
            kind && isStatement(node) && node !== undefined
                ? { ...context, statement: keys ?? context.statement }
                : context;
        if (kind === 'localVariable' && isRecord(node.variable)) {
            for (const variant of Array.isArray(node.variable.variants)
                ? node.variable.variants
                : []) {
                if (isRecord(variant)) declare(inner, variant.name, node.variable.variantsType);
            }
        }
        if (kind === 'forCondition') declare(inner, node.initializer, node.initializeType);
        if (kind === 'catchCondition' && Array.isArray(node.exceptionType)) {
            const exceptionType = node.exceptionType.map(String).join('.');
            declare(inner, node.exception, { type: 'custom', customType: exceptionType });
            add(inner, 'apexType', exceptionType, 'uses', 'catch', keys);
        }
        if (kind && DML_KINDS[kind]) {
            const object = dmlTarget(inner, node.field);
            if (object) add(inner, 'object', object, DML_KINDS[kind]!, `dml.${kind}`, keys);
        }
        if (kind === 'expression') assignmentRefs(inner, node);
        if (Array.isArray(node.collection) && node.collection.length) {
            // new X(...) / new List<X>()
            const created = node.collection.map(String).join('.');
            const flow = created.match(FLOW_INTERVIEW);
            if (flow) {
                // new Flow.Interview.X(params) は Flow X の呼び出し
                add(inner, 'flow', flow[1]!, 'calls', 'Flow.Interview', keysOf(node));
            } else if (!/^(List|Set|Map)$/i.test(created)) {
                add(inner, 'apexType', created, 'creates', 'new', keysOf(node));
            }
            // new PageReference('/apex/X')
            const url = /^(System\.)?PageReference$/i.test(created)
                ? literalOf(Array.isArray(node.arg) ? node.arg[0] : undefined)?.match(APEX_PAGE_URL)
                : undefined;
            if (url) add(inner, 'visualforcePage', url[1]!, 'uses', 'PageReference', keysOf(node));
        }
        // 'callout:Name/path' (文字列のリテラル。setEndpoint の引数・定数など、どこにあっても)
        if (node.valueType === 'string') {
            const callout = literalOf(node)?.match(CALLOUT);
            if (callout) add(inner, 'namedCredential', callout[1]!, 'uses', 'callout', keys);
        }
        visitChildren(node, inner);
    };

    const visitChildren = (node: Json, context: Context) => {
        for (const [key, child] of Object.entries(node)) {
            if (key === 'sourceKeys' || key === 'kind') continue;
            visit(child, context);
        }
    };

    const unitType = unit.result.id.split('_')[0];
    const rootContext: Context = { scopes: [new Map()] };
    if (unitType === 'trigger') {
        const name = str(content.name);
        if (name) definitions.push({ defType: 'apexTrigger', name });
        const object = str(content.object);
        const trigger: Context = { ...rootContext, ...(name ? { member: name } : {}) };
        if (object) add(trigger, 'object', object, 'triggers', 'trigger.object');
        visit(content.block, trigger);
    } else if (unitType === 'anonymous') {
        visit(content.block, rootContext);
    } else {
        visit(content, rootContext);
    }

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
