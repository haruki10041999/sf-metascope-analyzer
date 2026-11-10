import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDirective, type Directive } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { DirectiveLiteralTypeClass } from './directiveLiteral';

export type DirectiveFields = TypeField<'directive'> & {
    value: DirectiveLiteralTypeClass;
};

export class DirectiveTypeClass extends LwcCommonTypeClass<'directive', DirectiveFields> {
    private constructor(value: FieldsOf<DirectiveFields>, sourceSpan: SourceSpan) {
        super('directive', value, sourceSpan);
    }

    static create(target: Directive, originalSource: string): DirectiveTypeClass {
        return new DirectiveTypeClass(
            {
                value: DirectiveLiteralTypeClass.create(target.value, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): DirectiveFields['value'] {
        return this.getFields().value;
    }
}

export const directiveTypePair: EvaluatePair<Directive, DirectiveTypeClass> = makeEvaluatePair(
    isDirective,
    (target, originalSource) => DirectiveTypeClass.create(target, originalSource),
);

export const isDirectiveType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DirectiveTypeClass => target instanceof DirectiveTypeClass;
