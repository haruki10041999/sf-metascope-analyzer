import { isTSRestType, type TSRestType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSRestTypeFields = {
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSRestTypeTypeClass extends LwcCommonTypeClass<'tSRestType'> {
    private readonly value: TSRestTypeFields;

    private constructor(value: TSRestTypeFields) {
        super('tSRestType');
        this.value = value;
    }

    static create(target: TSRestType, originalSource: string): TSRestTypeTypeClass {
        return new TSRestTypeTypeClass({
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSRestTypeFields {
        return this.value;
    }

    getTypeAnnotation(): TSRestTypeFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSRestTypeTypePair: EvaluatePair<TSRestType, TSRestTypeTypeClass> = makeEvaluatePair(
    isTSRestType,
    (target, originalSource) => TSRestTypeTypeClass.create(target, originalSource),
);

export const isTSRestTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSRestTypeTypeClass => target instanceof TSRestTypeTypeClass;
