import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSParenthesizedType, type TSParenthesizedType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSParenthesizedTypeFields = TypeField<'tSParenthesizedType'> & {
    typeAnnotation: TSTypeTypeClass;
};

export class TSParenthesizedTypeTypeClass extends LwcCommonTypeClass<
    'tSParenthesizedType',
    TSParenthesizedTypeFields
> {
    private constructor(value: FieldsOf<TSParenthesizedTypeFields>, sourceSpan: SourceSpan) {
        super('tSParenthesizedType', value, sourceSpan);
    }

    static create(
        target: TSParenthesizedType,
        originalSource: string,
    ): TSParenthesizedTypeTypeClass {
        return new TSParenthesizedTypeTypeClass(
            {
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): TSParenthesizedTypeFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSParenthesizedTypeTypePair: EvaluatePair<
    TSParenthesizedType,
    TSParenthesizedTypeTypeClass
> = makeEvaluatePair(isTSParenthesizedType, (target, originalSource) =>
    TSParenthesizedTypeTypeClass.create(target, originalSource),
);

export const isTSParenthesizedTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSParenthesizedTypeTypeClass => target instanceof TSParenthesizedTypeTypeClass;
