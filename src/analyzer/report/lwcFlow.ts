import type { LwcBundleParseResult } from '../parser/Lwc/parser';
import type { LwcComponentJson, LwcMemberJson } from '../types/lwc/component';
import type { LwcModuleJson } from '../types/lwc/module';
import type { LwcJsStatementJson } from '../types/lwc/statement';
import { analyzeLwcCallsIn } from '../processor/Lwc/calls';
import { walkJson } from '../processor/commons/node';
import { type LwcImportTables, type LwcNodeJson, makeLwcImportTables } from '../types';
import { type ClassifiedStatement, buildCodeFlow } from './codeFlow';
import type { CodeFlow, MetadataSnapshot, SnapshotInput } from './types';

// lwc.methodFlow: LWC の JS / TS のメソッド・関数の処理フロー (docs/todo.md 3.2.1 の 4)。
// apex.methodFlow と同じ組み立て (codeFlow.ts) で、文の分類だけ JS に合わせる。
// - 文の分類は呼び出しの解析 (Lwc/calls.ts) の結果で決める (simpleKindOf)
// - switch の case は次の case に続く (fall-through) ので、本体のない case は次の case とまとめ、最後の break は switch を抜けるだけとする

export type LwcFlowFilter = {
    /** コンポーネントの名前 (accountList か c/accountList) */
    components?: string[];
    /** 関数の名前 (name か owner.name) */
    members?: string[];
};

type Bundle = Extract<LwcBundleParseResult, { dataType: 'lwcBundle' }>;
type SourceText = { text: string; line: number };
type Node = { kind?: string; sourceKeys?: { sourceKey?: string; base?: { sourceKey?: string } } };

const texts = new WeakMap<object, Map<string, SourceText>>();

const sourceTextsOf = (bundle: Bundle): Map<string, SourceText> => {
    let map = texts.get(bundle);
    if (map) return map;
    map = new Map();
    for (const entry of bundle.result.sourceObject as {
        context?: unknown;
        source?: { sourceKey: string; start: { line: number } }[];
    }[]) {
        if (typeof entry.context !== 'string') continue;
        for (const source of entry.source ?? []) {
            map.set(source.sourceKey, { text: entry.context, line: source.start.line });
        }
    }
    texts.set(bundle, map);
    return map;
};

type SimpleKind = 'call' | 'navigate' | 'event' | 'callout';

/**
 * 文の中の呼び出しから、Apex の呼び出し・イベント・画面の遷移・外部の呼び出しを見分ける。
 * 文字の並びでなく、呼び出しの解析 (Lwc/calls.ts の callType。import 元と名前で決まる) の結果で決める
 * - call: @salesforce/apex から import したメソッド・refreshApex
 * - navigate: this[NavigationMixin.Navigate](...)
 * - event: this.dispatchEvent・new ShowToastEvent・メッセージチャネルの publish
 * - callout: fetch(...)
 */
const simpleKindOf = (statement: LwcJsStatementJson, tables: LwcImportTables) => {
    const { calls, events } = analyzeLwcCallsIn([statement], tables);
    const kinds = new Set<SimpleKind>();
    for (const call of calls) {
        if (call.callType === 'apex' || call.callType === 'refreshApex') kinds.add('call');
        else if (call.callType === 'navigate' && call.target === 'Navigate') kinds.add('navigate');
        else if (call.callType === 'dispatchEvent') kinds.add('event');
        else if (call.callType === 'messageService' && call.imported === 'publish') {
            kinds.add('event');
        }
    }
    if (events.some((event) => event.eventClass === 'ShowToastEvent')) kinds.add('event');
    walkJson<LwcNodeJson>(statement as LwcNodeJson, {
        enter: {
            jsCall: (node) => {
                if (node.callee.kind === 'jsIdentifier' && node.callee.name === 'fetch') {
                    kinds.add('callout');
                }
            },
        },
    });
    for (const kind of ['call', 'navigate', 'event', 'callout'] as const) {
        if (kinds.has(kind)) return kind;
    }
    return 'process' as const;
};

const headerOf = (text: string) =>
    text
        .split('\n')[0]!
        .replace(/\s*\{\s*$/, '')
        .trim();

const isBreak = (statement: LwcJsStatementJson) =>
    statement.kind === 'jsBreak' && !(statement as { label?: string }).label;

const classifierOf = (bundle: Bundle, module: LwcModuleJson) => {
    const sources = sourceTextsOf(bundle);
    const source = (node: Node | undefined): SourceText | undefined => {
        const key = node?.sourceKeys?.sourceKey ?? node?.sourceKeys?.base?.sourceKey;
        return key ? sources.get(key) : undefined;
    };
    const textOf = (node: Node | undefined, fallback: string) => source(node)?.text ?? fallback;
    const lineOf = (node: Node | undefined) => source(node)?.line;
    const tables = makeLwcImportTables(module.imports);

    const classify = (statement: LwcJsStatementJson): ClassifiedStatement<LwcJsStatementJson> => {
        const text = textOf(statement as Node, statement.kind);
        const line = lineOf(statement as Node);
        switch (statement.kind) {
            case 'jsIf':
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
            case 'jsSwitch': {
                // 本体のない case は次の case とまとめる (case 'a': case 'b': ...)
                const cases: { label: string; body: LwcJsStatementJson[]; isElse: boolean }[] = [];
                let labels: string[] = [];
                let isElse = false;
                for (const when of statement.cases) {
                    labels.push(when.test ? textOf(when.test as Node, 'case') : 'default');
                    isElse ||= !when.test;
                    if (when.block.length === 0) continue;
                    const body = isBreak(when.block[when.block.length - 1]!)
                        ? when.block.slice(0, -1)
                        : when.block;
                    cases.push({ label: labels.join(', '), body, isElse });
                    labels = [];
                    isElse = false;
                }
                if (labels.length) cases.push({ label: labels.join(', '), body: [], isElse });
                return {
                    type: 'switch',
                    subject: `switch (${textOf(statement.discriminant as Node, '…')})`,
                    line,
                    cases,
                };
            }
            case 'jsFor':
            case 'jsForIn':
            case 'jsForOf':
            case 'jsWhile':
                return { type: 'loop', header: headerOf(text), body: statement.block, line };
            case 'jsDoWhile':
                return {
                    type: 'loop',
                    header: `do … while (${textOf(statement.condition as Node, '…')})`,
                    body: statement.block,
                    line,
                };
            case 'jsTry': {
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
                                      label: clause.param
                                          ? `catch (${textOf(clause.param as Node, 'error')})`
                                          : 'catch',
                                      body: clause.block,
                                  },
                              ]
                            : [],
                    ),
                    finallyBody: finallyClause?.block ?? null,
                    line,
                };
            }
            case 'jsReturn':
                return { type: 'return', text, line };
            case 'jsThrow':
                return { type: 'throw', text, line };
            case 'jsBreak':
                return { type: 'break' };
            case 'jsContinue':
                return { type: 'continue' };
            case 'jsBlock':
            case 'jsWith':
                return { type: 'block', body: statement.block };
            case 'jsLabeled':
                return { type: 'block', body: [statement.body] };
            case 'jsEmpty':
            case 'jsDebugger':
            case 'jsDirective':
            case 'jsFunctionDeclaration':
            case 'jsClassDeclaration':
            case 'jsUnsupportedStatement':
                return { type: 'skip' };
            default:
                return { type: 'simple', kind: simpleKindOf(statement, tables), text, line };
        }
    };
    return { classify, textOf };
};

/** 処理フローにする関数 1 つ */
type FlowTarget = {
    owner: string;
    memberType: CodeFlow['memberType'];
    name: string;
    /** 引数 (ソースの文字) */
    params: string[];
    body: LwcJsStatementJson[];
};

const targetsOfComponent = (
    component: LwcComponentJson,
    owner: string,
    paramsOf: (params: Node[]) => string[],
): FlowTarget[] =>
    component.block.flatMap((member: LwcMemberJson): FlowTarget[] => {
        switch (member.kind) {
            case 'lwcMethod':
                return member.block
                    ? [
                          {
                              owner,
                              memberType: 'method',
                              name: member.name,
                              params: paramsOf(member.param as Node[]),
                              body: member.block,
                          },
                      ]
                    : [];
            case 'lwcField':
                return member.function?.block
                    ? [
                          {
                              owner,
                              memberType: 'function',
                              name: member.name,
                              params: paramsOf(member.function.param as Node[]),
                              body: member.function.block,
                          },
                      ]
                    : [];
            case 'lwcProperty':
                return [
                    ...(member.getterContent?.block
                        ? [
                              {
                                  owner,
                                  memberType: 'method' as const,
                                  name: `get ${member.name}`,
                                  params: [],
                                  body: member.getterContent.block,
                              },
                          ]
                        : []),
                    ...(member.setterContent?.block
                        ? [
                              {
                                  owner,
                                  memberType: 'method' as const,
                                  name: `set ${member.name}`,
                                  params: ['value'],
                                  body: member.setterContent.block,
                              },
                          ]
                        : []),
                ];
            default:
                return [];
        }
    });

const bundlesOf = (snapshot: MetadataSnapshot, filter: LwcFlowFilter): Bundle[] => {
    const names = filter.components?.map((name) => name.replace(/^c\//, ''));
    return (snapshot.lwc ?? []).filter(
        (r): r is Bundle =>
            r.dataType === 'lwcBundle' &&
            Boolean(r.result?.base) &&
            (!names || names.includes((r as Bundle).result.base.name)),
    );
};

/**
 * lwc.methodFlow: LWC のメソッド・関数 (フィールドのアロー関数・getter / setter・モジュールの関数) の処理フロー。
 * components・members で絞る
 */
export const getLwcMethodFlows = (input: SnapshotInput, filter: LwcFlowFilter = {}): CodeFlow[] =>
    bundlesOf(input.after, filter)
        .flatMap((bundle) => {
            const base = bundle.result.base;
            return base.modules.flatMap(({ fileName, main, module }) => {
                // 読めなかったファイル (module が null) は飛ばす
                if (!module) return [];
                const { classify, textOf } = classifierOf(bundle, module);
                const paramsOf = (params: Node[]) => params.map((p) => textOf(p, 'arg'));
                const moduleName = fileName.replace(/\.(js|ts)$/, '');
                const owner = main ? (module.component?.name ?? base.name) : moduleName;
                const targets: FlowTarget[] = [
                    ...(module.component
                        ? targetsOfComponent(module.component, owner, paramsOf)
                        : []),
                    ...module.declarations.flatMap((declaration): FlowTarget[] =>
                        declaration.kind === 'lwcDeclaration' && declaration.block
                            ? [
                                  {
                                      owner: moduleName,
                                      memberType: 'function',
                                      name: declaration.name,
                                      params: paramsOf((declaration.param ?? []) as Node[]),
                                      body: declaration.block,
                                  },
                              ]
                            : [],
                    ),
                ];
                return targets
                    .filter(
                        (target) =>
                            !filter.members ||
                            filter.members.includes(target.name) ||
                            filter.members.includes(`${target.owner}.${target.name}`),
                    )
                    .map((target): CodeFlow => {
                        const signature = `${target.name}(${target.params.join(', ')})`;
                        return {
                            filePath: bundle.filePath,
                            language: 'lwc',
                            unit: base.name,
                            owner: target.owner,
                            memberType: target.memberType,
                            name: target.name,
                            member: `${target.owner}.${target.name}`,
                            signature,
                            ...buildCodeFlow(`${target.owner}.${signature}`, target.body, classify),
                        };
                    });
            });
        })
        .sort(
            (a, b) =>
                a.unit.localeCompare(b.unit) ||
                a.member.localeCompare(b.member) ||
                a.signature.localeCompare(b.signature),
        );
