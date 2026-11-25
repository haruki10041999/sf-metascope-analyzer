import type { ApexNodeJson, ConvertKeys } from '../../../types';
import type { ApexUnitJson, ApexUnitParseResult } from '../../../parser/Apex/unit';
import { walkJson } from '../../commons/node';
import {
    type ApexCallSite,
    type ApexExpressionRef,
    apexCallsOf,
    expressionRefResolverOf,
} from './call';
import {
    type ApexDeclaration,
    type ApexExecutableBody,
    type ApexVariableDeclaration,
    apexDeclarationsOf,
} from './declaration';
import { type ApexQuery, apexQueriesOf } from './query';
import { type ApexDefinition, type ApexVariableAccess, analyzeApexBodies } from './statement';
import { type ApexTypeRef, type ApexTypeResolverOptions, apexTypeResolverOf } from './type';

// Apex の単位 1 つの解析の入口 (docs/plan.md 10 章 P2)。
// 宣言 (declaration.ts) → 本体ごとの名前の解決と読み書き (statement.ts) → 呼び出し (call.ts) →
// 式の型 (type.ts) → SOQL・SOSL (query.ts) の順に当て、結果をデータとして返す (関数を持たないので保存・比較できる)

/** 型を解決した呼び出し */
export type ApexResolvedCall = ApexCallSite & {
    /** レシーバーの式の型 (レシーバーのない呼び出しは undefined) */
    receiverType?: ApexTypeRef;
    /** 引数の式の型 (書いた順) */
    argTypes: ApexTypeRef[];
    /** 戻り値の型 (分からなければ理由つきの unknown) */
    returnType: ApexTypeRef;
    /** 呼び出し先の候補 (単位の中のメソッドの宣言の ID。1 件なら確定) */
    candidateIds: string[];
};

/** フィールド・プロパティ・項目の参照 `x.a` (メソッドの呼び出しは calls) */
export type ApexResolvedMemberAccess = {
    sourceKeys: ConvertKeys;
    object: ApexExpressionRef;
    /** レシーバーの式の型 */
    objectType: ApexTypeRef;
    member: string;
    /** read: 読む / write: 代入の左辺 (`x.a = 1`) / readWrite: 複合代入・増減 (`x.a += 1`・`x.a++`) */
    access: 'read' | 'write' | 'readWrite';
};

/** DML の文 (insert・update・upsert・delete・undelete・merge) */
export type ApexResolvedDml = {
    operation: 'insert' | 'update' | 'upsert' | 'delete' | 'undelete' | 'merge';
    sourceKeys: ConvertKeys;
    /** 対象の式の型 (merge は親のレコード) */
    valueType: ApexTypeRef;
    /** `insert as user`・`as system` */
    accessLevel?: 'SYSTEM' | 'USER';
    /** ループ (for・for-each・while・do-while) の中か */
    inLoop: boolean;
};

/** 実行本体 1 つの解析の結果 */
export type ApexBodySemantics = {
    body: ApexExecutableBody;
    /** 本体の中の変数 (引数・ローカル変数・for-each・catch・when の変数) */
    variables: ApexVariableDeclaration[];
    accesses: ApexVariableAccess[];
    definitions: ApexDefinition[];
    calls: ApexResolvedCall[];
    memberAccesses: ApexResolvedMemberAccess[];
    dml: ApexResolvedDml[];
    queries: ApexQuery[];
    /** 式・文のノードの sourceKey → それを含む一番内側の文のキー (参照の場所に使う) */
    statementOf: Record<string, ConvertKeys>;
};

/** 単位 1 つの解析の結果 */
export type ApexSemanticAnalysis = {
    /** 単位の名前 (クラス名・トリガー名・匿名 Apex の単位名) */
    name: string;
    unitType: ApexUnitJson['unitType'];
    /** ソースのファイル名 */
    fileName: string;
    declarations: ApexDeclaration[];
    bodies: ApexBodySemantics[];
};

export type ApexSemanticOptions = ApexTypeResolverOptions;

const VARIABLE_KINDS = new Set<ApexDeclaration['kind']>([
    'parameter',
    'localVariable',
    'forEachVariable',
    'catchVariable',
    'whenVariable',
]);

/** 文の kind (トリガー・匿名 Apex の直下の変数の宣言 field を含む) */
const STATEMENT_KINDS = new Set([
    'blockStatement',
    'break',
    'continue',
    'delete',
    'doWhile',
    'expression',
    'for',
    'forEach',
    'if',
    'insert',
    'localVariable',
    'merge',
    'return',
    'runAs',
    'switch',
    'throw',
    'try',
    'undelete',
    'update',
    'upsert',
    'while',
    'field',
]);

const LOOP_KINDS = new Set(['for', 'forEach', 'while', 'doWhile']);

const DML_OPERATIONS = new Set<string>([
    'insert',
    'update',
    'upsert',
    'delete',
    'undelete',
    'merge',
]);

/**
 * Apex の単位を解析する。ソースがない (-meta.xml だけ)・ソースが構文エラーの単位は undefined
 * (構文エラーの診断は単位の解析結果の resolvedError にある)
 */
export const analyzeApexUnit = (
    unit: ApexUnitParseResult | ApexUnitJson,
    options: ApexSemanticOptions = {},
): ApexSemanticAnalysis | undefined => {
    const base = 'result' in unit ? unit.result.base : unit;
    const source = base.source;
    if (!source || source.fileType === 'error') return undefined;

    const declarations = apexDeclarationsOf(source);
    const bodies = analyzeApexBodies(declarations).map((analysis): ApexBodySemantics => {
        const calls = apexCallsOf(analysis);
        const resolver = apexTypeResolverOf(declarations, analysis, calls, options);
        const refOf = expressionRefResolverOf(analysis);

        const memberAccesses: ApexResolvedMemberAccess[] = [];
        const dml: ApexResolvedDml[] = [];
        const statementOf: Record<string, ConvertKeys> = {};
        const statements: ConvertKeys[] = [];
        let loopDepth = 0;
        for (const statement of analysis.body.statements) {
            walkJson<ApexNodeJson>(statement as ApexNodeJson, {
                enterAny: (node) => {
                    if (STATEMENT_KINDS.has(node.kind)) statements.push(node.sourceKeys);
                    if (LOOP_KINDS.has(node.kind)) loopDepth++;
                    const inner = statements[statements.length - 1];
                    if (inner) statementOf[node.sourceKeys.sourceKey] ??= inner;
                },
                leaveAny: (node) => {
                    if (STATEMENT_KINDS.has(node.kind)) statements.pop();
                    if (LOOP_KINDS.has(node.kind)) loopDepth--;
                },
                enter: {
                    memberAccess: (node, { parent }) => {
                        if (node.type !== 'object') return;
                        const object = refOf(node.object);
                        const assigned = parent?.kind === 'assignment' && parent.left === node;
                        const incremented =
                            parent?.kind === 'unary' &&
                            (parent.operator === '++' || parent.operator === '--');
                        memberAccesses.push({
                            sourceKeys: node.sourceKeys,
                            object,
                            objectType: resolver.typeOf(object),
                            member: node.member,
                            access:
                                assigned && parent.kind === 'assignment'
                                    ? parent.operator === '='
                                        ? 'write'
                                        : 'readWrite'
                                    : incremented
                                      ? 'readWrite'
                                      : 'read',
                        });
                    },
                },
                leave: Object.fromEntries(
                    [...DML_OPERATIONS].map((operation) => [
                        operation,
                        (node: ApexNodeJson) => {
                            const fields = node as unknown as {
                                field?: Parameters<typeof refOf>[0];
                                master?: Parameters<typeof refOf>[0];
                                accessLevel?: 'SYSTEM' | 'USER';
                            };
                            const value = fields.field ?? fields.master;
                            if (!value) return;
                            dml.push({
                                operation: operation as ApexResolvedDml['operation'],
                                sourceKeys: node.sourceKeys,
                                valueType: resolver.typeOf(refOf(value)),
                                ...(fields.accessLevel ? { accessLevel: fields.accessLevel } : {}),
                                inLoop: loopDepth > 0,
                            });
                        },
                    ]),
                ),
            });
        }

        return {
            body: analysis.body,
            variables: declarations.declarations.filter(
                (d): d is ApexVariableDeclaration =>
                    VARIABLE_KINDS.has(d.kind) &&
                    (d.bodyId === analysis.body.id || analysis.body.parameterIds.includes(d.id)),
            ),
            accesses: analysis.accesses,
            definitions: analysis.definitions,
            calls: calls.map((call) => ({
                ...call,
                ...(call.receiver ? { receiverType: resolver.typeOf(call.receiver) } : {}),
                argTypes: call.argRefs.map((ref) => resolver.typeOf(ref)),
                returnType: resolver.returnTypeOf(call),
                candidateIds: resolver.methodCandidatesOf(call).map((d) => d.id),
            })),
            memberAccesses,
            dml,
            queries: apexQueriesOf(analysis),
            statementOf,
        };
    });

    return {
        name: base.name,
        unitType: base.unitType,
        fileName: source.fileName,
        declarations: declarations.declarations,
        bodies,
    };
};
