import { isPrivateName, type PrivateName } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const privateNameIdPairs = lazyPairs(() => [identifierTypePair] as const);

export type PrivateNameFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
};

export class PrivateNameTypeClass extends LwcCommonTypeClass<'privateName'> {
    private readonly value: PrivateNameFields;

    private constructor(value: PrivateNameFields) {
        super('privateName');
        this.value = value;
    }

    static create(target: PrivateName, originalSource: string): PrivateNameTypeClass {
        return new PrivateNameTypeClass({
            id: visitNode(target.id, originalSource, privateNameIdPairs(), 'PrivateName.id'),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): PrivateNameFields {
        return this.value;
    }

    getId(): PrivateNameFields['id'] {
        return this.value.id;
    }
}

export const privateNameTypePair: EvaluatePair<PrivateName, PrivateNameTypeClass> =
    makeEvaluatePair(isPrivateName, (target, originalSource) =>
        PrivateNameTypeClass.create(target, originalSource),
    );

export const isPrivateNameType = (
    target: LwcCommonTypeClass<string>,
): target is PrivateNameTypeClass => target instanceof PrivateNameTypeClass;
