// LWC の JS / TS のエラーを集めるリスナー (docs/lwc-parse-plan.md 2.4・3.1.7)。
// Babel にはリスナーがなく、LWC Compiler は例外・warnings で返し、IR は LwcErrorTypeClass をノードに残すので、
// 3 つの出どころから受け取って、phase を付けて LwcResolvedError にそろえる
import { hash, makePositionOf, type ConvertKeys, type SourcePosition } from '../../types/commons';
import { LwcErrorTypeClass } from '../../types/lwc_IR/commonVisitor';

import type { BabelSyntaxError, ScriptLanguage } from './script';
import type { LwcDiagnostic } from './validate/javascript';

export type LwcErrorPhase = 'syntax' | 'lwc' | 'analyzer';

export type LwcResolvedError = {
    sourceKeys: ConvertKeys;
    /** ① 構文エラー / ② LWC の仕様違反 / IR を作れなかった (このアナライザの未対応・例外) */
    phase: LwcErrorPhase;
    /** 'JS_SYNTAX' / 'TS_SYNTAX' / 'LWC1093' など / 'TS_UNSUPPORTED' / IR の ErrorCode */
    code: string;
    level: 'error' | 'warning';
    /** 詳しい種類 (Babel の reasonCode、空白にできない構文の名前、IR を作れなかったノードの type など) */
    contextType: string;
    /** エラーの位置のソース */
    context: string;
    errorMessage: string;
    /** バンドルのフォルダの親からの相対パス (hello/hello.js) */
    filePath: string;
    start: SourcePosition;
    end: SourcePosition;
};

type ReportedError = Omit<LwcResolvedError, 'sourceKeys' | 'filePath'>;

const PHASE_ORDER: Record<LwcErrorPhase, number> = { syntax: 0, lwc: 1, analyzer: 2 };

export class LwcCommonErrorListener {
    private source: string;
    private positionOf: (offset: number) => SourcePosition;
    private errors: ReportedError[] = [];

    constructor(source: string) {
        this.source = source;
        this.positionOf = makePositionOf(source);
    }

    /** 文字位置の範囲。範囲がない (start === end) ときは、Apex と同じくその位置の 1 文字にする (行末・EOF なら空) */
    private spanOf(start: number, end: number) {
        const from = Math.min(Math.max(start, 0), this.source.length);
        let to = Math.min(Math.max(end, from), this.source.length);
        if (to === from && from < this.source.length && this.source[from] !== '\n') {
            to = from + 1;
        }
        return {
            context: this.source.slice(from, to),
            start: this.positionOf(from),
            end: this.positionOf(to),
        };
    }

    /** ① Babel の構文エラー (例外・ast.errors) */
    babelSyntaxError(error: BabelSyntaxError, language: ScriptLanguage): void {
        const offset = error.loc.index ?? error.pos;
        this.errors.push({
            phase: 'syntax',
            code: language === 'ts' ? 'TS_SYNTAX' : 'JS_SYNTAX',
            level: 'error',
            contextType: error.reasonCode,
            // 末尾の " (行:列)" は start と重なるので除く
            errorMessage: error.message.replace(/ \(\d+:\d+\)$/, ''),
            ...this.spanOf(offset, offset),
        });
    }

    /** ② LWC Compiler の診断・空白にできない TS の構文 */
    lwcDiagnostic(diagnostic: LwcDiagnostic): void {
        const start = diagnostic.start ?? 0;
        this.errors.push({
            phase: 'lwc',
            code: diagnostic.code,
            level: diagnostic.level,
            contextType: diagnostic.contextType,
            errorMessage: diagnostic.message,
            ...this.spanOf(start, diagnostic.end ?? start),
        });
    }

    /**
     * IR の LwcErrorTypeClass。構文エラーの位置を含むもの (回復した構文エラーで型の合わないノードになったもの。
     * 1 = 2 の 1 など) は、構文エラーとして報告済みなので除く。先に構文エラーを渡しておく
     */
    analyzerError(error: LwcErrorTypeClass): void {
        const span = error.getSpan();
        const start = span?.start.offset ?? 0;
        const end = span?.end.offset ?? start;
        const coveredBySyntaxError = this.errors.some(
            (reported) =>
                reported.phase === 'syntax' &&
                reported.start.offset >= start &&
                reported.start.offset < Math.max(end, start + 1),
        );
        if (coveredBySyntaxError) {
            return;
        }
        this.errors.push({
            phase: 'analyzer',
            code: error.getCode(),
            level: 'error',
            contextType: error.getContextType(),
            errorMessage: error.getParseErrorMessage(),
            ...this.spanOf(start, end),
        });
    }

    hasSyntaxError(): boolean {
        return this.errors.some((error) => error.phase === 'syntax');
    }

    /** 集めたエラーを、位置の順 (同じ位置なら syntax → lwc → analyzer) に LwcResolvedError にする */
    getResolvedErrors(filePath: string): LwcResolvedError[] {
        return [...this.errors]
            .sort(
                (a, b) =>
                    a.start.offset - b.start.offset || PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase],
            )
            .map((error) => {
                const { start, end, ...content } = error;
                return {
                    // objectKey は内容、sourceKey はファイルと位置 (toApexResolvedError と同じ)
                    sourceKeys: {
                        objectKey: `error_${hash(content)}`,
                        sourceKey: `error_${hash({ filePath, start, end })}`,
                    },
                    ...error,
                    filePath,
                };
            });
    }
}
