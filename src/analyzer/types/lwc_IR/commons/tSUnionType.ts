import { isTSUnionType, type TSUnionType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSUnionTypeFields = {
    types: (TSTypeTypeClass | LwcErrorTypeClass)[];
};

export class TSUnionTypeTypeClass extends LwcCommonTypeClass<'tSUnionType'> {
    private readonly value: TSUnionTypeFields;

    private constructor(value: TSUnionTypeFields) {
        super('tSUnionType');
        this.value = value;
    }

    static create(target: TSUnionType, originalSource: string): TSUnionTypeTypeClass {
        return new TSUnionTypeTypeClass({
            types: visitNodeList(
                target.types,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSUnionTypeFields {
        return this.value;
    }

    getTypes(): TSUnionTypeFields['types'] {
        return this.value.types;
    }
}

export const tSUnionTypeTypePair: EvaluatePair<TSUnionType, TSUnionTypeTypeClass> =
    makeEvaluatePair(isTSUnionType, (target, originalSource) =>
        TSUnionTypeTypeClass.create(target, originalSource),
    );

export const isTSUnionTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSUnionTypeTypeClass => target instanceof TSUnionTypeTypeClass;
