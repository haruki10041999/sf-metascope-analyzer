import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isFunctionTypeParam, type FunctionTypeParam } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from '../commons/identifier';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type FunctionTypeParamFields = TypeField<'functionTypeParam'> & {
    name: IdentifierTypeClass | null;
    typeAnnotation: FlowTypeTypeClass;
    optional: boolean;
};

export class FunctionTypeParamTypeClass extends LwcCommonTypeClass<
    'functionTypeParam',
    FunctionTypeParamFields
> {
    private constructor(value: FieldsOf<FunctionTypeParamFields>, sourceSpan: SourceSpan) {
        super('functionTypeParam', value, sourceSpan);
    }

    static create(target: FunctionTypeParam, originalSource: string): FunctionTypeParamTypeClass {
        return new FunctionTypeParamTypeClass(
            {
                name:
                    target.name == null
                        ? null
                        : IdentifierTypeClass.create(target.name, originalSource),
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
                optional: target.optional ?? false,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): FunctionTypeParamFields['name'] {
        return this.getFields().name;
    }

    getTypeAnnotation(): FunctionTypeParamFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getOptional(): FunctionTypeParamFields['optional'] {
        return this.getFields().optional;
    }
}

export const functionTypeParamTypePair: EvaluatePair<
    FunctionTypeParam,
    FunctionTypeParamTypeClass
> = makeEvaluatePair(isFunctionTypeParam, (target, originalSource) =>
    FunctionTypeParamTypeClass.create(target, originalSource),
);

export const isFunctionTypeParamType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is FunctionTypeParamTypeClass => target instanceof FunctionTypeParamTypeClass;
