import type {
    IdentifierJson,
    DotMethodCallJson,
    CallJson,
    BaseExpressionJson,
} from '../../../types';

export type ApexDotObjectCallName = {
    kind: 'object';
    name: string[];
};

export type ApexDotMethodCallName = {
    kind: 'method';
    path:
}

export type ApexMethodCallName = {
    kind: 'method';
    name: string;
};

const makeApexIdentifierNameOf = (identifier: IdentifierJson): string => {
    return identifier.name
}

const make

export const makeApexDotObjectCallNameOf = (
    call: DotMethodCallJson,
): ApexDotObjectCallName | undefined => {
    if (call.type === 'method') {
        return undefined;
    }

    const name: string[] = [];

    if (call.object.kind === 'identifier') {
        name.push(call.object.name);
    } else if (call.object.kind === 'memberAccess') {
        const objectName = makeApexDotObjectCallNameOf(call.object);
        if (objectName) {
            name.push(...objectName.name);
        }
    }

    name.push(call.member);
    return name.length > 0 ? { kind: 'object', name } : undefined;
};

const _makeApexDotMethodCallNameOf = (call: BaseExpressionJson, path: string[]) => {
    if (call.kind === 'identifier') {
        path.push(call.name);
    }

    if (call.kind === 'memberAccess') {
        if (call.type === 'method') {
            _makeApexDotMethodCallNameOf(call.object, path);
            path.push(call.member);
        } else {
            _makeApexDotMethodCallNameOf(call, path);
        }
    }

    if (call.kind === 'call') {
    }
};

export const makeApexDotMethodCallNameOf = (
    call: DotMethodCallJson,
): ApexDotMethodCallName | undefined => {
    if (call.type !== 'object') {
        return undefined;
    }

    const objectName = makeApexDotObjectCallNameOf(call);
    if (!objectName) {
        return undefined;
    }

    return {
        kind: 'method',
        path: objectName.name,
        name: [call.member],
    };
};

export const makeApexMethodCallNameOf = (call: CallJson): ApexMethodCallName => {
    return {
        kind: 'method',
        name: call.callee.kind === 'identifier' ? call.callee.name : call.callee.kind,
    };
};
