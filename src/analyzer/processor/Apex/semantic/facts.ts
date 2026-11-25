import type { BaseExpressionJson, ConvertKeys } from '../../../types';
import type { ApexBodySemantics, ApexResolvedCall, ApexSemanticAnalysis } from './analyze';
import { namePathOf } from './call';
import { apexMemberNamesOf } from './members';
import type { ApexTypeRef } from './type';

// 単位の呼び出し・DML・クエリ・トリガーの文脈 (report の apex.dataAccess・呼び出しの流れが使う)。
// 解析の結果 (analyze.ts) から作る。呼び出しの種類は、文字の並びでなく、レシーバーの型を標準の型に照合した結果で決める
// (docs/plan.md 10 章 P2「古い処理からの移行」。以前の Apex/calls.ts の analyzeApexUnit を置き換える)

/** 事実の文脈 (どのメンバーの、ループの中か、テストの中か) */
export type ApexFactContext = {
    /** クラス.メソッド など (dependencies.ts の参照の member と同じ。匿名 Apex は なし) */
    member?: string;
    inLoop: boolean;
    isTest: boolean;
    /** それを含む、いちばん内側の文の位置 (処理フローの文の分類に使う) */
    statement?: ConvertKeys;
    /** それを含む実行本体の ID (メトリクスで本体ごとにまとめる。getter・setter は member が同じなので分ける) */
    bodyId: string;
};

export type ApexDmlOperation = 'insert' | 'update' | 'upsert' | 'delete' | 'undelete' | 'merge';

/**
 * 呼び出しの種類。
 * method: ほかのメソッドの呼び出し / constructor: this(...) / super(...) / dml: Database.insert・convertLead など /
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

export type ApexCallFact = {
    /** 呼び出しの式の位置 */
    sourceKeys: ConvertKeys;
    callType: ApexCallType;
    /**
     * 呼び出しの持ち主の型の名前。静的な呼び出しは書いた名前 (System. は外す)、変数・式は型の名前、
     * レシーバーのない呼び出し・this.f() は宣言のある型 (分からなければ所有する型)。this(...) / super(...) はなし
     */
    owner?: string;
    /** メソッドの名前 (this(...) / super(...) は this / super) */
    method: string;
    /** 引数の式 (JSON のノードそのもの) */
    args: BaseExpressionJson[];
    context: ApexFactContext;
};

export type ApexDmlFact = {
    /** DML の文か、Database のメソッドの呼び出しの位置 */
    sourceKeys: ConvertKeys;
    operation: ApexDmlOperation;
    /** statement: DML の文 / database: Database.insert などのメソッド */
    via: 'statement' | 'database';
    /** 対象のオブジェクト (List・Set は要素の型、Map は値の型) */
    object?: string;
    /** Database のメソッドの allOrNone (第 2 引数が真偽値のリテラルのとき) */
    allOrNone?: boolean;
    /** USER_MODE など (Database のメソッドの AccessLevel の引数)、USER・SYSTEM (文の as user / as system) */
    accessLevel?: string;
    context: ApexFactContext;
};

export type ApexQueryFact = {
    /** クエリ (SOQL・SOSL・Database.query などの呼び出し) の位置 */
    sourceKeys: ConvertKeys;
    language: 'soql' | 'sosl' | 'dynamic';
    /** 対象のオブジェクト (SOQL の FROM、SOSL の RETURNING。動的なものはなし) */
    objects: string[];
    context: ApexFactContext;
};

/** トリガーの文脈の変数 (Trigger.new / Trigger.isBefore など) */
export type ApexTriggerContextFact = {
    sourceKeys: ConvertKeys;
    /** new / old / newMap / oldMap / isBefore / isInsert / operationType など (書いたまま) */
    variable: string;
    context: ApexFactContext;
};

export type ApexUnitFacts = {
    calls: ApexCallFact[];
    dml: ApexDmlFact[];
    queries: ApexQueryFact[];
    triggerContexts: ApexTriggerContextFact[];
};

const DML_OPERATIONS = new Set(['insert', 'update', 'upsert', 'delete', 'undelete', 'merge']);

/** 標準の型 (完全修飾名の最後の名前、小文字) とメソッド (小文字) → 呼び出しの種類 */
const STANDARD_CALL_TYPES: Readonly<Record<string, ApexCallType>> = {
    'database.query': 'dynamicQuery',
    'database.querywithbinds': 'dynamicQuery',
    'database.countquery': 'dynamicQuery',
    'database.countquerywithbinds': 'dynamicQuery',
    'database.getquerylocator': 'dynamicQuery',
    'database.getquerylocatorwithbinds': 'dynamicQuery',
    'search.query': 'dynamicQuery',
    'system.enqueuejob': 'async',
    'database.executebatch': 'async',
    'system.schedule': 'async',
    'system.schedulebatch': 'async',
    'eventbus.publish': 'publish',
    'system.debug': 'debug',
    'http.send': 'callout',
    // 変換のメソッド (DML の操作の一覧にはないが、レコードを書き換える)
    'database.convertlead': 'dml',
};

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

/** 標準の型の完全修飾名の最後の名前 (小文字)。標準の型でなければ undefined */
const standardTypeNameOf = (type: ApexTypeRef | undefined): string | undefined => {
    const named = type?.kind === 'static' ? type.type : type?.kind === 'named' ? type : undefined;
    if (named?.standard?.kind !== 'type') return undefined;
    return named.standard.qualifiedName.split('.').pop()?.toLowerCase();
};

/** 型の名前 (List・Set は要素、Map は値)。名前の型でなければ undefined */
const objectNameOf = (type: ApexTypeRef | undefined): string | undefined => {
    if (!type) return undefined;
    if (type.kind === 'list' || type.kind === 'set') return objectNameOf(type.element);
    if (type.kind === 'map') return objectNameOf(type.value);
    return type.kind === 'named' ? type.name.join('.') : undefined;
};

/** AccessLevel.USER_MODE などの引数の名前 */
const accessLevelOf = (call: ApexResolvedCall): string | undefined => {
    for (const ref of call.argRefs) {
        const path = namePathOf(ref);
        const match = path?.join('.').match(/^(?:System\.)?AccessLevel\.(\w+)$/i);
        if (match) return match[1];
    }
    return undefined;
};

/** 解析の結果から、単位の呼び出し・DML・クエリ・トリガーの文脈を作る */
export const apexUnitFactsOf = (analysis: ApexSemanticAnalysis): ApexUnitFacts => {
    const names = apexMemberNamesOf(analysis.declarations);
    const facts: ApexUnitFacts = { calls: [], dml: [], queries: [], triggerContexts: [] };
    for (const semantics of analysis.bodies) bodyFacts(semantics);
    return facts;

    function bodyFacts(semantics: ApexBodySemantics) {
        const declaration = names.byId.get(semantics.body.id);
        const member = names.memberOf(declaration);
        const isTest = names.isTestOf(declaration);
        const contextOf = (inLoop: boolean, keys: ConvertKeys): ApexFactContext => {
            const statement = semantics.statementOf[keys.sourceKey];
            return {
                ...(member ? { member } : {}),
                inLoop,
                isTest,
                ...(statement ? { statement } : {}),
                bodyId: semantics.body.id,
            };
        };
        const ownerType = names.ownerTypeOf(declaration);

        for (const call of semantics.calls) {
            if (call.kind === 'new') continue;
            const context = contextOf(call.inLoop, call.sourceKeys);
            if (call.kind === 'constructor') {
                facts.calls.push({
                    sourceKeys: call.sourceKeys,
                    callType: 'constructor',
                    method: call.name,
                    args: call.args,
                    context,
                });
                continue;
            }
            const owner = ownerOf(call);
            const callType = callTypeOf(call);
            facts.calls.push({
                sourceKeys: call.sourceKeys,
                callType,
                ...(owner ? { owner } : {}),
                method: call.name,
                args: call.args,
                context,
            });
            if (callType === 'dml' && DML_OPERATIONS.has(call.name.toLowerCase())) {
                const object = objectNameOf(call.argTypes[0]);
                const allOrNone = call.args[1];
                const accessLevel = accessLevelOf(call);
                facts.dml.push({
                    sourceKeys: call.sourceKeys,
                    operation: call.name.toLowerCase() as ApexDmlOperation,
                    via: 'database',
                    ...(object ? { object } : {}),
                    ...(allOrNone?.kind === 'boolean' ? { allOrNone: allOrNone.value } : {}),
                    ...(accessLevel ? { accessLevel } : {}),
                    context,
                });
            }
            if (callType === 'dynamicQuery') {
                facts.queries.push({
                    sourceKeys: call.sourceKeys,
                    language: 'dynamic',
                    objects: [],
                    context,
                });
            }
        }

        for (const dml of semantics.dml) {
            const object = objectNameOf(dml.valueType);
            facts.dml.push({
                sourceKeys: dml.sourceKeys,
                operation: dml.operation,
                via: 'statement',
                ...(object ? { object } : {}),
                ...(dml.accessLevel ? { accessLevel: dml.accessLevel } : {}),
                context: contextOf(dml.inLoop, dml.sourceKeys),
            });
        }

        for (const query of semantics.queries) {
            if (query.role !== 'query') continue;
            facts.queries.push({
                sourceKeys: query.sourceKeys,
                language: query.kind,
                objects: query.objects.map((o) => o.name),
                context: contextOf(query.inLoop, query.sourceKeys),
            });
        }

        for (const access of semantics.memberAccesses) {
            if (
                access.objectType.kind === 'static' &&
                standardTypeNameOf(access.objectType) === 'trigger' &&
                TRIGGER_VARIABLES.has(access.member.toLowerCase())
            ) {
                facts.triggerContexts.push({
                    sourceKeys: access.sourceKeys,
                    variable: access.member,
                    // メンバーの参照はループの中かを持たない (トリガーの文脈では使わない)
                    context: contextOf(false, access.sourceKeys),
                });
            }
        }

        /** 呼び出しの持ち主の型の名前 */
        function ownerOf(call: ApexResolvedCall): string | undefined {
            // 単位の中のメソッドに決まったら、その宣言のある型
            const target =
                call.candidateIds.length === 1 ? names.byId.get(call.candidateIds[0]!) : undefined;
            const targetType = target ? names.ownerTypeOf(names.ownerOf(target)) : undefined;
            if (targetType) return names.qualifiedOf(targetType);
            const receiver = call.receiver;
            if (!receiver || receiver.kind === 'this') {
                return ownerType ? names.qualifiedOf(ownerType) : undefined;
            }
            if (receiver.kind === 'super') return undefined;
            const type = call.receiverType;
            if (type?.kind === 'primitive') return type.name;
            if (type?.kind === 'static') {
                const path = namePathOf(receiver) ?? type.type.name;
                return path.join('.').replace(/^System\.(?=\w)/i, '');
            }
            if (type?.kind === 'named') {
                return type.declarationId
                    ? names.qualifiedOf(names.byId.get(type.declarationId)!)
                    : type.name.join('.');
            }
            // 分からない名前 (ほかの単位の型 AccountService など)。小文字で始まる名前は変数とみなす
            if (type?.kind === 'unknown' && type.reason === 'unresolvedName') {
                const path = namePathOf(receiver);
                if (path && /^[A-Z]/.test(path[0] ?? '')) {
                    return path.join('.').replace(/^System\.(?=\w)/i, '');
                }
            }
            return undefined;
        }
    }
};

/** 呼び出しの種類 (レシーバーの型を標準の型に照合した結果で決める) */
const callTypeOf = (call: ApexResolvedCall): ApexCallType => {
    const type = standardTypeNameOf(call.receiverType);
    if (!type) return 'method';
    const method = call.name.toLowerCase();
    if (type === 'database' && DML_OPERATIONS.has(method)) return 'dml';
    if (type === 'assert' || (type === 'system' && method.startsWith('assert'))) return 'assert';
    return STANDARD_CALL_TYPES[`${type}.${method}`] ?? 'method';
};
