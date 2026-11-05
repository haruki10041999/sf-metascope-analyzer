import { isTSInterfaceDeclaration, type TSInterfaceDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import {
    tSInterfaceBodyTypePair,
    type TSInterfaceBodyTypeClass,
} from '../typeScriptVisitor/tSInterfaceBody';
import {
    tSTypeParameterDeclarationTypePair,
    type TSTypeParameterDeclarationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterDeclaration';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import {
    tSInterfaceHeritageTypePair,
    type TSInterfaceHeritageTypeClass,
} from './tSInterfaceHeritage';

const tSInterfaceDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);
const tSInterfaceDeclarationTypeParametersPairs = lazyPairs(
    () => [tSTypeParameterDeclarationTypePair] as const,
);
const tSInterfaceDeclarationExtendsPairs = lazyPairs(() => [tSInterfaceHeritageTypePair] as const);
const tSInterfaceDeclarationBodyPairs = lazyPairs(() => [tSInterfaceBodyTypePair] as const);

export type TSInterfaceDeclarationFields = {
    declare: NonNullable<TSInterfaceDeclaration['declare']> | null;
    id: IdentifierTypeClass | LwcErrorTypeClass;
    typeParameters: TSTypeParameterDeclarationTypeClass | LwcErrorTypeClass | null;
    extends: (TSInterfaceHeritageTypeClass | LwcErrorTypeClass)[] | null;
    body: TSInterfaceBodyTypeClass | LwcErrorTypeClass;
};

export class TSInterfaceDeclarationTypeClass extends LwcCommonTypeClass<'tSInterfaceDeclaration'> {
    private readonly value: TSInterfaceDeclarationFields;

    private constructor(value: TSInterfaceDeclarationFields) {
        super('tSInterfaceDeclaration');
        this.value = value;
    }

    static create(
        target: TSInterfaceDeclaration,
        originalSource: string,
    ): TSInterfaceDeclarationTypeClass {
        return new TSInterfaceDeclarationTypeClass({
            declare: target.declare ?? null,
            id: visitNode(
                target.id,
                originalSource,
                tSInterfaceDeclarationIdPairs(),
                'TSInterfaceDeclaration.id',
            ),
            typeParameters: visitOptionalNode(
                target.typeParameters,
                originalSource,
                tSInterfaceDeclarationTypeParametersPairs(),
                'TSInterfaceDeclaration.typeParameters',
            ),
            extends:
                target.extends == null
                    ? null
                    : visitNodeList(
                          target.extends,
                          originalSource,
                          tSInterfaceDeclarationExtendsPairs(),
                          'TSInterfaceDeclaration.extends',
                      ),
            body: visitNode(
                target.body,
                originalSource,
                tSInterfaceDeclarationBodyPairs(),
                'TSInterfaceDeclaration.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSInterfaceDeclarationFields {
        return this.value;
    }

    getDeclare(): TSInterfaceDeclarationFields['declare'] {
        return this.value.declare;
    }

    getId(): TSInterfaceDeclarationFields['id'] {
        return this.value.id;
    }

    getTypeParameters(): TSInterfaceDeclarationFields['typeParameters'] {
        return this.value.typeParameters;
    }

    getExtends(): TSInterfaceDeclarationFields['extends'] {
        return this.value.extends;
    }

    getBody(): TSInterfaceDeclarationFields['body'] {
        return this.value.body;
    }
}

export const tSInterfaceDeclarationTypePair: EvaluatePair<
    TSInterfaceDeclaration,
    TSInterfaceDeclarationTypeClass
> = makeEvaluatePair(isTSInterfaceDeclaration, (target, originalSource) =>
    TSInterfaceDeclarationTypeClass.create(target, originalSource),
);

export const isTSInterfaceDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSInterfaceDeclarationTypeClass => target instanceof TSInterfaceDeclarationTypeClass;
