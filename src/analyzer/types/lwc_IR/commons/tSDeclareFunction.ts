import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSDeclareFunction, type TSDeclareFunction } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import {
    functionParameterVisitorEvaluatePairs,
    type FunctionParameterTypeClass,
} from '../functionParameterVisitor';
import { TSTypeAnnotationTypeClass } from '../typeScriptVisitor/tSTypeAnnotation';
import { TSTypeParameterDeclarationTypeClass } from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { IdentifierTypeClass } from './identifier';

/**
 * 名前のない関数の宣言 (オーバーロード・declare)を書けるのは export default だけなので、id は既定で null にしない。
 * export default の側では TSDeclareFunctionTypeClass<IdentifierTypeClass | null> を使う
 */
export type TSDeclareFunctionFields<TId extends IdentifierTypeClass | null = IdentifierTypeClass> =
    TypeField<'tSDeclareFunction'> & {
        params: FunctionParameterTypeClass[];
        generator: TSDeclareFunction['generator'];
        async: TSDeclareFunction['async'];
        declare: boolean;
        id: TId;
        returnType: TSTypeAnnotationTypeClass | null;
        typeParameters: TSTypeParameterDeclarationTypeClass | null;
    };

export class TSDeclareFunctionTypeClass<
    TId extends IdentifierTypeClass | null = IdentifierTypeClass,
> extends LwcCommonTypeClass<'tSDeclareFunction', TSDeclareFunctionFields<TId>> {
    private constructor(value: FieldsOf<TSDeclareFunctionFields<TId>>, sourceSpan: SourceSpan) {
        super('tSDeclareFunction', value, sourceSpan);
    }

    /** 名前のある関数の宣言 (オーバーロード・declare) (export default のほか)。名前がなければ IrBuildError */
    static create(target: TSDeclareFunction, originalSource: string): TSDeclareFunctionTypeClass {
        if (target.id == null) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                '名前のない関数の宣言 (オーバーロード・declare)は export default でしか書けません',
            );
        }
        return TSDeclareFunctionTypeClass.build(
            target,
            IdentifierTypeClass.create(target.id, originalSource),
            originalSource,
        );
    }

    /** export default の関数の宣言 (オーバーロード・declare) (名前を省略できる) */
    static createDefaultExport(
        target: TSDeclareFunction,
        originalSource: string,
    ): TSDeclareFunctionTypeClass<IdentifierTypeClass | null> {
        return TSDeclareFunctionTypeClass.build(
            target,
            target.id == null ? null : IdentifierTypeClass.create(target.id, originalSource),
            originalSource,
        );
    }

    private static build<TId extends IdentifierTypeClass | null>(
        target: TSDeclareFunction,
        id: TId,
        originalSource: string,
    ): TSDeclareFunctionTypeClass<TId> {
        return new TSDeclareFunctionTypeClass<TId>(
            {
                params: visitNodeList(
                    target.params,
                    originalSource,
                    functionParameterVisitorEvaluatePairs(),
                    'FunctionParameterVisitor',
                ),
                generator: target.generator,
                async: target.async,
                declare: target.declare ?? false,
                id,
                returnType:
                    target.returnType == null
                        ? null
                        : TSTypeAnnotationTypeClass.create(target.returnType, originalSource),
                typeParameters:
                    target.typeParameters == null
                        ? null
                        : TSTypeParameterDeclarationTypeClass.create(
                              target.typeParameters,
                              originalSource,
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getParams(): TSDeclareFunctionFields<TId>['params'] {
        return this.getFields().params;
    }

    getGenerator(): TSDeclareFunctionFields<TId>['generator'] {
        return this.getFields().generator;
    }

    getAsync(): TSDeclareFunctionFields<TId>['async'] {
        return this.getFields().async;
    }

    getDeclare(): TSDeclareFunctionFields<TId>['declare'] {
        return this.getFields().declare;
    }

    getId(): TSDeclareFunctionFields<TId>['id'] {
        return this.getFields().id;
    }

    getReturnType(): TSDeclareFunctionFields<TId>['returnType'] {
        return this.getFields().returnType;
    }

    getTypeParameters(): TSDeclareFunctionFields<TId>['typeParameters'] {
        return this.getFields().typeParameters;
    }
}

export const tSDeclareFunctionTypePair: EvaluatePair<
    TSDeclareFunction,
    TSDeclareFunctionTypeClass
> = makeEvaluatePair(isTSDeclareFunction, (target, originalSource) =>
    TSDeclareFunctionTypeClass.create(target, originalSource),
);

export const isTSDeclareFunctionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSDeclareFunctionTypeClass<IdentifierTypeClass | null> =>
    target instanceof TSDeclareFunctionTypeClass;
