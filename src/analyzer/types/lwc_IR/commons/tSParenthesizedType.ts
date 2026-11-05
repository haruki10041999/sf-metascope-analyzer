import { isTSParenthesizedType, type TSParenthesizedType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSParenthesizedTypeFields = {
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSParenthesizedTypeTypeClass extends LwcCommonTypeClass<'tSParenthesizedType'> {
    private readonly value: TSParenthesizedTypeFields;

    private constructor(value: TSParenthesizedTypeFields) {
        super('tSParenthesizedType');
        this.value = value;
    }

    static create(
        target: TSParenthesizedType,
        originalSource: string,
    ): TSParenthesizedTypeTypeClass {
        return new TSParenthesizedTypeTypeClass({
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSParenthesizedTypeFields {
        return this.value;
    }

    getTypeAnnotation(): TSParenthesizedTypeFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSParenthesizedTypeTypePair: EvaluatePair<
    TSParenthesizedType,
    TSParenthesizedTypeTypeClass
> = makeEvaluatePair(isTSParenthesizedType, (target, originalSource) =>
    TSParenthesizedTypeTypeClass.create(target, originalSource),
);

export const isTSParenthesizedTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSParenthesizedTypeTypeClass => target instanceof TSParenthesizedTypeTypeClass;
