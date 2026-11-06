import { ApexParser, ApexParserFactory } from '@apexdevtools/apex-parser';

import {
    ApexCommonTypeClass,
    ApexErrorTypeClass,
} from '../../src/analyzer/types/apex_IR/commonVisitor';
import { ApexCommonErrorListener } from '../../src/analyzer/parser/Apex/errorListener';

// 構文エラーがあるとエラー回復後の木を検証してしまうため、テスト入力側の誤りとして即失敗させる
export const parse = <T>(source: string, rule: (parser: ApexParser) => T): T => {
    const errorListener = new ApexCommonErrorListener(source);
    const { parser } = ApexParserFactory.createLexerAndParser(source, errorListener);
    const ctx = rule(parser);
    const syntaxErrors = errorListener.getErrors().map((error) => ({
        line: error.getSpan()?.start.line,
        column: error.getSpan()?.start.column,
        message: error.getParseErrorMessage(),
    }));
    if (syntaxErrors.length > 0) {
        throw new Error(`テスト用ソースに構文エラーがあります: ${JSON.stringify(syntaxErrors)}`);
    }
    return ctx;
};

export const collectErrors = (node: unknown, seen = new Set<object>()): ApexErrorTypeClass[] => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
        return [];
    }
    seen.add(node);

    if (node instanceof ApexErrorTypeClass) {
        return [node];
    }

    return Object.values(node).flatMap((child) => collectErrors(child, seen));
};

export const collectTypes = (node: unknown, seen = new Set<object>()): string[] => {
    if (node === null || typeof node !== 'object' || seen.has(node)) {
        return [];
    }
    seen.add(node);

    const self = node instanceof ApexCommonTypeClass ? [node.getType()] : [];
    return [...self, ...Object.values(node).flatMap((child) => collectTypes(child, seen))];
};

export const formatErrors = (errors: ApexErrorTypeClass[]): string =>
    errors
        .map((e) => `${e.getContextType()}: ${e.getParseErrorMessage()} (${e.getContext()})`)
        .join('\n');

/**
 * visitor の visit の結果を、IR のノード (ApexCommonTypeClass<string>) として扱う。
 * visit の戻り値の型のままだと、判定関数 (isXxxType) での絞り込みが never になるため
 */
export const asNode = (node: unknown): ApexCommonTypeClass<string> =>
    node as ApexCommonTypeClass<string>;
