// Apex のエラーを集めるリスナー (LWC の parser/Lwc/errorListener.ts と同じ置き場所・同じ形)。
// 構文エラーは ANTLR のリスナーとして受け取り、IR を作れなかったもの (ApexErrorTypeClass) は analyzerError で受け取る
import { ApexErrorListener } from '@apexdevtools/apex-parser';

import {
    ApexErrorTypeClass,
    type ConvertKeys,
    type SourcePosition,
    type SourceSpan,
} from '../../types';
import { toApexResolvedError, type ApexErrorPhase, type ApexResolvedError } from '../commons';

export type ApexResolvedErrorEntry = { sourceKeys: ConvertKeys } & ApexResolvedError & SourceSpan;

export class ApexCommonErrorListener extends ApexErrorListener {
    private originalSource: string;
    private sourceLines: string[];
    private lineOffsets: number[] = [];
    private errors: { phase: ApexErrorPhase; error: ApexErrorTypeClass }[] = [];

    constructor(source: string) {
        super();

        this.originalSource = source;
        this.sourceLines = source.split(/\r\n|\n|\r/);

        // 各行の開始位置を、元ソース上の offset として保持する
        this.lineOffsets.push(0);

        for (let i = 0; i < source.length; i++) {
            if (source[i] === '\r') {
                if (source[i + 1] === '\n') {
                    i++;
                }
                this.lineOffsets.push(i + 1);
            } else if (source[i] === '\n') {
                this.lineOffsets.push(i + 1);
            }
        }
    }

    apexSyntaxError(line: number, column: number, msg: string): void {
        const lineIndex = line - 1;
        const sourceLine = this.sourceLines[lineIndex] ?? '';
        const offset = (this.lineOffsets[lineIndex] ?? this.originalSource.length) + column;

        // エラー位置の1文字を取得。行末・EOFなら空文字
        const sourceCode = sourceLine.charAt(column);
        const hasCharacter = column < sourceLine.length;

        const start: SourcePosition = {
            offset,
            line,
            column,
        };

        const end: SourcePosition = {
            offset: offset + (hasCharacter ? 1 : 0),
            line,
            column: column + (hasCharacter ? 1 : 0),
        };

        const errorTypeClass = ApexErrorTypeClass.create('UNRESOLVED', 'unknown', sourceCode, msg);

        errorTypeClass.setSpan({
            context: sourceCode,
            start,
            end,
        });

        this.errors.push({ phase: 'syntax', error: errorTypeClass });
    }

    /**
     * IR の ApexErrorTypeClass (collectErrorTypeClasses で集めたもの)。
     * 構文エラーの位置を含むもの (エラー回復で中身のない Context になったもの) は、構文エラーとして報告済みなので除く。
     * 先に構文解析を終えておく (構文エラーは解析中に集まる)
     */
    analyzerError(error: ApexErrorTypeClass): void {
        const span = error.getSpan();
        if (!span) {
            return;
        }
        const start = span.start.offset;
        const end = Math.max(span.end.offset, start + 1);
        const coveredBySyntaxError = this.errors.some(
            ({ phase, error: reported }) =>
                phase === 'syntax' &&
                (reported.getSpan()?.start.offset ?? -1) >= start &&
                (reported.getSpan()?.start.offset ?? -1) < end,
        );
        if (!coveredBySyntaxError) {
            this.errors.push({ phase: 'analyzer', error });
        }
    }

    /** 構文エラー (と analyzerError で受け取ったもの) の ApexErrorTypeClass */
    getErrors(): ApexErrorTypeClass[] {
        return this.errors.map(({ error }) => error);
    }

    hasSyntaxError(): boolean {
        return this.errors.some(({ phase }) => phase === 'syntax');
    }

    /** 集めたエラーを、位置の順 (同じ位置なら syntax → analyzer) に resolvedError にする */
    getResolvedErrors(): ApexResolvedErrorEntry[] {
        return this.errors
            .map(({ phase, error }) => toApexResolvedError(error, phase))
            .sort(
                (a, b) =>
                    a.start.offset - b.start.offset ||
                    (a.phase === b.phase ? 0 : a.phase === 'syntax' ? -1 : 1),
            );
    }
}
