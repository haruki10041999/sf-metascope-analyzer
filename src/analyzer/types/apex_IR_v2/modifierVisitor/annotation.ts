import { AnnotationContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { ElementValueTypeClass } from '../valueVisitor';
import { ElementValuePairsTypeClass } from '../pairVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type AnnotationType = TypeField<'annotation'> & {
    name: IdTypeClass;
    /** `@Future` のように引数がなければ null */
    param: ElementValueTypeClass | ElementValuePairsTypeClass | null;
};

export class AnnotationTypeClass extends ApexCommonTypeClass<'annotation', AnnotationType> {
    private constructor(fields: FieldsOf<AnnotationType>, sourceSpan: SourceSpan) {
        super('annotation', fields, sourceSpan);
    }

    static create(ctx: AnnotationContext): AnnotationTypeClass {
        let param: AnnotationType['param'] = null;
        if (ctx.elementValue()) {
            param = createNode(
                ctx.elementValue(),
                (c) => ElementValueTypeClass.create(c),
                'elementValue',
            );
        } else if (ctx.elementValuePairs()) {
            param = createNode(
                ctx.elementValuePairs(),
                (c) => ElementValuePairsTypeClass.create(c),
                'elementValuePairs',
            );
        }

        return new AnnotationTypeClass(
            {
                name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                param,
            },
            getSourceSpan(ctx),
        );
    }

    getName(): AnnotationType['name'] {
        return this.getFields().name;
    }

    getParam(): AnnotationType['param'] {
        return this.getFields().param;
    }
}

export const isAnnotationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is AnnotationTypeClass => {
    return isSpicifyApexCommonTypeClass('annotation', target);
};
