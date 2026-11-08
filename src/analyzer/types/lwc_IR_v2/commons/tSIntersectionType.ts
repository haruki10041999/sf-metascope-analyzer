import { isTSIntersectionType, type TSIntersectionType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSIntersectionTypeFields = {
    types: (TSTypeTypeClass | LwcErrorTypeClass)[];
};

export class TSIntersectionTypeTypeClass extends LwcCommonTypeClass<'tSIntersectionType'> {
    private readonly value: TSIntersectionTypeFields;

    private constructor(value: TSIntersectionTypeFields) {
        super('tSIntersectionType');
        this.value = value;
    }

    static create(target: TSIntersectionType, originalSource: string): TSIntersectionTypeTypeClass {
        return new TSIntersectionTypeTypeClass({
            types: visitNodeList(
                target.types,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSIntersectionTypeFields {
        return this.value;
    }

    getTypes(): TSIntersectionTypeFields['types'] {
        return this.value.types;
    }
}

export const tSIntersectionTypeTypePair: EvaluatePair<
    TSIntersectionType,
    TSIntersectionTypeTypeClass
> = makeEvaluatePair(isTSIntersectionType, (target, originalSource) =>
    TSIntersectionTypeTypeClass.create(target, originalSource),
);

export const isTSIntersectionTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSIntersectionTypeTypeClass => target instanceof TSIntersectionTypeTypeClass;
