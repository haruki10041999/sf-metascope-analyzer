import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareModuleExports, type DeclareModuleExports } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { TypeAnnotationTypeClass } from '../flowVisitor/typeAnnotation';

export type DeclareModuleExportsFields = TypeField<'declareModuleExports'> & {
    typeAnnotation: TypeAnnotationTypeClass;
};

export class DeclareModuleExportsTypeClass extends LwcCommonTypeClass<
    'declareModuleExports',
    DeclareModuleExportsFields
> {
    private constructor(value: FieldsOf<DeclareModuleExportsFields>, sourceSpan: SourceSpan) {
        super('declareModuleExports', value, sourceSpan);
    }

    static create(
        target: DeclareModuleExports,
        originalSource: string,
    ): DeclareModuleExportsTypeClass {
        return new DeclareModuleExportsTypeClass(
            {
                typeAnnotation: TypeAnnotationTypeClass.create(
                    target.typeAnnotation,
                    originalSource,
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): DeclareModuleExportsFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const declareModuleExportsTypePair: EvaluatePair<
    DeclareModuleExports,
    DeclareModuleExportsTypeClass
> = makeEvaluatePair(isDeclareModuleExports, (target, originalSource) =>
    DeclareModuleExportsTypeClass.create(target, originalSource),
);

export const isDeclareModuleExportsType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareModuleExportsTypeClass => target instanceof DeclareModuleExportsTypeClass;
