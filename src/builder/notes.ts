import type { ReportInput } from '../analyzer/report/types';
import { ReportDocument, type ReportIssue } from '../report/document';
import { expandShorthand } from '../report/shorthand';
import { expandReportDocument } from './expand';
import { type ResolveReportOptions, sourceRunner } from './reportBuilder';

// 文書の notes のキーの一覧 (CLI の report notes・MCP の list_note_keys。docs/plan.md 10 章「notes のキーの一覧を出す」)。
// キーは for の行で決まることが多い ({ "$note": "${m.name}" }) ので、ビルドと同じくデータを実行して展開し、
// 置き換えた $note のキーを集める (展開の処理はビルドと共通の expandReportDocument)

/** notes のキー 1 つ */
export type NoteKeyUse = {
    key: string;
    /** 文書の notes に書いてあるか */
    written: boolean;
    /** 使っている要素のキー (展開したあとのもの。for の中は <キー>__<何行目>) */
    elements: string[];
};

export type NoteKeysResult =
    { ok: true; keys: NoteKeyUse[]; unused: string[] } | { ok: false; issues: ReportIssue[] };

/**
 * 文書の notes のキー (使っている順)。written は notes に書いてあるか。
 * unused は notes に書いてあるが、どこからも使っていないキー
 */
export const listNoteKeys = (
    document: unknown,
    input: ReportInput,
    options: ResolveReportOptions = {},
): NoteKeysResult => {
    const parsed = ReportDocument.safeParse(expandShorthand(document));
    if (!parsed.success) {
        return {
            ok: false,
            issues: parsed.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            })),
        };
    }
    const issues: ReportIssue[] = [];
    const run = sourceRunner(input, options, issues);
    const uses = new Map<string, Set<string>>();
    const expanded = expandReportDocument(
        parsed.data,
        (source, path) => run(source, path)?.value,
        options.params,
        (name, element) => {
            let elements = uses.get(name);
            if (!elements) uses.set(name, (elements = new Set()));
            elements.add(element);
        },
    );
    issues.push(...expanded.issues);
    if (issues.length) return { ok: false, issues };
    const notes = parsed.data.notes ?? {};
    return {
        ok: true,
        keys: [...uses].map(([key, elements]) => ({
            key,
            written: Object.hasOwn(notes, key),
            elements: [...elements],
        })),
        unused: Object.keys(notes).filter((key) => !uses.has(key)),
    };
};
