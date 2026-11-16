import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { BaseExpressionJson, ConvertKeys } from '../../types';

import {
    type ApexVisitor,
    type ApexWalkContext,
    apexDottedNameOf,
    apexElementTypeOf,
    apexIdentifierOf,
    apexVariableOf,
    initialApexWalkContext,
    walkApexParseResult,
} from './walker';

// Apex の派生の情報 (docs/json-redesign-plan.md の段階 A3、docs/apex-json-review.md 3.3・6.1 の D・I)。
// LWC の LwcCallInfo と同じく、kind を持たず、元のノードの sourceKeys と解析の文脈を持つ。
// 呼び出し・DML・クエリ・トリガーの文脈を、共通の走査 (walker.ts) で 1 回たどって出す

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

const keysOf = (node: Json): ConvertKeys => node.sourceKeys as ConvertKeys;

/** 派生の情報の文脈 (どのメンバーの、ループ・try の中か、テストの中か) */
export type ApexInfoContext = Pick<
    ApexWalkContext,
    'member' | 'loopDepth' | 'nestingDepth' | 'inTry' | 'isTest'
>;

const infoContextOf = (context: ApexWalkContext): ApexInfoContext => ({
    ...(context.member ? { member: context.member } : {}),
    loopDepth: context.loopDepth,
    nestingDepth: context.nestingDepth,
    inTry: context.inTry,
    isTest: context.isTest,
});

/** DML の操作 */
export type ApexDmlOperation = 'insert' | 'update' | 'upsert' | 'delete' | 'undelete' | 'merge';

export const APEX_DML_OPERATIONS: ReadonlySet<string> = new Set<ApexDmlOperation>([
    'insert',
    'update',
    'upsert',
    'delete',
    'undelete',
    'merge',
]);

/**
 * 呼び出しの種類。
 * method: ほかのメソッドの呼び出し / constructor: this(...) / super(...) / dml: Database.insert など /
 * dynamicQuery: Database.query など / async: System.enqueueJob・Database.executeBatch・System.schedule /
 * callout: Http の send / assert: System.assert*・Assert.* / publish: EventBus.publish / debug: System.debug
 */
export type ApexCallType =
    | 'method'
    | 'constructor'
    | 'dml'
    | 'dynamicQuery'
    | 'async'
    | 'callout'
    | 'assert'
    | 'publish'
    | 'debug';

export type ApexCallInfo = {
    /** 呼び出しの式の位置 */
    sourceKeys: ConvertKeys;
    callType: ApexCallType;
    /**
     * 呼び出しの持ち主。型の名前 (Database・AccountService)、変数の型 (acc.save() の Account)、
     * 同じクラスのメソッド・this.f() はそのクラス、this(...) / super(...) はなし
     */
    owner?: string;
    /** メソッドの名前 (this(...) / super(...) は this / super) */
    method: string;
    /** owner が変数の型のとき、その変数の名前 */
    variable?: string;
    /** 引数の式 (JSON のノードそのもの) */
    args: BaseExpressionJson[];
    context: ApexInfoContext;
};

export type ApexDmlInfo = {
    /** DML の文か、Database のメソッドの呼び出しの位置 */
    sourceKeys: ConvertKeys;
    operation: ApexDmlOperation;
    /** statement: DML の文 / database: Database.insert などのメソッド */
    via: 'statement' | 'database';
    /** 対象のオブジェクト (変数の型・SOQL・new から分かるとき) */
    object?: string;
    /** Database のメソッドの allOrNone (第 2 引数が真偽値のリテラルのとき) */
    allOrNone?: boolean;
    /** AccessLevel.USER_MODE など (文の as user / as system、メソッドの AccessLevel の引数) */
    accessLevel?: string;
    context: ApexInfoContext;
};

export type ApexQueryInfo = {
    /** クエリ (SOQL・SOSL・Database.query の呼び出し) の位置 */
    sourceKeys: ConvertKeys;
    language: 'soql' | 'sosl' | 'dynamic';
    /** 対象のオブジェクト (SOQL の FROM、SOSL の RETURNING。動的なものはなし) */
    objects: string[];
    context: ApexInfoContext;
};

/** トリガーの文脈の変数 (Trigger.new / Trigger.isBefore など) */
export type ApexTriggerContextInfo = {
    sourceKeys: ConvertKeys;
    /** new / old / newMap / oldMap / isBefore / isInsert / operationType など */
    variable: string;
    context: ApexInfoContext;
};

export type ApexUnitInfo = {
    calls: ApexCallInfo[];
    dml: ApexDmlInfo[];
    queries: ApexQueryInfo[];
    triggerContexts: ApexTriggerContextInfo[];
};

// ---------------------------------------------------------------------------
// 共通の部品 (依存関係からも使う)
// ---------------------------------------------------------------------------

/** SOQL・サブクエリの FROM の最初の名前 */
export const apexSoqlObjectOf = (query: Json): string | undefined => {
    const from = isRecord(query.from) && Array.isArray(query.from.field) ? query.from.field : [];
    return from
        .map((f) => (isRecord(f) && Array.isArray(f.field) ? String(f.field[0]) : undefined))
        .find((name) => name !== undefined);
};

/** SOSL の RETURNING のオブジェクト */
export const apexSoslObjectsOf = (sosl: Json): string[] =>
    (Array.isArray(sosl.fieldSpec) ? sosl.fieldSpec : []).flatMap((spec) =>
        isRecord(spec) && Array.isArray(spec.object) ? [String(spec.object[0])] : [],
    );

/** DML の対象 (変数・SOQL・new) のオブジェクト */
export const apexDmlTargetOf = (context: ApexWalkContext, field: unknown): string | undefined => {
    if (Array.isArray(field)) return apexDmlTargetOf(context, field[0]);
    if (!isRecord(field)) return undefined;
    switch (field.kind) {
        case 'identifier':
            return apexVariableOf(context, String(field.name))?.type;
        case 'soql':
            return apexSoqlObjectOf(field);
        case 'new':
            // new Account(...) (List<Account> などの集合は要素の型)
            return apexElementTypeOf(field.newType);
        case 'parenthesized':
        case 'cast':
            return apexDmlTargetOf(context, field.expression);
        default:
            return undefined;
    }
};

/** 呼び出しの持ち主の名前 (System. を除いた . でつないだ名前、小文字)。変数なら undefined */
const staticOwnerOf = (context: ApexWalkContext, object: unknown): string | undefined => {
    const dotted = apexDottedNameOf(object);
    if (!dotted || apexVariableOf(context, dotted.split('.')[0]!)) return undefined;
    return dotted.replace(/^System\./i, '').toLowerCase();
};

const DYNAMIC_QUERY_METHODS = new Set([
    'database.query',
    'database.querywithbinds',
    'database.countquery',
    'database.countquerywithbinds',
    'database.getquerylocator',
    'database.getquerylocatorwithbinds',
    'search.query',
]);

const ASYNC_METHODS = new Set([
    'system.enqueuejob',
    'database.executebatch',
    'system.schedule',
    'system.schedulebatch',
]);

const TRIGGER_VARIABLES = new Set([
    'new',
    'old',
    'newmap',
    'oldmap',
    'isbefore',
    'isafter',
    'isinsert',
    'isupdate',
    'isdelete',
    'isundelete',
    'isexecuting',
    'size',
    'operationtype',
]);

/**
 * 呼び出しの種類。owner は System. を除いた小文字の型の名前 (変数のメンバーなら undefined)、method は小文字、
 * ownerType は持ち主の変数・new の型
 */
const callTypeOf = (
    owner: string | undefined,
    method: string,
    ownerType: string | undefined,
): ApexCallType => {
    const call = `${owner ?? ''}.${method}`;
    if (owner === 'database' && APEX_DML_OPERATIONS.has(method)) return 'dml';
    if (DYNAMIC_QUERY_METHODS.has(call)) return 'dynamicQuery';
    if (ASYNC_METHODS.has(call)) return 'async';
    if (call === 'eventbus.publish') return 'publish';
    if (call === 'system.debug') return 'debug';
    if ((owner === 'system' && /^assert/.test(method)) || owner === 'assert') return 'assert';
    if (ownerType?.toLowerCase() === 'http' && method === 'send') return 'callout';
    return 'method';
};

/** AccessLevel.USER_MODE などの引数の名前 */
const accessLevelOf = (args: unknown[]): string | undefined =>
    args
        .map((arg) => apexDottedNameOf(arg))
        .find((name) => name !== undefined && /^(System\.)?AccessLevel\.\w+$/i.test(name))
        ?.replace(/^(System\.)?AccessLevel\./i, '');

// ---------------------------------------------------------------------------
// 解析
// ---------------------------------------------------------------------------

/** 派生の情報を集める Visitor (結果は info に足す) */
export const makeApexInfoVisitor = (info: ApexUnitInfo): ApexVisitor => ({
    memberAccess: (node, context) => {
        // トリガーの文脈 (Trigger.new など)
        if (node.type === 'object') {
            const dotted = apexDottedNameOf(node);
            const match = dotted?.match(/^(?:System\.)?Trigger\.(\w+)$/i);
            if (
                match &&
                TRIGGER_VARIABLES.has(match[1]!.toLowerCase()) &&
                !apexVariableOf(context, 'Trigger')
            ) {
                info.triggerContexts.push({
                    sourceKeys: keysOf(node),
                    variable: match[1]!,
                    context: infoContextOf(context),
                });
            }
            return;
        }
        const method = String(node.member);
        const args = (Array.isArray(node.memberArg) ? node.memberArg : []) as BaseExpressionJson[];
        const object = node.object;
        const variableName = apexIdentifierOf(object);
        const variable = variableName ? apexVariableOf(context, variableName) : undefined;
        const ownerName = staticOwnerOf(context, object);
        let owner: string | undefined;
        if (isRecord(object) && object.kind === 'this') owner = context.className;
        else if (variable) owner = variable.type;
        // System.Database.insert の持ち主は Database (System. の後ろに名前があるとき)
        else owner = apexDottedNameOf(object)?.replace(/^System\.(?=\w)/i, '');
        // new Http().send(req) も callout
        const createdType =
            isRecord(object) && object.kind === 'new'
                ? apexElementTypeOf(object.newType)
                : undefined;
        const callType = callTypeOf(ownerName, method.toLowerCase(), variable?.type ?? createdType);
        info.calls.push({
            sourceKeys: keysOf(node),
            callType,
            ...(owner ? { owner } : createdType ? { owner: createdType } : {}),
            method,
            ...(variable && variableName ? { variable: variableName } : {}),
            args,
            context: infoContextOf(context),
        });
        if (callType === 'dml') {
            const allOrNone = args[1];
            info.dml.push({
                sourceKeys: keysOf(node),
                operation: method.toLowerCase() as ApexDmlOperation,
                via: 'database',
                ...(() => {
                    const target = apexDmlTargetOf(context, args[0]);
                    return target ? { object: target } : {};
                })(),
                ...(isRecord(allOrNone) && allOrNone.kind === 'boolean'
                    ? { allOrNone: allOrNone.value === true }
                    : {}),
                ...(() => {
                    const level = accessLevelOf(args);
                    return level ? { accessLevel: level } : {};
                })(),
                context: infoContextOf(context),
            });
        }
        if (callType === 'dynamicQuery') {
            info.queries.push({
                sourceKeys: keysOf(node),
                language: 'dynamic',
                objects: [],
                context: infoContextOf(context),
            });
        }
    },
    call: (node, context) => {
        const callee = isRecord(node.callee) ? node.callee : {};
        const constructor = callee.kind === 'this' || callee.kind === 'super';
        const method = constructor ? String(callee.kind) : String(callee.name);
        info.calls.push({
            sourceKeys: keysOf(node),
            callType: constructor ? 'constructor' : 'method',
            ...(!constructor && context.className ? { owner: context.className } : {}),
            method,
            args: (Array.isArray(node.arg) ? node.arg : []) as BaseExpressionJson[],
            context: infoContextOf(context),
        });
    },
    soql: (node, context) => {
        const object = apexSoqlObjectOf(node);
        info.queries.push({
            sourceKeys: keysOf(node),
            language: 'soql',
            objects: object ? [object] : [],
            context: infoContextOf(context),
        });
    },
    sosl: (node, context) => {
        info.queries.push({
            sourceKeys: keysOf(node),
            language: 'sosl',
            objects: apexSoslObjectsOf(node),
            context: infoContextOf(context),
        });
    },
    ...Object.fromEntries(
        [...APEX_DML_OPERATIONS].map((operation) => [
            operation,
            (node: Json, context: ApexWalkContext) => {
                // merge は統合先のレコード (master) の型
                const object = apexDmlTargetOf(context, node.field ?? node.master);
                const accessLevel = str(node.accessLevel);
                info.dml.push({
                    sourceKeys: keysOf(node),
                    operation: operation as ApexDmlOperation,
                    via: 'statement',
                    ...(object ? { object } : {}),
                    ...(accessLevel ? { accessLevel } : {}),
                    context: infoContextOf(context),
                });
            },
        ]),
    ),
});

/** Apex の単位 1 つの派生の情報 (呼び出し・DML・クエリ・トリガーの文脈) */
export const analyzeApexUnit = (unit: ApexUnitParseResult): ApexUnitInfo => {
    const info: ApexUnitInfo = { calls: [], dml: [], queries: [], triggerContexts: [] };
    walkApexParseResult(unit, makeApexInfoVisitor(info), initialApexWalkContext());
    return info;
};
