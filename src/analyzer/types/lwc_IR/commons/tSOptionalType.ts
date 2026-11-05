import { isTSOptionalType, type TSOptionalType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSOptionalTypeFields = {
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSOptionalTypeTypeClass extends LwcCommonTypeClass<'tSOptionalType'> {
    private readonly value: TSOptionalTypeFields;

    private constructor(value: TSOptionalTypeFields) {
        super('tSOptionalType');
        this.value = value;
    }

    static create(target: TSOptionalType, originalSource: string): TSOptionalTypeTypeClass {
        return new TSOptionalTypeTypeClass({
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSOptionalTypeFields {
        return this.value;
    }

    getTypeAnnotation(): TSOptionalTypeFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSOptionalTypeTypePair: EvaluatePair<TSOptionalType, TSOptionalTypeTypeClass> =
    makeEvaluatePair(isTSOptionalType, (target, originalSource) =>
        TSOptionalTypeTypeClass.create(target, originalSource),
    );

export const isTSOptionalTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSOptionalTypeTypeClass => target instanceof TSOptionalTypeTypeClass;
