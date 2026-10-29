/**
 * 生成した JSON がソースを表現しきれているか（順序・区別・欠落）を評価し、6.expressiveness.json に書き出す。
 * CommonType（1.common-type.json）は順序と種類を保持しているので、これと JSON（3.json.json）を比べる。
 *
 * 実行: npx ttsx --noCheck docs/examples/apex-json/evaluate-expressiveness.ts
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';

const outputDirectory = new URL('./output/', import.meta.url);
const sampleFiles: Record<string, URL> = {
    ParserTest: new URL('../apex-ir/ParserTest.cls', import.meta.url),
    ParserTrigger: new URL('../apex-ir/ParserTrigger.trigger', import.meta.url),
    parser: new URL('../apex-ir/parser.apex', import.meta.url),
};

type Node = Record<string, any>;

const walk = (target: unknown, visit: (node: Node) => void): void => {
    if (Array.isArray(target)) {
        target.forEach((item) => walk(item, visit));
    } else if (target !== null && typeof target === 'object') {
        visit(target as Node);
        Object.values(target).forEach((item) => walk(item, visit));
    }
};

const findAll = (target: unknown, predicate: (node: Node) => boolean) => {
    const found: Node[] = [];
    walk(target, (node) => predicate(node) && found.push(node));
    return found;
};

// 並びが JSON のグループ順で並べ替えたものと一致しなければ、JSON から元の順序を復元できない
const isOrderLost = (groups: string[], groupOrder: string[]) => {
    const sorted = [...groups].sort((a, b) => groupOrder.indexOf(a) - groupOrder.indexOf(b));
    return groups.some((group, index) => group !== sorted[index]);
};

// ---- クラスのメンバー ----------------------------------------------------------
const CLASS_GROUP_ORDER = ['field', 'property', 'enum', 'method', 'interface', 'constructors', 'innerClass', 'initializerBlock', 'notSet'];
const memberGroup = (member: Node): string => {
    const value = member.value;
    if (!value) return 'notSet';
    if (value.type === 'block') return 'initializerBlock';
    const declaration = value.value?.type;
    return (
        {
            fieldDeclaration: 'field',
            propertyDeclaration: 'property',
            enumDeclaration: 'enum',
            methodDeclaration: 'method',
            interfaceDeclaration: 'interface',
            constructorDeclaration: 'constructors',
            classDeclaration: 'innerClass',
        } as Record<string, string>
    )[declaration] ?? 'other';
};

// ---- SELECT の列 ---------------------------------------------------------------
const SELECT_GROUP_ORDER = ['field', 'soqlFunction', 'subQuery', 'typeOf'];
const selectGroup = (entry: Node): string =>
    ({ fieldName: 'field', soqlFunction: 'soqlFunction', subQuery: 'subQuery', typeOf: 'typeOf' } as Record<string, string>)[
        entry.value?.type
    ] ?? 'other';

// ---- 修飾子（modifier.ts の分類と同じ） ------------------------------------------
const MODIFIER_GROUP_ORDER = [
    'access', 'declaration', 'webService', 'test', 'sharing', 'other',
    'lwcAnnotation', 'flowAnnotation', 'asyncAnnotation', 'testAnnotation', 'restAnnotation',
    'visualforceAnnotation', 'accessAnnotation', 'serializeAnnotation', 'executionAnnotation',
    'compatibilityAnnotation', 'otherAnnotation',
];
const inList = (value: string, list: string[]) => list.includes(value.toUpperCase());
const modifierGroup = (modifier: Node): string => {
    const value = modifier.value;
    if (typeof value === 'string') {
        if (inList(value, ['PUBLIC', 'PRIVATE', 'PROTECTED', 'GLOBAL'])) return 'access';
        if (inList(value, ['STATIC', 'FINAL', 'ABSTRACT', 'VIRTUAL', 'OVERRIDE'])) return 'declaration';
        if (inList(value, ['WEBSERVICE'])) return 'webService';
        if (inList(value, ['TESTMETHOD'])) return 'test';
        if (inList(value, ['WITH_SHARING', 'WITHOUT_SHARING', 'INHERITED_SHARING'])) return 'sharing';
        return 'other';
    }
    const name = String(value?.value?.value ?? '');
    if (inList(name, ['AURAENABLED'])) return 'lwcAnnotation';
    if (inList(name, ['INVOCABLEMETHOD', 'INVOCABLEVARIABLE'])) return 'flowAnnotation';
    if (inList(name, ['FUTURE'])) return 'asyncAnnotation';
    if (inList(name, ['ISTEST', 'TESTSETUP', 'TESTVISIBLE'])) return 'testAnnotation';
    if (inList(name, ['RESTRESOURCE', 'HTTPDELETE', 'HTTPGET', 'HTTPPATCH', 'HTTPPOST', 'HTTPPUT'])) return 'restAnnotation';
    if (inList(name, ['REMOTEACTION'])) return 'visualforceAnnotation';
    if (inList(name, ['NAMESPACEACCESSIBLE'])) return 'accessAnnotation';
    if (inList(name, ['JSONACCESS'])) return 'serializeAnnotation';
    if (inList(name, ['READONLY'])) return 'executionAnnotation';
    if (inList(name, ['DEPRECATED', 'SUPPRESSWARNINGS'])) return 'compatibilityAnnotation';
    return 'otherAnnotation';
};

const orderStats = (lists: Node[][], groupOf: (node: Node) => string, groupOrder: string[]) => {
    const multi = lists.filter((list) => list.length > 1);
    const lost = multi.filter((list) => isOrderLost(list.map(groupOf), groupOrder));
    return { lists: multi.length, orderLost: lost.length };
};

// ---- 区別できない構文 -----------------------------------------------------------
const ambiguity = (commonType: unknown) => {
    const dots = findAll(commonType, (n) => n.type === 'dotExpression');
    const fieldAccess = dots.filter((n) => n.right?.type === 'anyId').length;
    const noArgCall = dots.filter((n) => n.right?.type === 'dotMethodCall' && n.right.param === null).length;

    // 初期値・引数を持たない new は、JSON では { collection, generic? } だけになり種類を区別できない
    const news = findAll(commonType, (n) => n.type === 'newExpression').map((n) => n.value?.rest);
    const emptyNew: Record<string, number> = {};
    for (const rest of news) {
        const empty =
            (rest?.type === 'classCreatorRest' && rest.value?.value === null) ||
            (rest?.type === 'arrayCreatorRest' && rest.value === null && rest.size === null) ||
            (rest?.type === 'mapCreatorRest' && rest.value.length === 0) ||
            (rest?.type === 'setCreatorRest' && (!rest.value || rest.value.length === 0));
        if (empty) emptyNew[rest.type] = (emptyNew[rest.type] ?? 0) + 1;
    }
    return { fieldAccess, noArgCall, newExpressions: news.length, emptyNew };
};

const results = [];
for (const name of await readdir(outputDirectory)) {
    const sampleFile = sampleFiles[name];
    if (!sampleFile) continue;
    const directory = new URL(`./${name}/`, outputDirectory);
    const source = await readFile(sampleFile, 'utf8');
    const { commonType } = JSON.parse(await readFile(new URL('1.common-type.json', directory), 'utf8'));
    const json = JSON.parse(await readFile(new URL('3.json.json', directory), 'utf8'));

    const comments = source.match(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g) ?? [];

    const evaluation = {
        sample: name,
        order: {
            classMembers: orderStats(
                findAll(commonType, (n) => n.type === 'classBody').map((n) => n.value),
                memberGroup,
                CLASS_GROUP_ORDER,
            ),
            selectEntries: orderStats(
                findAll(commonType, (n) => n.type === 'selectList' || n.type === 'subFieldList').map((n) => n.value),
                selectGroup,
                SELECT_GROUP_ORDER,
            ),
            modifiers: orderStats(
                findAll(commonType, (n) => Array.isArray(n.modifier)).map((n) => n.modifier),
                modifierGroup,
                MODIFIER_GROUP_ORDER,
            ),
        },
        ambiguity: ambiguity(commonType),
        notRepresented: {
            comments: comments.length,
            commentChars: comments.reduce((sum, c) => sum + c.length, 0),
            notSet: findAll(json, (n) => Array.isArray(n.notSet)).reduce((sum, n) => sum + n.notSet.length, 0),
        },
        discriminated: (() => {
            let withKind = 0;
            let withoutKind = 0;
            walk(json, (n) => {
                if ('objectKey' in n && 'sourceKey' in n) return;
                if ('kind' in n || 'fileType' in n) withKind++;
                else withoutKind++;
            });
            return { withKind, withoutKind };
        })(),
    };
    await writeFile(new URL('6.expressiveness.json', directory), `${JSON.stringify(evaluation, null, 2)}\n`, 'utf8');
    results.push(evaluation);
}

console.log(JSON.stringify(results, null, 1));
