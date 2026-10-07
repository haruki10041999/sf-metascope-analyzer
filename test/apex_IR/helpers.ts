import { ApexParser, ApexParserFactory } from '@apexdevtools/apex-parser';

import { ApexSyntaxErrorCollector } from '../../src/analyzer/parser/apexSyntaxError';
import { CommonTypeClass, ErrorTypeClass } from '../../src/analyzer/types/apex_IR/commonVisitor';

// 構文エラーがあるとエラー回復後の木を検証してしまうため、テスト入力側の誤りとして即失敗させる
export const parse = <T>(source: string, rule: (parser: ApexParser) => T): T => {
    const syntaxErrors = new ApexSyntaxErrorCollector();
    const { parser } = ApexParserFactory.createLexerAndParser(source, syntaxErrors);
    const ctx = rule(parser);
    if (syntaxErrors.diagnostics.length > 0) {
        throw new Error(
            `テスト用ソースに構文エラーがあります: ${JSON.stringify(syntaxErrors.diagnostics)}`,
        );
    }
    return ctx;
};

export const collectErrors = (node: unknown, seen = new Set<object>()): ErrorTypeClass[] => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
        return [];
    }
    seen.add(node);

    if (node instanceof ErrorTypeClass) {
        return [node];
    }

    return Object.values(node).flatMap((child) => collectErrors(child, seen));
};

export const collectTypes = (node: unknown, seen = new Set<object>()): string[] => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
        return [];
    }
    seen.add(node);

    const self = node instanceof CommonTypeClass ? [node.getType()] : [];
    return [...self, ...Object.values(node).flatMap((child) => collectTypes(child, seen))];
};

export const formatErrors = (errors: ErrorTypeClass[]): string =>
    errors
        .map((e) => `${e.getContextType()}: ${e.getParseErrorMessage()} (${e.getContext()})`)
        .join('\n');
