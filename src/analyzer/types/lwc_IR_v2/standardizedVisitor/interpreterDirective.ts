import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isInterpreterDirective, type InterpreterDirective } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type InterpreterDirectiveFields = TypeField<'interpreterDirective'> & {
    value: InterpreterDirective['value'];
};

export class InterpreterDirectiveTypeClass extends LwcCommonTypeClass<
    'interpreterDirective',
    InterpreterDirectiveFields
> {
    private constructor(value: FieldsOf<InterpreterDirectiveFields>, sourceSpan: SourceSpan) {
        super('interpreterDirective', value, sourceSpan);
    }

    static create(
        target: InterpreterDirective,
        originalSource: string,
    ): InterpreterDirectiveTypeClass {
        return new InterpreterDirectiveTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): InterpreterDirectiveFields['value'] {
        return this.getFields().value;
    }
}

export const interpreterDirectiveTypePair: EvaluatePair<
    InterpreterDirective,
    InterpreterDirectiveTypeClass
> = makeEvaluatePair(isInterpreterDirective, (target, originalSource) =>
    InterpreterDirectiveTypeClass.create(target, originalSource),
);

export const isInterpreterDirectiveType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is InterpreterDirectiveTypeClass => target instanceof InterpreterDirectiveTypeClass;
