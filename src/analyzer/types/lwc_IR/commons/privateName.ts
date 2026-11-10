import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isPrivateName, type PrivateName } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';

export type PrivateNameFields = TypeField<'privateName'> & {
    id: IdentifierTypeClass;
};

export class PrivateNameTypeClass extends LwcCommonTypeClass<'privateName', PrivateNameFields> {
    private constructor(value: FieldsOf<PrivateNameFields>, sourceSpan: SourceSpan) {
        super('privateName', value, sourceSpan);
    }

    static create(target: PrivateName, originalSource: string): PrivateNameTypeClass {
        return new PrivateNameTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): PrivateNameFields['id'] {
        return this.getFields().id;
    }
}

export const privateNameTypePair: EvaluatePair<PrivateName, PrivateNameTypeClass> =
    makeEvaluatePair(isPrivateName, (target, originalSource) =>
        PrivateNameTypeClass.create(target, originalSource),
    );

export const isPrivateNameType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is PrivateNameTypeClass => target instanceof PrivateNameTypeClass;
