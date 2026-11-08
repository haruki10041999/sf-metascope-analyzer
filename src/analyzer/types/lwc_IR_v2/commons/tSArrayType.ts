import { isTSArrayType, type TSArrayType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSArrayTypeFields = {
    elementType: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSArrayTypeTypeClass extends LwcCommonTypeClass<'tSArrayType'> {
    private readonly value: TSArrayTypeFields;

    private constructor(value: TSArrayTypeFields) {
        super('tSArrayType');
        this.value = value;
    }

    static create(target: TSArrayType, originalSource: string): TSArrayTypeTypeClass {
        return new TSArrayTypeTypeClass({
            elementType: visitNode(
                target.elementType,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSArrayTypeFields {
        return this.value;
    }

    getElementType(): TSArrayTypeFields['elementType'] {
        return this.value.elementType;
    }
}

export const tSArrayTypeTypePair: EvaluatePair<TSArrayType, TSArrayTypeTypeClass> =
    makeEvaluatePair(isTSArrayType, (target, originalSource) =>
        TSArrayTypeTypeClass.create(target, originalSource),
    );

export const isTSArrayTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSArrayTypeTypeClass => target instanceof TSArrayTypeTypeClass;
