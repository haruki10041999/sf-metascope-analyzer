import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSEnumDeclaration, type TSEnumDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { TSEnumBodyTypeClass } from '../typeScriptVisitor/tSEnumBody';
import { IdentifierTypeClass } from './identifier';

export type TSEnumDeclarationFields = TypeField<'tSEnumDeclaration'> & {
    declare: boolean;
    const: boolean;
    id: IdentifierTypeClass;
    body: TSEnumBodyTypeClass;
};

export class TSEnumDeclarationTypeClass extends LwcCommonTypeClass<
    'tSEnumDeclaration',
    TSEnumDeclarationFields
> {
    private constructor(value: FieldsOf<TSEnumDeclarationFields>, sourceSpan: SourceSpan) {
        super('tSEnumDeclaration', value, sourceSpan);
    }

    static create(target: TSEnumDeclaration, originalSource: string): TSEnumDeclarationTypeClass {
        return new TSEnumDeclarationTypeClass(
            {
                declare: target.declare ?? false,
                const: target.const ?? false,
                id: IdentifierTypeClass.create(target.id, originalSource),
                body: TSEnumBodyTypeClass.create(target.body, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getDeclare(): TSEnumDeclarationFields['declare'] {
        return this.getFields().declare;
    }

    getConst(): TSEnumDeclarationFields['const'] {
        return this.getFields().const;
    }

    getId(): TSEnumDeclarationFields['id'] {
        return this.getFields().id;
    }

    getBody(): TSEnumDeclarationFields['body'] {
        return this.getFields().body;
    }
}

export const tSEnumDeclarationTypePair: EvaluatePair<
    TSEnumDeclaration,
    TSEnumDeclarationTypeClass
> = makeEvaluatePair(isTSEnumDeclaration, (target, originalSource) =>
    TSEnumDeclarationTypeClass.create(target, originalSource),
);

export const isTSEnumDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSEnumDeclarationTypeClass => target instanceof TSEnumDeclarationTypeClass;
