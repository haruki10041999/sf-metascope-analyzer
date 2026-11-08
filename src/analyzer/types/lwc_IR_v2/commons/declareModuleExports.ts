import { isDeclareModuleExports, type DeclareModuleExports } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import {
    typeAnnotationTypePair,
    type TypeAnnotationTypeClass,
} from '../flowVisitor/typeAnnotation';

const declareModuleExportsTypeAnnotationPairs = lazyPairs(() => [typeAnnotationTypePair] as const);

export type DeclareModuleExportsFields = {
    typeAnnotation: TypeAnnotationTypeClass | LwcErrorTypeClass;
};

export class DeclareModuleExportsTypeClass extends LwcCommonTypeClass<'declareModuleExports'> {
    private readonly value: DeclareModuleExportsFields;

    private constructor(value: DeclareModuleExportsFields) {
        super('declareModuleExports');
        this.value = value;
    }

    static create(
        target: DeclareModuleExports,
        originalSource: string,
    ): DeclareModuleExportsTypeClass {
        return new DeclareModuleExportsTypeClass({
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                declareModuleExportsTypeAnnotationPairs(),
                'DeclareModuleExports.typeAnnotation',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclareModuleExportsFields {
        return this.value;
    }

    getTypeAnnotation(): DeclareModuleExportsFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const declareModuleExportsTypePair: EvaluatePair<
    DeclareModuleExports,
    DeclareModuleExportsTypeClass
> = makeEvaluatePair(isDeclareModuleExports, (target, originalSource) =>
    DeclareModuleExportsTypeClass.create(target, originalSource),
);

export const isDeclareModuleExportsType = (
    target: LwcCommonTypeClass<string>,
): target is DeclareModuleExportsTypeClass => target instanceof DeclareModuleExportsTypeClass;
