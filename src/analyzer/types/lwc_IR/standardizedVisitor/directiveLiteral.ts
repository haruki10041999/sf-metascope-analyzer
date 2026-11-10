import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDirectiveLiteral, type DirectiveLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type DirectiveLiteralFields = TypeField<'directiveLiteral'> & {
    value: DirectiveLiteral['value'];
};

export class DirectiveLiteralTypeClass extends LwcCommonTypeClass<
    'directiveLiteral',
    DirectiveLiteralFields
> {
    private constructor(value: FieldsOf<DirectiveLiteralFields>, sourceSpan: SourceSpan) {
        super('directiveLiteral', value, sourceSpan);
    }

    static create(target: DirectiveLiteral, originalSource: string): DirectiveLiteralTypeClass {
        return new DirectiveLiteralTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): DirectiveLiteralFields['value'] {
        return this.getFields().value;
    }
}

export const directiveLiteralTypePair: EvaluatePair<DirectiveLiteral, DirectiveLiteralTypeClass> =
    makeEvaluatePair(isDirectiveLiteral, (target, originalSource) =>
        DirectiveLiteralTypeClass.create(target, originalSource),
    );

export const isDirectiveLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DirectiveLiteralTypeClass => target instanceof DirectiveLiteralTypeClass;
