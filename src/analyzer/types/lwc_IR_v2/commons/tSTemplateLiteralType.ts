import { isTSTemplateLiteralType, type TSTemplateLiteralType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import {
    templateElementTypePair,
    type TemplateElementTypeClass,
} from '../standardizedVisitor/templateElement';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

const tSTemplateLiteralTypeQuasisPairs = lazyPairs(() => [templateElementTypePair] as const);

export type TSTemplateLiteralTypeFields = {
    quasis: (TemplateElementTypeClass | LwcErrorTypeClass)[];
    types: (TSTypeTypeClass | LwcErrorTypeClass)[];
};

export class TSTemplateLiteralTypeTypeClass extends LwcCommonTypeClass<'tSTemplateLiteralType'> {
    private readonly value: TSTemplateLiteralTypeFields;

    private constructor(value: TSTemplateLiteralTypeFields) {
        super('tSTemplateLiteralType');
        this.value = value;
    }

    static create(
        target: TSTemplateLiteralType,
        originalSource: string,
    ): TSTemplateLiteralTypeTypeClass {
        return new TSTemplateLiteralTypeTypeClass({
            quasis: visitNodeList(
                target.quasis,
                originalSource,
                tSTemplateLiteralTypeQuasisPairs(),
                'TSTemplateLiteralType.quasis',
            ),
            types: visitNodeList(
                target.types,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTemplateLiteralTypeFields {
        return this.value;
    }

    getQuasis(): TSTemplateLiteralTypeFields['quasis'] {
        return this.value.quasis;
    }

    getTypes(): TSTemplateLiteralTypeFields['types'] {
        return this.value.types;
    }
}

export const tSTemplateLiteralTypeTypePair: EvaluatePair<
    TSTemplateLiteralType,
    TSTemplateLiteralTypeTypeClass
> = makeEvaluatePair(isTSTemplateLiteralType, (target, originalSource) =>
    TSTemplateLiteralTypeTypeClass.create(target, originalSource),
);

export const isTSTemplateLiteralTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSTemplateLiteralTypeTypeClass => target instanceof TSTemplateLiteralTypeTypeClass;
