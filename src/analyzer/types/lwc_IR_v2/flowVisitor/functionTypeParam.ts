import { isFunctionTypeParam, type FunctionTypeParam } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

const functionTypeParamNamePairs = lazyPairs(() => [identifierTypePair] as const);

export type FunctionTypeParamFields = {
    name: IdentifierTypeClass | LwcErrorTypeClass | null;
    typeAnnotation: FlowTypeTypeClass | LwcErrorTypeClass;
    optional: NonNullable<FunctionTypeParam['optional']> | null;
};

export class FunctionTypeParamTypeClass extends LwcCommonTypeClass<'functionTypeParam'> {
    private readonly value: FunctionTypeParamFields;

    private constructor(value: FunctionTypeParamFields) {
        super('functionTypeParam');
        this.value = value;
    }

    static create(target: FunctionTypeParam, originalSource: string): FunctionTypeParamTypeClass {
        return new FunctionTypeParamTypeClass({
            name: visitOptionalNode(
                target.name,
                originalSource,
                functionTypeParamNamePairs(),
                'FunctionTypeParam.name',
            ),
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            optional: target.optional ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): FunctionTypeParamFields {
        return this.value;
    }

    getName(): FunctionTypeParamFields['name'] {
        return this.value.name;
    }

    getTypeAnnotation(): FunctionTypeParamFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getOptional(): FunctionTypeParamFields['optional'] {
        return this.value.optional;
    }
}

export const functionTypeParamTypePair: EvaluatePair<
    FunctionTypeParam,
    FunctionTypeParamTypeClass
> = makeEvaluatePair(isFunctionTypeParam, (target, originalSource) =>
    FunctionTypeParamTypeClass.create(target, originalSource),
);

export const isFunctionTypeParamType = (
    target: LwcCommonTypeClass<string>,
): target is FunctionTypeParamTypeClass => target instanceof FunctionTypeParamTypeClass;
