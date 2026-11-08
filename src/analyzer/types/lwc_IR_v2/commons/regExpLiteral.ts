import { isRegExpLiteral, type RegExpLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type RegExpLiteralFields = {
    pattern: RegExpLiteral['pattern'];
    flags: RegExpLiteral['flags'];
};

export class RegExpLiteralTypeClass extends LwcCommonTypeClass<'regExpLiteral'> {
    private readonly value: RegExpLiteralFields;

    private constructor(value: RegExpLiteralFields) {
        super('regExpLiteral');
        this.value = value;
    }

    static create(target: RegExpLiteral, originalSource: string): RegExpLiteralTypeClass {
        return new RegExpLiteralTypeClass({
            pattern: target.pattern,
            flags: target.flags,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): RegExpLiteralFields {
        return this.value;
    }

    getPattern(): RegExpLiteralFields['pattern'] {
        return this.value.pattern;
    }

    getFlags(): RegExpLiteralFields['flags'] {
        return this.value.flags;
    }
}

export const regExpLiteralTypePair: EvaluatePair<RegExpLiteral, RegExpLiteralTypeClass> =
    makeEvaluatePair(isRegExpLiteral, (target, originalSource) =>
        RegExpLiteralTypeClass.create(target, originalSource),
    );

export const isRegExpLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is RegExpLiteralTypeClass => target instanceof RegExpLiteralTypeClass;
