import { isDirectiveLiteral, type DirectiveLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type DirectiveLiteralFields = {
    value: DirectiveLiteral['value'];
};

export class DirectiveLiteralTypeClass extends LwcCommonTypeClass<'directiveLiteral'> {
    private readonly value: DirectiveLiteralFields;

    private constructor(value: DirectiveLiteralFields) {
        super('directiveLiteral');
        this.value = value;
    }

    static create(target: DirectiveLiteral, originalSource: string): DirectiveLiteralTypeClass {
        return new DirectiveLiteralTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DirectiveLiteralFields {
        return this.value;
    }

    getValue(): DirectiveLiteralFields['value'] {
        return this.value.value;
    }
}

export const directiveLiteralTypePair: EvaluatePair<DirectiveLiteral, DirectiveLiteralTypeClass> =
    makeEvaluatePair(isDirectiveLiteral, (target, originalSource) =>
        DirectiveLiteralTypeClass.create(target, originalSource),
    );

export const isDirectiveLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is DirectiveLiteralTypeClass => target instanceof DirectiveLiteralTypeClass;
