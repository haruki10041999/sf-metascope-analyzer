import type { ApexUnitJson, ApexUnitParseResult } from '../parser/Apex/unit';
import { apexTypeTextOf } from '../processor/Apex/interface';
import type {
    ClassDeclarationJson,
    ConstructorDeclarationJson,
    MethodDeclarationJson,
} from '../types/apex/declaration';
import type { StatementJson } from '../types/apex/statement';
import { type ClassifiedStatement, buildCodeFlow } from './codeFlow';
import type { CodeFlow, MetadataSnapshot, SnapshotInput } from './types';

// apex.methodFlow: Apex のメソッド・コンストラクター・トリガー・匿名 Apex の処理フロー (docs/todo.md 3.2.1 の 4)。
// 文の木 (types/apex/statement.ts) を codeFlow.ts の分類に直し、箱の文字はソースの元の文 (sourceObject) から取る。
// 今の状態だけを描く (比べる時点があっても after)

export type ApexFlowFilter = {
    classes?: string[];
    /** メソッドの名前 (name か owner.name) */
    members?: string[];
};

/** ソースの位置 (sourceKey) → 文と行 */
export type SourceText = { text: string; line: number; offset: number };

const texts = new WeakMap<object, Map<string, SourceText>>();

export const sourceTextsOf = (result: ApexUnitParseResult): Map<string, SourceText> => {
    let map = texts.get(result);
    if (map) return map;
    map = new Map();
    for (const entry of result.result.sourceObject as {
        context?: unknown;
        source?: { sourceKey: string; start: { line: number; offset: number } }[];
    }[]) {
        if (typeof entry.context !== 'string') continue;
        for (const source of entry.source ?? []) {
            map.set(source.sourceKey, {
                text: entry.context,
                line: source.start.line,
                offset: source.start.offset,
            });
        }
    }
    texts.set(result, map);
    return map;
};

type Node = { kind?: string; sourceKeys?: { sourceKey?: string } };

/** 木の中にその種類のノードがあるか (SOQL・SOSL を探す) */
const contains = (value: unknown, kinds: Set<string>): boolean => {
    if (Array.isArray(value)) return value.some((item) => contains(item, kinds));
    if (typeof value !== 'object' || value === null) return false;
    if (kinds.has((value as Node).kind ?? '')) return true;
    return Object.entries(value).some(
        ([key, child]) => key !== 'sourceKeys' && contains(child, kinds),
    );
};

const QUERY_KINDS = new Set(['soql', 'sosl']);
const DML_KINDS = new Set(['insert', 'update', 'delete', 'upsert', 'merge', 'undelete']);
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
]);

/** 文の中の呼び出しから、データの操作・外部の呼び出しを見分ける (Database.query・Database.insert・HTTP など) */
const simpleKindOf = (statement: StatementJson, text: string) => {
    if (DML_KINDS.has(statement.kind)) return 'dml' as const;
    if (
        contains(statement, QUERY_KINDS) ||
        /\b(Database\.(query|countQuery|getQueryLocator)|Search\.query)\s*\(/i.test(text)
    ) {
        return 'query' as const;
    }
    if (/\bDatabase\.(insert|update|delete|upsert|merge|undelete|convertLead)\s*\(/i.test(text)) {
        return 'dml' as const;
    }
    if (/\bEventBus\.publish\s*\(/i.test(text)) return 'event' as const;
    if (/\.send\s*\(|\bnew\s+Http\s*\(|['"]callout:/i.test(text)) return 'callout' as const;
    return 'process' as const;
};

/** ループの頭の行 ({ より前) */
const headerOf = (text: string) =>
    text
        .split('\n')[0]!
        .replace(/\s*\{\s*$/, '')
        .trim();

const classifierOf = (result: ApexUnitParseResult) => {
    const sources = sourceTextsOf(result);
    const source = (node: Node | undefined): SourceText | undefined =>
        node?.sourceKeys?.sourceKey ? sources.get(node.sourceKeys.sourceKey) : undefined;
    const textOf = (node: Node | undefined, fallback: string) => source(node)?.text ?? fallback;
    const lineOf = (node: Node | undefined) => source(node)?.line;

    const classify = (statement: StatementJson): ClassifiedStatement<StatementJson> => {
        const text = textOf(statement, statement.kind);
        const line = lineOf(statement);
        switch (statement.kind) {
            case 'if':
                return {
                    type: 'if',
                    branches: statement.conditionBlock.map((branch) => ({
                        condition:
                            branch.condition === 'else'
                                ? null
                                : textOf(branch.condition as Node, 'if'),
                        body: branch.block,
                        line:
                            branch.condition === 'else'
                                ? undefined
                                : lineOf(branch.condition as Node),
                    })),
                };
            case 'switch':
                return {
                    type: 'switch',
                    subject: `switch on ${textOf(statement.value as Node, '…')}`,
                    line,
                    cases: statement.when.map((when) => ({
                        label:
                            when.condition.condition === 'else'
                                ? 'else'
                                : textOf(when.condition, 'when').replace(/^when\s+/i, ''),
                        body: when.block,
                        isElse: when.condition.condition === 'else',
                    })),
                };
            case 'for':
            case 'forEach':
            case 'while':
                return { type: 'loop', header: headerOf(text), body: statement.block, line };
            case 'doWhile':
                return {
                    type: 'loop',
                    header: `do … while (${textOf(statement.condition as Node, '…')})`,
                    body: statement.block,
                    line,
                };
            case 'try': {
                const tryClause = statement.block.find((clause) => clause.condition === 'try');
                const finallyClause = statement.block.find(
                    (clause) => clause.condition === 'finally',
                );
                return {
                    type: 'try',
                    body: tryClause?.block ?? [],
                    catches: statement.block.flatMap((clause) =>
                        clause.condition === 'catch'
                            ? [
                                  {
                                      label: `catch (${apexTypeTextOf(clause.variantType)} ${clause.variant})`,
                                      body: clause.block,
                                  },
                              ]
                            : [],
                    ),
                    finallyBody: finallyClause?.block ?? null,
                    line,
                };
            }
            case 'return':
            case 'throw':
                return { type: statement.kind, text, line };
            case 'break':
            case 'continue':
                return { type: statement.kind };
            case 'blockStatement':
            case 'runAs':
                return { type: 'block', body: statement.block };
            default:
                return { type: 'simple', kind: simpleKindOf(statement, text), text, line };
        }
    };
    return classify;
};

/** 処理フローにする関数 1 つ */
type FlowTarget = {
    owner: string;
    memberType: CodeFlow['memberType'];
    name: string;
    params: string[];
    body: StatementJson[];
};

/** クラスの中のメソッド・コンストラクター (内側のクラスも) */
const targetsOfClass = (declaration: ClassDeclarationJson, owner: string): FlowTarget[] =>
    declaration.block.flatMap((block): FlowTarget[] => {
        if (block.kind === 'class') return targetsOfClass(block, `${owner}.${block.name}`);
        if (block.kind === 'method') {
            const method = block as MethodDeclarationJson;
            return method.block
                ? [
                      {
                          owner,
                          memberType: 'method',
                          name: method.name,
                          params: method.param.map((p) => apexTypeTextOf(p.variantType)),
                          body: method.block,
                      },
                  ]
                : [];
        }
        if (block.kind === 'constructor') {
            const constructor = block as ConstructorDeclarationJson;
            return [
                {
                    owner,
                    memberType: 'constructor',
                    name: constructor.name.join('.'),
                    params: constructor.param.map((p) => apexTypeTextOf(p.variantType)),
                    body: constructor.block,
                },
            ];
        }
        return [];
    });

/** トリガー・匿名 Apex の本体の文 (宣言は除く) */
const statementsOf = (block: { kind: string }[]): StatementJson[] =>
    block.filter((member) => STATEMENT_KINDS.has(member.kind)) as StatementJson[];

const targetsOf = (json: ApexUnitJson): FlowTarget[] => {
    const source = json.source;
    if (!source) return [];
    switch (source.fileType) {
        case 'cls': {
            const declaration = source.content as unknown as ClassDeclarationJson;
            return declaration.kind === 'class'
                ? targetsOfClass(declaration, declaration.name)
                : [];
        }
        case 'trigger':
            return [
                {
                    owner: json.name,
                    memberType: 'trigger',
                    name: json.name,
                    params: [],
                    body: statementsOf(
                        (source.content as { block?: { kind: string }[] }).block ?? [],
                    ),
                },
            ];
        case 'anonymous':
            return [
                {
                    owner: json.name,
                    memberType: 'anonymous',
                    name: json.name,
                    params: [],
                    body: statementsOf(
                        (source.content as { block?: { kind: string }[] }).block ?? [],
                    ),
                },
            ];
    }
    return [];
};

const unitsOf = (snapshot: MetadataSnapshot, filter: ApexFlowFilter) =>
    (snapshot.apex ?? [])
        .filter((r) => r.dataType === 'apexUnit' && r.result.base)
        .map((r) => r as ApexUnitParseResult)
        .filter((r) => !filter.classes || filter.classes.includes(r.result.base.name));

/**
 * apex.methodFlow: メソッド・コンストラクター・トリガー・匿名 Apex の処理フロー
 * (分岐・繰り返し・try・SOQL / DML・外部の呼び出し・return)。classes・members で絞る
 */
export const getApexMethodFlows = (input: SnapshotInput, filter: ApexFlowFilter = {}): CodeFlow[] =>
    unitsOf(input.after, filter)
        .flatMap((result) => {
            const json = result.result.base;
            const classify = classifierOf(result);
            return targetsOf(json)
                .filter(
                    (target) =>
                        !filter.members ||
                        filter.members.includes(target.name) ||
                        filter.members.includes(`${target.owner}.${target.name}`),
                )
                .map((target): CodeFlow => {
                    const signature = `${target.name}(${target.params.join(', ')})`;
                    const title =
                        target.memberType === 'trigger'
                            ? `trigger ${target.name}`
                            : target.memberType === 'anonymous'
                              ? target.name
                              : `${target.owner}.${signature}`;
                    return {
                        filePath: result.filePath,
                        language: 'apex',
                        unit: json.name,
                        owner: target.owner,
                        memberType: target.memberType,
                        name: target.name,
                        member: `${target.owner}.${target.name}`,
                        signature,
                        ...buildCodeFlow(title, target.body, classify),
                    };
                });
        })
        .sort((a, b) => a.member.localeCompare(b.member) || a.signature.localeCompare(b.signature));
