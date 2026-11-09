import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSArrayType, type TSArrayType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSArrayTypeFields = TypeField<'tSArrayType'> & {
    elementType: TSTypeTypeClass;
};

export class TSArrayTypeTypeClass extends LwcCommonTypeClass<'tSArrayType', TSArrayTypeFields> {
    private constructor(value: FieldsOf<TSArrayTypeFields>, sourceSpan: SourceSpan) {
        super('tSArrayType', value, sourceSpan);
    }

    static create(target: TSArrayType, originalSource: string): TSArrayTypeTypeClass {
        return new TSArrayTypeTypeClass(
            {
                elementType: visitNode(
                    target.elementType,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getElementType(): TSArrayTypeFields['elementType'] {
        return this.getFields().elementType;
    }
}

export const tSArrayTypeTypePair: EvaluatePair<TSArrayType, TSArrayTypeTypeClass> =
    makeEvaluatePair(isTSArrayType, (target, originalSource) =>
        TSArrayTypeTypeClass.create(target, originalSource),
    );

export const isTSArrayTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSArrayTypeTypeClass => target instanceof TSArrayTypeTypeClass;
