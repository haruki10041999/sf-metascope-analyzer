import type { ApexUnitJson } from '../parser/Apex/unit';
import {
    type ApexInterfaceMember,
    apexInterfaceKeyOf,
    apexInterfaceOf,
} from '../processor/Apex/interface';
import {
    type LwcInterfaceMember,
    lwcInterfaceKeyOf,
    lwcInterfaceOf,
} from '../processor/Lwc/interface';
import type { LwcBundleJson } from '../types';

import { changedProps, compareKeyed, readable, rowBase } from './commons';
import type { ApexInterfaceRow, LwcInterfaceRow, SnapshotInput } from './types';

// コードの公開の形の provider (apex.interface / lwc.interface)。意味の差分 (docs/json-redesign-plan.md の #11 の続き):
// 2 つの時点の解析の結果 (apexInterfaceOf・lwcInterfaceOf) を比べ、増えた・減った・変わったものに status を付ける。
// before を渡さなければ、after の公開の形の一覧

/** 単位を名前で対応付け、単位ごとに公開の形を比べる */
const compareInterfaces = <J, M extends { sourceKeys?: unknown }>(
    before: { id: string; filePath: string; json: J }[] | undefined,
    after: { id: string; filePath: string; json: J }[],
    hasBefore: boolean,
    interfaceOf: (json: J) => M[],
    keyOf: (member: M) => string,
    onlyChanged: boolean | undefined,
) =>
    compareKeyed(
        before,
        after,
        (u) => u.id,
        hasBefore,
        () => false,
    ).flatMap((unit) => {
        const owner = (unit.after ?? unit.before)!;
        return (
            compareKeyed<M>(
                unit.before ? interfaceOf(unit.before.json) : undefined,
                unit.after ? interfaceOf(unit.after.json) : undefined,
                keyOf,
                hasBefore,
                (b, a) => changedProps(b, a, ['sourceKeys']).length === 0,
            )
                // onlyChanged は比べたときだけ効く (1 時点なら、すべてを出す)
                .filter((m) => !onlyChanged || !hasBefore || (m.status && m.status !== 'unchanged'))
                .map((m) => {
                    const member = (m.after ?? m.before)!;
                    const changed =
                        m.status === 'changed'
                            ? changedProps(m.before, m.after, ['sourceKeys']).map((c) => c.name)
                            : [];
                    const { sourceKeys: _sourceKeys, ...rest } = member;
                    return {
                        base: rowBase(m, member as never, owner.filePath),
                        owner,
                        rest,
                        changed,
                    };
                })
        );
    });

/**
 * apex.interface: Apex のクラスの、外から使えるクラス・メンバー (global・public・@AuraEnabled など)。
 * before を渡すと、公開メソッドの追加・削除・引数や戻り値の型の変化が分かる。オーバーロードは引数の型で分ける
 * (引数の型を変えると、削除と追加になる)
 */
export const getApexInterface = (
    input: SnapshotInput,
    args: { onlyChanged?: boolean } = {},
): ApexInterfaceRow[] =>
    compareInterfaces<ApexUnitJson, ApexInterfaceMember>(
        input.before ? readable<ApexUnitJson>(input.before.apex, 'apexUnit') : undefined,
        readable<ApexUnitJson>(input.after.apex, 'apexUnit'),
        input.before !== undefined,
        apexInterfaceOf,
        apexInterfaceKeyOf,
        args.onlyChanged,
    ).map(({ base, owner, rest, changed }): ApexInterfaceRow => ({
        ...base,
        className: owner.json.name,
        ...(rest as Omit<ApexInterfaceMember, 'sourceKeys'>),
        ...(changed.length ? { changedProperties: changed } : {}),
    }));

/** lwc.interface: LWC の、親から使えるもの (@api のプロパティ・メソッド、発行するイベント、slot) */
export const getLwcInterface = (
    input: SnapshotInput,
    args: { onlyChanged?: boolean } = {},
): LwcInterfaceRow[] =>
    compareInterfaces<LwcBundleJson, LwcInterfaceMember>(
        input.before ? readable<LwcBundleJson>(input.before.lwc, 'lwcBundle') : undefined,
        readable<LwcBundleJson>(input.after.lwc, 'lwcBundle'),
        input.before !== undefined,
        lwcInterfaceOf,
        lwcInterfaceKeyOf,
        args.onlyChanged,
    ).map(({ base, owner, rest, changed }): LwcInterfaceRow => ({
        ...base,
        component: `${owner.json.namespace}/${owner.json.name}`,
        ...(rest as Omit<LwcInterfaceMember, 'sourceKeys'>),
        ...(changed.length ? { changedProperties: changed } : {}),
    }));
