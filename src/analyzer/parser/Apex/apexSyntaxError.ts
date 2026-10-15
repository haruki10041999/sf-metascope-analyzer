import { ApexErrorListener } from '@apexdevtools/apex-parser';

export type ApexSyntaxDiagnostic = {
    line: number;
    column: number;
    message: string;
};

/**
 * apex-parser はエラー回復で解析を続けるため、トークンの読み飛ばし・補完が起きても
 * 構文木だけでは気付きにくい。Lexer と Parser の両方に付けて構文エラーを収集する。
 */
export class ApexSyntaxErrorCollector extends ApexErrorListener {
    readonly diagnostics: ApexSyntaxDiagnostic[] = [];

    apexSyntaxError(line: number, column: number, message: string): void {
        this.diagnostics.push({ line, column, message });
    }
}
