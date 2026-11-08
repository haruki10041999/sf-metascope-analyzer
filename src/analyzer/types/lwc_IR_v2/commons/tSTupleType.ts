import { isTSTupleType, type TSTupleType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSTupleTypeFields = {
    elementTypes: (TSTypeTypeClass | LwcErrorTypeClass)[];
};

export class TSTupleTypeTypeClass extends LwcCommonTypeClass<'tSTupleType'> {
    private readonly value: TSTupleTypeFields;

    private constructor(value: TSTupleTypeFields) {
        super('tSTupleType');
        this.value = value;
    }

    static create(target: TSTupleType, originalSource: string): TSTupleTypeTypeClass {
        return new TSTupleTypeTypeClass({
            elementTypes: visitNodeList(
                target.elementTypes,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTupleTypeFields {
        return this.value;
    }

    getElementTypes(): TSTupleTypeFields['elementTypes'] {
        return this.value.elementTypes;
    }
}

export const tSTupleTypeTypePair: EvaluatePair<TSTupleType, TSTupleTypeTypeClass> =
    makeEvaluatePair(isTSTupleType, (target, originalSource) =>
        TSTupleTypeTypeClass.create(target, originalSource),
    );

export const isTSTupleTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSTupleTypeTypeClass => target instanceof TSTupleTypeTypeClass;
