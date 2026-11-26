import type {
    ReportCondition,
    ReportDataSource,
    ReportDocument,
    ReportFor,
    ReportIssue,
} from '../report/document';
import { sameJsonValue, valueAtPath } from './values';

// 文書の for / if / $note をビルドのときに展開する (docs/todo.md 3.2.1 の 2)。
// json-render の repeat・visible は画面に出すときに決まるため、行ごとに provider の引数を変えられない。
// ここで展開した後は、今の検証・HTML・MCP Apps の仕組みをそのまま使う。
//
// - for: 要素 (と子) をデータの行ごとに繰り返す。繰り返した要素のキーは <キー>__<何行目> (入れ子は __0__2)
// - ${m.name}: props・データの引数・if の値の中で、for の行の値に置き換える (m.$index は 0 から、m.$number は 1 から。
//   "${m.x}" だけの文字列で値がなければ null)
// - if: 条件が合わない要素 (と子) を出さない
// - { "$note": "<キー>" }: 文書の notes の文章に置き換える。ないときは「(未記入)」にして警告する

type Element = ReportDocument['spec']['elements'][string];

/** for の変数 → 行と、何行目か */
type Scope = Record<string, { row: unknown; index: number }>;

/** データの宣言を実行して結果を返す (失敗なら undefined。問題は呼び出し側が path で積む) */
export type SourceRunner = (source: ReportDataSource, path: string) => unknown;

export type ExpandResult = {
    document: ReportDocument;
    issues: ReportIssue[];
    warnings: ReportIssue[];
};

/** for の繰り返しの既定の上限 */
export const DEFAULT_FOR_LIMIT = 200;

const VARIABLE = /\$\{([A-Za-z_][A-Za-z0-9_]*)((?:\.[A-Za-z0-9_$]+)*)\}/g;
const WHOLE_VARIABLE = /^\$\{([A-Za-z_][A-Za-z0-9_]*)((?:\.[A-Za-z0-9_$]+)*)\}$/;

const NOT_FOUND = Symbol('not found');

/** ${m.a.b} の値。m が for の変数でなければ NOT_FOUND (文章の中の ${...} はそのまま残す) */
const lookup = (scope: Scope, head: string, rest: string): unknown => {
    const variable = scope[head];
    if (!variable) return NOT_FOUND;
    const parts = rest.split('.').filter(Boolean);
    if (parts.length === 1 && parts[0] === '$index') return variable.index;
    if (parts.length === 1 && parts[0] === '$number') return variable.index + 1;
    return valueAtPath(variable.row, parts);
};

/** 文字列の中に埋めるときの書き方 (配列は「、」ではなく「, 」でつなぐ) */
const textOf = (value: unknown): string =>
    value === undefined || value === null
        ? ''
        : Array.isArray(value)
          ? value.map(textOf).join(', ')
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);

type FillContext = { scope: Scope; note: (key: string) => string };

/** 値の中の ${m.x} と { "$note": ... } を置き換える。"${m.x}" だけの文字列は、値をそのまま (配列・数値も) 入れる */
const fill = (value: unknown, context: FillContext): unknown => {
    if (typeof value === 'string') {
        if (!value.includes('${')) return value;
        const whole = value.match(WHOLE_VARIABLE);
        if (whole) {
            const found = lookup(context.scope, whole[1]!, whole[2]!);
            // 値がないときは null (props の「使わないものは null」に合わせる)
            return found === NOT_FOUND ? value : (found ?? null);
        }
        return value.replace(VARIABLE, (match, head: string, rest: string) => {
            const found = lookup(context.scope, head, rest);
            return found === NOT_FOUND ? match : textOf(found);
        });
    }
    if (Array.isArray(value)) return value.map((item) => fill(item, context));
    if (typeof value === 'object' && value !== null) {
        const object = value as Record<string, unknown>;
        const keys = Object.keys(object);
        if (keys.length === 1 && keys[0] === '$note') {
            return context.note(textOf(fill(object.$note, context)));
        }
        return Object.fromEntries(keys.map((key) => [key, fill(object[key], context)]));
    }
    return value;
};

/** 空 (null・undefined・''・[]・false) でない */
const present = (value: unknown) =>
    value !== undefined &&
    value !== null &&
    value !== '' &&
    value !== false &&
    !(Array.isArray(value) && value.length === 0);

/** データの結果が 1 行以上あるか (行の配列・行列の rows・図の配列) */
const hasRows = (value: unknown): boolean => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
        const rows = (value as { rows?: unknown }).rows;
        return Array.isArray(rows) ? rows.length > 0 : true;
    }
    return false;
};

/** 文書に for・if・$note・引数があるか (なければ展開しない) */
const needsExpansion = (document: ReportDocument) =>
    document.params !== undefined ||
    Object.values(document.spec.elements).some(
        (element) =>
            element.for !== undefined ||
            element.if !== undefined ||
            JSON.stringify(element.props).includes('"$note"'),
    );

/**
 * 文書の for / if / $note を展開する。for の行と if の hasRows は run でデータを実行して決める
 * (run は同じ宣言の結果を使い回す前提。展開した要素のデータも、あとで同じ宣言なら使い回される)
 */
export const expandReportDocument = (
    document: ReportDocument,
    run: SourceRunner,
    /** 文書の引数の値 (build_report の params。文書の params の default より優先) */
    params: Record<string, unknown> = {},
): ExpandResult => {
    const issues: ReportIssue[] = [];
    const warnings: ReportIssue[] = [];
    if (!needsExpansion(document)) {
        for (const name of Object.keys(params)) {
            issues.push({
                path: `params.${name}`,
                message: `Unknown parameter: ${name} (declare it in params)`,
            });
        }
        return { document, issues, warnings };
    }

    // 文書の引数 (${params.x})。値がなければ既定値、どちらもなければ問題にする
    const values: Record<string, unknown> = {};
    for (const [name, declared] of Object.entries(document.params ?? {})) {
        if (name in params) values[name] = params[name];
        else if ('default' in declared) values[name] = declared.default;
        else
            issues.push({
                path: `params.${name}`,
                message: `No value for the parameter ${name} (give it to the build or write default)`,
            });
    }
    for (const name of Object.keys(params)) {
        if (!document.params?.[name]) {
            issues.push({
                path: `params.${name}`,
                message: `Unknown parameter: ${name} (declare it in params)`,
            });
        }
    }
    const rootScope: Scope = document.params ? { params: { row: values, index: 0 } } : {};

    const source = document.spec.elements;
    const elements: ReportDocument['spec']['elements'] = {};
    const reached = new Set<string>();
    /** if で消した要素・繰り返さなかった for の子孫も、書いた場所からは届いている (届かない要素として問題にしない) */
    const markReached = (key: string) => {
        reached.add(key);
        for (const child of source[key]?.children ?? []) {
            if (!reached.has(child)) markReached(child);
        }
    };

    const contextOf = (scope: Scope, key: string): FillContext => ({
        scope,
        note: (name) => {
            const text = document.notes?.[name];
            if (text !== undefined) return text;
            warnings.push({
                path: `spec.${key}.props`,
                message: `No note for "${name}" (write it in notes). Shown as (未記入).`,
            });
            return `(未記入: ${name})`;
        },
    });

    /** for の行 (データの where で絞った行を、上限で切る)。失敗なら undefined */
    const rowsOf = (loop: ReportFor, scope: Scope, key: string): unknown[] | undefined => {
        const path = `spec.${key}.for.in`;
        const declared = typeof loop.in === 'string' ? document.data[loop.in] : loop.in;
        if (!declared) {
            issues.push({ path, message: `Unknown data: ${String(loop.in)} (declare it in data)` });
            return undefined;
        }
        const dataSource = fill(declared, contextOf(scope, key)) as ReportDataSource;
        const rows = run(dataSource, path);
        if (rows === undefined) return undefined;
        if (!Array.isArray(rows)) {
            issues.push({
                path,
                message: `for needs rows (an array), but ${dataSource.provider} returns an object.`,
            });
            return undefined;
        }
        const limit = loop.limit ?? DEFAULT_FOR_LIMIT;
        if (rows.length > limit) {
            warnings.push({
                path: `spec.${key}.for`,
                message: `${rows.length} rows exceed the limit ${limit}; the rest are not shown. Narrow the data (args, where) or raise for.limit.`,
            });
            return rows.slice(0, limit);
        }
        return rows;
    };

    const test = (
        condition: ReportCondition,
        data: ReportDataSource | undefined,
        context: FillContext,
        path: string,
    ): boolean => {
        if ('all' in condition) return condition.all.every((c) => test(c, data, context, path));
        if ('any' in condition) return condition.any.some((c) => test(c, data, context, path));
        if ('not' in condition) return !test(condition.not, data, context, path);
        if ('hasRows' in condition) {
            const declared =
                condition.hasRows === true
                    ? data
                    : typeof condition.hasRows === 'string'
                      ? document.data[condition.hasRows]
                      : condition.hasRows;
            if (!declared) {
                issues.push({
                    path,
                    message:
                        condition.hasRows === true
                            ? 'hasRows: true needs the data of this element.'
                            : `Unknown data: ${condition.hasRows} (declare it in data)`,
                });
                return false;
            }
            const result = run(fill(declared, context) as ReportDataSource, path);
            return result !== undefined && hasRows(result);
        }
        const value = fill(condition.value, context);
        if ('eq' in condition) return sameJsonValue(value, fill(condition.eq, context));
        if ('neq' in condition) return !sameJsonValue(value, fill(condition.neq, context));
        if (condition.gt !== undefined) return Number(value) > condition.gt;
        if (condition.gte !== undefined) return Number(value) >= condition.gte;
        if (condition.lt !== undefined) return Number(value) < condition.lt;
        if (condition.lte !== undefined) return Number(value) <= condition.lte;
        if (condition.in !== undefined) {
            return condition.in.some((item) => sameJsonValue(value, fill(item, context)));
        }
        if (condition.exists !== undefined) return present(value) === condition.exists;
        return present(value);
    };

    /** 要素 1 つ (for の 1 行分) を出す。出した要素のキー (if で消えたら空) */
    const emit = (
        key: string,
        element: Element,
        scope: Scope,
        suffix: string,
        stack: string[],
    ): string[] => {
        const outKey = `${key}${suffix}`;
        if (elements[outKey]) return [outKey];
        const { for: _loop, if: condition, ...rest } = element;
        const context = contextOf(scope, outKey);
        const data = rest.data ? (fill(rest.data, context) as ReportDataSource) : undefined;
        if (condition && !test(condition, data, context, `spec.${outKey}.if`)) {
            markReached(key);
            return [];
        }
        // 子より先に置く (同じ子を 2 回たどったときに使い回す)
        elements[outKey] = {
            ...rest,
            props: fill(rest.props, context) as Element['props'],
            ...(data ? { data } : {}),
            ...(rest.page ? { page: fill(rest.page, context) as Element['page'] } : {}),
        };
        if (rest.children) {
            elements[outKey].children = rest.children.flatMap((child) =>
                visit(child, scope, suffix, [...stack, key]),
            );
        }
        return [outKey];
    };

    /** 要素をたどる (for なら行ごとに出す) */
    const visit = (key: string, scope: Scope, suffix: string, stack: string[]): string[] => {
        const element = source[key];
        // ない子はそのまま残す (json-render の検証が missing_child として返す)
        if (!element) return [`${key}${suffix}`];
        if (stack.includes(key)) {
            issues.push({
                path: `spec.${key}`,
                message: `Cycle in children: ${[...stack, key].join(' → ')}`,
            });
            return [];
        }
        reached.add(key);
        if (!element.for) return emit(key, element, scope, suffix, stack);
        if (stack.length === 0) {
            issues.push({ path: `spec.${key}.for`, message: 'The root element cannot have for.' });
            return [];
        }
        if (scope[element.for.as]) {
            issues.push({
                path: `spec.${key}.for.as`,
                message: `The variable ${element.for.as} is already used by an outer for.`,
            });
            return [];
        }
        const rows = rowsOf(element.for, scope, `${key}${suffix}`);
        if (!rows || rows.length === 0) {
            markReached(key);
            return [];
        }
        return rows.flatMap((row, index) =>
            emit(
                key,
                element,
                { ...scope, [element.for!.as]: { row, index } },
                `${suffix}__${index}`,
                stack,
            ),
        );
    };

    const roots = visit(document.spec.root, rootScope, '', []);
    if (roots.length !== 1) {
        issues.push({ path: 'spec.root', message: 'The root element was removed by its if.' });
    }
    for (const key of Object.keys(source)) {
        if (!reached.has(key)) {
            issues.push({ path: `spec.${key}`, message: 'Element is not reachable from root.' });
        }
    }
    return {
        document: {
            ...document,
            // 題にも引数を入れられる (Apex の仕様書: ${params.class})
            title: String(fill(document.title, contextOf(rootScope, 'title')) ?? document.title),
            spec: { root: roots[0] ?? document.spec.root, elements },
        },
        issues,
        warnings,
    };
};

/** 繰り返した要素のキー (key__3__0) を、問題の場所では key[3][0] と書く */
export const readablePath = (path: string): string => path.replace(/__(\d+)/g, '[$1]');
