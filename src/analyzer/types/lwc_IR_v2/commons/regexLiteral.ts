import { isRegexLiteral, type Node, type RegexLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

// 非推奨の別名。Babel 8 の parse は作らず RegExpLiteral を使う。isRegexLiteral は型の判定 (target is ...) にならないので包む
const isRegexLiteralNode = (target: Node | null | undefined): target is RegexLiteral =>
    isRegexLiteral(target);

export type RegexLiteralFields = {
    pattern: RegexLiteral['pattern'];
    flags: RegexLiteral['flags'];
};

export class RegexLiteralTypeClass extends LwcCommonTypeClass<'regexLiteral'> {
    private readonly value: RegexLiteralFields;

    private constructor(value: RegexLiteralFields) {
        super('regexLiteral');
        this.value = value;
    }

    static create(target: RegexLiteral, originalSource: string): RegexLiteralTypeClass {
        return new RegexLiteralTypeClass({
            pattern: target.pattern,
            flags: target.flags,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): RegexLiteralFields {
        return this.value;
    }

    getPattern(): RegexLiteralFields['pattern'] {
        return this.value.pattern;
    }

    getFlags(): RegexLiteralFields['flags'] {
        return this.value.flags;
    }
}

export const regexLiteralTypePair: EvaluatePair<RegexLiteral, RegexLiteralTypeClass> =
    makeEvaluatePair(isRegexLiteralNode, (target, originalSource) =>
        RegexLiteralTypeClass.create(target, originalSource),
    );

export const isRegexLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is RegexLiteralTypeClass => target instanceof RegexLiteralTypeClass;
