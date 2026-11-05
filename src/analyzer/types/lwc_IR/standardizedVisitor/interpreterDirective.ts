import { isInterpreterDirective, type InterpreterDirective } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type InterpreterDirectiveFields = {
    value: InterpreterDirective['value'];
};

export class InterpreterDirectiveTypeClass extends LwcCommonTypeClass<'interpreterDirective'> {
    private readonly value: InterpreterDirectiveFields;

    private constructor(value: InterpreterDirectiveFields) {
        super('interpreterDirective');
        this.value = value;
    }

    static create(
        target: InterpreterDirective,
        originalSource: string,
    ): InterpreterDirectiveTypeClass {
        return new InterpreterDirectiveTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): InterpreterDirectiveFields {
        return this.value;
    }

    getValue(): InterpreterDirectiveFields['value'] {
        return this.value.value;
    }
}

export const interpreterDirectiveTypePair: EvaluatePair<
    InterpreterDirective,
    InterpreterDirectiveTypeClass
> = makeEvaluatePair(isInterpreterDirective, (target, originalSource) =>
    InterpreterDirectiveTypeClass.create(target, originalSource),
);

export const isInterpreterDirectiveType = (
    target: LwcCommonTypeClass<string>,
): target is InterpreterDirectiveTypeClass => target instanceof InterpreterDirectiveTypeClass;
