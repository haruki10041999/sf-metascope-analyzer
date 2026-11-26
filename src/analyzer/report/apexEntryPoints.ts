import type { ApexUnitParseResult } from '../parser/Apex/unit';
import {
    type ApexDeclaration,
    apexDeclarationsOf,
    apexMemberNamesOf,
    hasApexAnnotation,
    isApexAnnotationArgTrue,
} from '../processor/Apex/semantic';
import { type DependencyGraph, toLevel } from '../processor/dependency/graph';
import { dependencyGraphOf } from '../unit/dependencies';
import type { ApexEntryPointRow, ReportInput } from './types';

// apex.entryPoints: Apex の外 (画面・Flow・外部のシステム・非同期の実行) から呼ばれるメソッドの一覧 (公開 API)。
// docs/plan.md 10 章 P4 の段 1「JSON にあるが使っていない情報」。アノテーションと修飾子から決める:
// - rest: @RestResource(urlMapping) のクラスの @HttpGet・@HttpPost など
// - aura: @AuraEnabled (cacheable=true なら cacheable)
// - invocable: @InvocableMethod (label)
// - remoteAction: @RemoteAction / webservice: webservice の修飾子 / future: @future (callout=true なら callout)
// usedBy は依存関係のグラフで、そのメソッドを呼ぶほかの単位 (LWC・Aura・Flow・Visualforce・Apex)

const HTTP_METHODS: Readonly<Record<string, string>> = {
    httpget: 'GET',
    httppost: 'POST',
    httpput: 'PUT',
    httppatch: 'PATCH',
    httpdelete: 'DELETE',
};

type EntryKind = ApexEntryPointRow['kind'];

/** アノテーションの引数の文字列 (名前は大文字小文字を区別しない) */
const annotationArgOf = (declaration: ApexDeclaration, name: string, key: string) => {
    if (!('modifiers' in declaration)) return undefined;
    const value = declaration.modifiers.annotationArgs[name.toLowerCase()]?.[key.toLowerCase()];
    return typeof value === 'string' ? value : undefined;
};

/** メソッドのノード → 呼んでいるほかの単位 (<種類>:<名前>) */
const usersOf = (graph: DependencyGraph) => {
    const users = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
        if (edge.kind !== 'calls' || !edge.to.startsWith('apexMethod:')) continue;
        const target = graph.nodes.get(edge.to);
        const unitNode = graph.nodes.get(toLevel(graph, edge.from, 'unit'));
        if (!unitNode || !target || target.unit?.id === edge.unit.id) continue;
        let set = users.get(edge.to);
        if (!set) users.set(edge.to, (set = new Set()));
        set.add(`${unitNode.type}:${unitNode.name}`);
    }
    return users;
};

/** Apex の入口 (公開 API) */
export const getApexEntryPoints = (
    input: ReportInput,
    filter: { classes?: string[]; kinds?: EntryKind[] } = {},
): ApexEntryPointRow[] => {
    const users = usersOf(dependencyGraphOf(input.after));
    const rows: ApexEntryPointRow[] = [];
    for (const result of input.after.get('apexClass') as ApexUnitParseResult[]) {
        const base = result.result.base;
        if (filter.classes && !filter.classes.includes(base.name)) continue;
        const source = base.source;
        if (!source || source.fileType === 'error') continue;
        const { declarations } = apexDeclarationsOf(source);
        const names = apexMemberNamesOf(declarations);
        for (const method of declarations) {
            if (method.kind !== 'method') continue;
            const member = names.memberOf(method);
            if (!member) continue;
            const owner = names.ownerTypeOf(names.ownerOf(method));
            const modifiers = method.modifiers;
            const entries: Omit<
                ApexEntryPointRow,
                'filePath' | 'sourceKeys' | 'className' | 'member' | 'usedBy'
            >[] = [];
            const urlMapping = owner && annotationArgOf(owner, 'RestResource', 'urlMapping');
            for (const annotation of modifiers.annotations) {
                const http = HTTP_METHODS[annotation.toLowerCase()];
                if (http)
                    entries.push({
                        kind: 'rest',
                        httpMethod: http,
                        ...(urlMapping ? { urlMapping } : {}),
                    });
            }
            if (hasApexAnnotation(modifiers, 'AuraEnabled'))
                entries.push({
                    kind: 'aura',
                    cacheable: isApexAnnotationArgTrue(modifiers, 'AuraEnabled', 'cacheable'),
                });
            if (hasApexAnnotation(modifiers, 'InvocableMethod')) {
                const label = annotationArgOf(method, 'InvocableMethod', 'label');
                entries.push({ kind: 'invocable', ...(label ? { label } : {}) });
            }
            if (hasApexAnnotation(modifiers, 'RemoteAction'))
                entries.push({ kind: 'remoteAction' });
            if (modifiers.isWebService) entries.push({ kind: 'webservice' });
            if (hasApexAnnotation(modifiers, 'future'))
                entries.push({
                    kind: 'future',
                    callout: isApexAnnotationArgTrue(modifiers, 'future', 'callout'),
                });
            const usedBy = [...(users.get(`apexMethod:${member}`) ?? [])].sort();
            for (const entry of entries) {
                if (filter.kinds && !filter.kinds.includes(entry.kind)) continue;
                rows.push({
                    filePath: result.filePath,
                    sourceKeys: method.sourceKeys,
                    className: base.name,
                    member,
                    ...entry,
                    usedBy,
                });
            }
        }
    }
    return rows.sort((a, b) => a.member.localeCompare(b.member) || a.kind.localeCompare(b.kind));
};
