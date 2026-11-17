import {
    lwcTypeTextOf,
    type ConvertKeys,
    type LwcBundleJson,
    type LwcModifiersJson,
} from '../../types';

import { analyzeLwcComponent } from './analysis';
import { LWC_TOAST_EVENT_NAME, analyzeLwcModuleCalls } from './calls';

// LWC の公開の形 (親から使える @api のプロパティ・メソッド、発行するイベント、slot)。意味の差分の材料
// (docs/json-redesign-plan.md の #11 の続き)。2 つの時点のこの結果を比べると「@api が増えた・イベントがなくなった」が分かる
// (report/code.ts の lwc.interface)

/** 親から使えるもの 1 つ */
export type LwcInterfaceMember = {
    memberType: 'property' | 'method' | 'event' | 'slot';
    /** 名前 (名前のない slot は '') */
    name: string;
    /** プロパティの型・メソッドの戻り値の型 (TS・Flow で書いたときだけ) */
    type?: string;
    /** メソッドの引数の名前 (分割代入の引数は '{...}'・'[...]') */
    params?: string[];
    /** プロパティ: get だけ・set だけ・両方 (getter / setter で書いたもの。フィールドは field) */
    accessor?: 'field' | 'get' | 'set' | 'get/set';
    sourceKeys?: ConvertKeys;
};

const hasApi = (modifier: LwcModifiersJson | undefined) =>
    (modifier?.decorator ?? []).some((d) => d.kind === 'lwcDecorator' && d.name === 'api');

/**
 * バンドルの、親から使えるもの (メインのモジュールのコンポーネントの @api、発行するイベント、テンプレートの slot)。
 * イベントは名前で 1 つ (トーストは親が受け取らないので除く)
 */
export const lwcInterfaceOf = (bundle: LwcBundleJson): LwcInterfaceMember[] => {
    const component = bundle.modules.find((m) => m.main)?.module?.component;
    const result: LwcInterfaceMember[] = [];
    for (const member of component?.block ?? []) {
        if (member.kind === 'lwcField' && hasApi(member.modifier)) {
            result.push({
                memberType: 'property',
                name: member.name,
                ...(member.variantType ? { type: lwcTypeTextOf(member.variantType) } : {}),
                accessor: 'field',
                sourceKeys: member.sourceKeys.base,
            });
        } else if (
            member.kind === 'lwcProperty' &&
            (hasApi(member.getterContent?.modifier) || hasApi(member.setterContent?.modifier))
        ) {
            result.push({
                memberType: 'property',
                name: member.name,
                ...(member.variantType ? { type: lwcTypeTextOf(member.variantType) } : {}),
                accessor:
                    member.isGetter && member.isSetter
                        ? 'get/set'
                        : member.isGetter
                          ? 'get'
                          : 'set',
                sourceKeys: member.sourceKeys.base,
            });
        } else if (member.kind === 'lwcMethod' && hasApi(member.modifier)) {
            result.push({
                memberType: 'method',
                name: member.name,
                params: member.param.map(
                    (p) => p.variant ?? (p.pattern?.kind === 'jsArrayPattern' ? '[...]' : '{...}'),
                ),
                ...(member.returnType ? { type: lwcTypeTextOf(member.returnType) } : {}),
                sourceKeys: member.sourceKeys.base,
            });
        }
    }
    // イベント (発行するものの最初の位置)
    const main = bundle.modules.find((m) => m.main)?.module;
    const events = new Map<string, ConvertKeys>();
    for (const content of main ? analyzeLwcModuleCalls(main) : []) {
        if (content.ownerKind !== 'lwcComponent') continue;
        for (const event of content.events) {
            // 名前が式で分からないもの ('') は出さない
            if (!event.name || event.name === LWC_TOAST_EVENT_NAME || events.has(event.name))
                continue;
            events.set(event.name, event.sourceKeys);
        }
    }
    for (const [name, sourceKeys] of events) {
        result.push({ memberType: 'event', name, sourceKeys });
    }
    for (const slot of analyzeLwcComponent(bundle).slots) {
        result.push({ memberType: 'slot', name: slot });
    }
    return result;
};

/** メンバーを見分けるキー */
export const lwcInterfaceKeyOf = (member: LwcInterfaceMember): string =>
    `${member.memberType}:${member.name}`;
