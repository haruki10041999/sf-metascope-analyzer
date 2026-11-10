import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSExternalModuleReference, type TSExternalModuleReference } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { StringLiteralTypeClass } from '../commons/stringLiteral';

export type TSExternalModuleReferenceFields = TypeField<'tSExternalModuleReference'> & {
    expression: StringLiteralTypeClass;
};

export class TSExternalModuleReferenceTypeClass extends LwcCommonTypeClass<
    'tSExternalModuleReference',
    TSExternalModuleReferenceFields
> {
    private constructor(value: FieldsOf<TSExternalModuleReferenceFields>, sourceSpan: SourceSpan) {
        super('tSExternalModuleReference', value, sourceSpan);
    }

    static create(
        target: TSExternalModuleReference,
        originalSource: string,
    ): TSExternalModuleReferenceTypeClass {
        return new TSExternalModuleReferenceTypeClass(
            {
                expression: StringLiteralTypeClass.create(target.expression, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): TSExternalModuleReferenceFields['expression'] {
        return this.getFields().expression;
    }
}

export const tSExternalModuleReferenceTypePair: EvaluatePair<
    TSExternalModuleReference,
    TSExternalModuleReferenceTypeClass
> = makeEvaluatePair(isTSExternalModuleReference, (target, originalSource) =>
    TSExternalModuleReferenceTypeClass.create(target, originalSource),
);

export const isTSExternalModuleReferenceType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSExternalModuleReferenceTypeClass =>
    target instanceof TSExternalModuleReferenceTypeClass;
