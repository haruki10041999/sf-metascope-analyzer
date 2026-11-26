import type { ReportDocument, ReportIssue } from '../report/document';
import { stateRefOf } from '../report/embedding';

// 1 件 1 ページに分ける (docs/todo.md 3.2.2 の「ドキュメントのサイト」)。
// page を持つ要素 (for で広げた 1 件ずつ) と子を、別の HTML (pages/<file>.html) にする。
// 元の文書のその場所には、ページへのリンク (PageLink) を置く (目次)。データは、そのページで使うものだけを持たせる。
// 個々のデータを指定せずに全件を出すと大きくなるので、件数を絞る代わりにページに分ける (決めたこと: 2026-11-18)

type Spec = ReportDocument['spec'];
type Element = Spec['elements'][string];
type State = { data: Record<string, unknown>; compared?: Record<string, string> };

/** 分けたページ 1 つ */
export type SplitPage = {
    /** 目次からの相対パス (pages/<file>.html) */
    file: string;
    title: string;
    spec: Spec;
    state: State;
};

/** props の中で指しているデータの名前 */
const referencesOf = (value: unknown, out: Set<string>): Set<string> => {
    if (Array.isArray(value)) {
        for (const item of value) referencesOf(item, out);
    } else if (typeof value === 'object' && value !== null) {
        const ref = stateRefOf(value);
        if (ref) out.add(ref.name);
        for (const child of Object.values(value)) referencesOf(child, out);
    }
    return out;
};

/** 子孫を含めた要素のキー */
const subtreeOf = (elements: Spec['elements'], key: string, out = new Set<string>()) => {
    if (out.has(key) || !elements[key]) return out;
    out.add(key);
    for (const child of elements[key]!.children ?? []) subtreeOf(elements, child, out);
    return out;
};

/** ファイル名に使えない文字を _ にする */
const fileNameOf = (name: string) =>
    name
        .replace(/[\\/:*?"<>|#%\s]+/g, '_')
        .replace(/^\.+/, '_')
        .slice(0, 120) || 'page';

const stateOf = (state: State, names: Set<string>): State => {
    const pick = <T>(record: Record<string, T> | undefined) =>
        Object.fromEntries(Object.entries(record ?? {}).filter(([name]) => names.has(name)));
    const compared = pick(state.compared);
    return { data: pick(state.data), ...(Object.keys(compared).length ? { compared } : {}) };
};

/**
 * page を持つ要素をページに分ける。ページがなければ pages は空で、spec・state はそのまま。
 * ページの中のページ (入れ子) は分けず、警告にする
 */
export const splitPages = (
    spec: Spec,
    state: State,
): { spec: Spec; state: State; pages: SplitPage[]; warnings: ReportIssue[] } => {
    const warnings: ReportIssue[] = [];
    const pageKeys = Object.keys(spec.elements).filter((key) => spec.elements[key]!.page);
    if (pageKeys.length === 0 || (pageKeys.length === 1 && pageKeys[0] === spec.root)) {
        return { spec, state, pages: [], warnings };
    }
    const elements: Spec['elements'] = { ...spec.elements };
    const pages: SplitPage[] = [];
    const files = new Set<string>();
    const moved = new Set<string>();
    for (const key of pageKeys) {
        if (moved.has(key)) {
            warnings.push({
                path: `spec.${key}.page`,
                message: 'A page inside another page is not split (it stays in the outer page).',
            });
            continue;
        }
        if (key === spec.root) {
            warnings.push({
                path: `spec.${key}.page`,
                message: 'The root element cannot be a page.',
            });
            continue;
        }
        const element = spec.elements[key]!;
        const subtree = subtreeOf(spec.elements, key);
        for (const inner of subtree) moved.add(inner);
        const title =
            element.page?.title ??
            (typeof element.props.title === 'string' ? element.props.title : key);
        let base = fileNameOf(element.page?.file ?? key);
        for (let i = 2; files.has(base); i++)
            base = `${fileNameOf(element.page?.file ?? key)}_${i}`;
        files.add(base);
        const file = `pages/${base}.html`;
        const pageElements = Object.fromEntries(
            [...subtree].map((inner) => {
                const { page: _page, ...rest } = spec.elements[inner]!;
                return [inner, rest as Element];
            }),
        );
        const names = new Set<string>();
        for (const inner of Object.values(pageElements)) referencesOf(inner.props, names);
        pages.push({
            file,
            title,
            spec: { root: key, elements: pageElements },
            state: stateOf(state, names),
        });
        // 目次: 元の場所にリンクを置く
        for (const inner of subtree) delete elements[inner];
        elements[key] = {
            type: 'PageLink',
            props: {
                title,
                href: file,
                description:
                    typeof element.props.description === 'string'
                        ? element.props.description
                        : null,
            },
            children: [],
        };
    }
    // 目次に残ったデータだけを持たせる
    const names = new Set<string>();
    for (const element of Object.values(elements)) referencesOf(element.props, names);
    return { spec: { ...spec, elements }, state: stateOf(state, names), pages, warnings };
};
