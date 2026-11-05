import { isTSDeclareFunction, type TSDeclareFunction } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import {
    functionParameterVisitorEvaluatePairs,
    type FunctionParameterTypeClass,
} from '../functionParameterVisitor';
import {
    tSTypeAnnotationTypePair,
    type TSTypeAnnotationTypeClass,
} from '../typeScriptVisitor/tSTypeAnnotation';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSDeclareFunctionIdPairs = lazyPairs(() => [identifierTypePair] as const);
const tSDeclareFunctionReturnTypePairs = lazyPairs(() => [tSTypeAnnotationTypePair] as const);
const tSDeclareFunctionTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);

export type TSDeclareFunctionFields = {
    params: (FunctionParameterTypeClass | LwcErrorTypeClass)[];
    generator: TSDeclareFunction['generator'];
    async: TSDeclareFunction['async'];
    declare: NonNullable<TSDeclareFunction['declare']> | null;
    id: IdentifierTypeClass | LwcErrorTypeClass | null;
    returnType: TSTypeAnnotationTypeClass | LwcErrorTypeClass | null;
    typeParameters: TSTypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
};

export class TSDeclareFunctionTypeClass extends LwcCommonTypeClass<'tSDeclareFunction'> {
    private readonly value: TSDeclareFunctionFields;

    private constructor(value: TSDeclareFunctionFields) {
        super('tSDeclareFunction');
        this.value = value;
    }

    static create(target: TSDeclareFunction, originalSource: string): TSDeclareFunctionTypeClass {
        return new TSDeclareFunctionTypeClass({
            params: visitNodeList(
                target.params,
                originalSource,
                functionParameterVisitorEvaluatePairs(),
                'FunctionParameterVisitor',
            ),
            generator: target.generator,
            async: target.async,
            declare: target.declare ?? null,
            id: visitOptionalNode(
                target.id,
                originalSource,
                tSDeclareFunctionIdPairs(),
                'TSDeclareFunction.id',
            ),
            returnType: visitOptionalNode(
                target.returnType,
                originalSource,
                tSDeclareFunctionReturnTypePairs(),
                'TSDeclareFunction.returnType',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSDeclareFunctionTypeParametersPairs(),
                'TSDeclareFunction.typeParameters',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSDeclareFunctionFields {
        return this.value;
    }

    getParams(): TSDeclareFunctionFields['params'] {
        return this.value.params;
    }

    getGenerator(): TSDeclareFunctionFields['generator'] {
        return this.value.generator;
    }

    getAsync(): TSDeclareFunctionFields['async'] {
        return this.value.async;
    }

    getDeclare(): TSDeclareFunctionFields['declare'] {
        return this.value.declare;
    }

    getId(): TSDeclareFunctionFields['id'] {
        return this.value.id;
    }

    getReturnType(): TSDeclareFunctionFields['returnType'] {
        return this.value.returnType;
    }

    getTypeParameters(): TSDeclareFunctionFields['typeParameters'] {
        return this.value.typeParameters;
    }
}

export const tSDeclareFunctionTypePair: EvaluatePair<
    TSDeclareFunction,
    TSDeclareFunctionTypeClass
> = makeEvaluatePair(isTSDeclareFunction, (target, originalSource) =>
    TSDeclareFunctionTypeClass.create(target, originalSource),
);

export const isTSDeclareFunctionType = (
    target: LwcCommonTypeClass<string>,
): target is TSDeclareFunctionTypeClass => target instanceof TSDeclareFunctionTypeClass;
