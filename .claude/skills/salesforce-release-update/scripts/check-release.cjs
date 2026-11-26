#!/usr/bin/env node
// Salesforce の公式 PDF (pdftotext でテキストにしたもの) と、リポジトリの一覧を照合する。
// 依存のない Node のスクリプト。リポジトリの根で実行する。結果は JSON で標準出力に出す。
//
//   node check-release.cjs cover    <pdfのテキスト>           表紙の版 (Version・リリース・更新日)
//   node check-release.cjs apex     <Apex Reference のテキスト>
//   node check-release.cjs objects  <Object Reference のテキスト>
//   node check-release.cjs metadata <Metadata API のテキスト>
//   node check-release.cjs lwc      <Metadata API のテキスト>   LWC の capability・target・Lightning ページの種類
//   node check-release.cjs lwc-components <transformed-lwc-standard.json> [--write]
//                                     LWC の基本コンポーネント・属性・lightning/* のモジュール
//                                     (@salesforce/lwc-language-server の lib/resources にある JSON)
//   node check-release.cjs slds     <icons のメタデータのフォルダー> [--write]
//                                     SLDS のアイコン名 (@salesforce-ux/design-system の metadata/icons/*-icons-metadata.json)
//   --write を付けると、照合した結果で生成のファイル (standardComponentAttributes.ts・standardSldsIcons.ts) を作り直す
//
// 照合の決まり (SKILL.md の「照合の決まり」):
// - 公式資料にあってリポジトリにないものは「追加の候補」、リポジトリにあって資料にないものは「要確認」として出す。
//   どちらも自動では消さない (資料の抽出漏れ・別の資料にしか載らない型がある)
'use strict';
const fs = require('fs');

const STANDARD_TYPES = 'src/analyzer/processor/Apex/semantic/standardTypes.ts';
const STANDARD_OBJECTS = 'src/analyzer/processor/commons/standardObjects.ts';
const GRAPH = 'src/analyzer/processor/dependency/graph.ts';
const METADATA_TYPES = 'src/analyzer/processor/Metadata/standardTypes.ts';
const LWC_TARGETS = 'src/analyzer/types/lwc/standardTargets.ts';
const LWC_COMPONENTS = 'src/analyzer/types/lwc/standardComponents.ts';
const LWC_COMPONENT_ATTRIBUTES = 'src/analyzer/types/lwc/standardComponentAttributes.ts';
const LWC_MODULES = 'src/analyzer/types/lwc/standardModules.ts';
const SLDS_ICONS = 'src/analyzer/types/lwc/standardSldsIcons.ts';

const [command, textFile, ...flags] = process.argv.slice(2);
if (!command || !textFile) {
    console.error(
        'usage: node check-release.cjs <cover|apex|objects|metadata|lwc|lwc-components|slds> <text file | json | folder> [--write]',
    );
    process.exit(2);
}
const write = flags.includes('--write');
const printJson = (value) => console.log(JSON.stringify(value, null, 2));
const quote = (value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** 生成のファイルの頭 (手で直さない。スキルで作り直す) */
const generatedHeader = (lines) =>
    [
        '// このファイルは .claude/skills/salesforce-release-update/scripts/check-release.cjs が作る (手で直さない)。',
        ...lines.map((l) => `// ${l}`),
        '',
    ].join('\n');

/** lightning/uiRecordApi → lightning-ui-record-api (言語サーバーの JSON のモジュールの書き方) */
const moduleTagOf = (module) =>
    module.replace('/', '-').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** LWC の基本コンポーネント・属性・モジュール (言語サーバーの JSON) */
const lwcComponents = () => {
    const json = JSON.parse(fs.readFileSync(textFile, 'utf8'));
    const tags = json.tags.filter((tag) => typeof tag.name === 'string');
    const source = fs.readFileSync(LWC_COMPONENTS, 'utf8');
    const ours = [...source.matchAll(/^ {4}'([a-z-]+)':/gm)].map((m) => m[1]);
    const modulesSource = fs.readFileSync(LWC_MODULES, 'utf8');
    const modules = [...modulesSource.matchAll(/: '(lightning\/\w+)'/g)].map((m) => m[1]);
    const tagNames = new Set(tags.map((tag) => tag.name));
    const moduleTags = new Set(modules.map(moduleTagOf));
    // JSON の名前のうち、モジュール (lightning-ui-record-api など) は module の一覧と照合する
    const isModuleTag = (name) =>
        moduleTags.has(name) ||
        /^lightning-(ui-|platform-|message-service|navigation|emp-api|flow-support|page-reference-utils)/.test(
            name,
        );
    const components = tags.filter((tag) => !isModuleTag(tag.name));
    const verified = ours.filter((name) => tagNames.has(name));
    const result = {
        source: json.version
            ? `transformed-lwc-standard.json version ${json.version}`
            : 'transformed-lwc-standard.json',
        repository: { components: ours.length, modules: modules.length },
        components: {
            verified: verified.length,
            // JSON にあって一覧にない → 追加の候補 (lightningsnapin-* などは解析で使うかで決める)
            addCandidates: components
                .map((t) => t.name)
                .filter((n) => !ours.includes(n))
                .sort(),
            // 一覧にあって JSON にない → 消さない (子のコンポーネントは JSON に載らない)
            notInJson: ours.filter((n) => !tagNames.has(n)).sort(),
        },
        modules: {
            verified: modules.filter((m) => tagNames.has(moduleTagOf(m))),
            notInJson: modules.filter((m) => !tagNames.has(moduleTagOf(m))),
            // JSON にあるモジュールで一覧にないもの (解析で名前を見るものだけ一覧に持つので、自動では足さない)
            notListed: [...tagNames].filter((n) => isModuleTag(n) && !moduleTags.has(n)).sort(),
        },
    };
    printJson(result);
    if (!write) return;
    // 照合済みのコンポーネント・属性・全体の属性を生成のファイルに書く
    const attributesOf = (tag) =>
        [
            ...new Set(
                (tag.attributes ?? []).map((a) => a.name).filter((n) => typeof n === 'string'),
            ),
        ].sort();
    const lines = [
        generatedHeader([
            `LWC の基本コンポーネントの照合の結果と属性 (@salesforce/lwc-language-server の transformed-lwc-standard.json、${result.source})。`,
            'standardComponents.ts の LIGHTNING_COMPONENTS のうち、この JSON に載っていたものを照合済みとする (子のコンポーネントは載らない)。',
        ]),
        '/** 照合に使った言語サーバーのパッケージの版 */',
        `export const LWC_COMPONENTS_REFERENCE_SOURCE = ${quote(process.env.LWC_LANGUAGE_SERVER_VERSION ?? 'unknown')};`,
        '',
        '/** 照合済みの基本コンポーネント (言語サーバーの JSON に載っていたもの) */',
        'export const VERIFIED_LIGHTNING_COMPONENTS: ReadonlySet<string> = new Set([',
        ...verified.sort().map((n) => `    ${quote(n)},`),
        ']);',
        '',
        '/** 基本コンポーネント → 属性 (言語サーバーの JSON。照合済みのものだけ) */',
        'export const LIGHTNING_COMPONENT_ATTRIBUTES: Readonly<Record<string, readonly string[]>> = {',
        ...components
            .filter((t) => verified.includes(t.name))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((t) => `    ${quote(t.name)}: [${attributesOf(t).map(quote).join(', ')}],`),
        '};',
        '',
        '/** どの要素にも書ける属性 (言語サーバーの JSON の globalAttributes) */',
        'export const LWC_GLOBAL_ATTRIBUTES: readonly string[] = [',
        ...[...new Set((json.globalAttributes ?? []).map((a) => a.name).filter(Boolean))]
            .sort()
            .map((n) => `    ${quote(n)},`),
        '];',
        '',
    ];
    fs.writeFileSync(LWC_COMPONENT_ATTRIBUTES, lines.join('\n'));
    console.error(`wrote ${LWC_COMPONENT_ATTRIBUTES}`);
};

/** SLDS のアイコン名 (metadata/icons/<種類>-icons-metadata.json) */
const SLDS_CATEGORIES = ['action', 'custom', 'doctype', 'standard', 'utility'];
const slds = () => {
    const icons = Object.fromEntries(
        SLDS_CATEGORIES.map((category) => {
            const file = `${textFile}/${category}-icons-metadata.json`;
            const json = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
            return [category, Object.keys(json).sort()];
        }),
    );
    const current = fs.existsSync(SLDS_ICONS) ? fs.readFileSync(SLDS_ICONS, 'utf8') : '';
    const ours = Object.fromEntries(
        SLDS_CATEGORIES.map((category) => {
            const block = current.match(new RegExp(`^    ${category}: \\[([\\s\\S]*?)\\]`, 'm'));
            return [category, block ? [...block[1].matchAll(/'([\w-]+)'/g)].map((m) => m[1]) : []];
        }),
    );
    printJson({
        source: process.env.SLDS_VERSION ?? 'unknown',
        icons: Object.fromEntries(
            SLDS_CATEGORIES.map((c) => [
                c,
                {
                    json: icons[c].length,
                    repository: ours[c].length,
                    added: icons[c].filter((n) => !ours[c].includes(n)),
                    removed: ours[c].filter((n) => !icons[c].includes(n)),
                },
            ]),
        ),
    });
    if (!write) return;
    const lines = [
        generatedHeader([
            `SLDS のアイコン名 (@salesforce-ux/design-system ${process.env.SLDS_VERSION ?? ''} の metadata/icons/<種類>-icons-metadata.json のキー)。`,
            'lightning-icon などの icon-name (<種類>:<名前>) が実在するかの確かめに使う。',
        ]),
        '/** 照合に使った SLDS のパッケージの版 */',
        `export const SLDS_ICONS_REFERENCE_VERSION = ${quote(process.env.SLDS_VERSION ?? 'unknown')};`,
        '',
        '/** アイコンの種類 → 名前 */',
        'export const SLDS_ICONS = {',
        ...SLDS_CATEGORIES.map((c) => `    ${c}: [${icons[c].map(quote).join(', ')}],`),
        '} as const satisfies Readonly<Record<string, readonly string[]>>;',
        '',
    ];
    fs.writeFileSync(SLDS_ICONS, lines.join('\n'));
    console.error(`wrote ${SLDS_ICONS}`);
};

const jsonCommands = { 'lwc-components': lwcComponents, slds };
if (jsonCommands[command]) {
    jsonCommands[command]();
    process.exit(0);
}
// 表示用のゼロ幅文字・ソフトハイフンを外す
const text = fs.readFileSync(textFile, 'utf8').replace(/[​­]/g, '');
const pages = text.split('\f');
const words = new Set(text.match(/[A-Za-z_][A-Za-z0-9_]*/g));
const print = (value) => console.log(JSON.stringify(value, null, 2));

/** 表紙の版 */
const coverOf = () => {
    const head = pages.slice(0, 2).join('\n');
    const version = head.match(/Version (\d+(?:\.\d+)?), ([A-Za-z]+ '\d\d)/);
    const updated = head.match(/Last updated: ([A-Za-z]+ \d+, \d{4})/);
    return {
        title: (head.split('\n').find((line) => line.trim()) ?? '').trim(),
        apiVersion: version ? Number(version[1]) : null,
        release: version ? version[2] : null,
        lastUpdated: updated ? updated[1] : null,
    };
};

/** standardTypes.ts の STANDARD_TYPES_BY_NAMESPACE (名前空間 → [型名, 種別の文字列]) */
const readStandardTypes = () => {
    const source = fs.readFileSync(STANDARD_TYPES, 'utf8');
    const block = source.match(/const STANDARD_TYPES_BY_NAMESPACE[\s\S]*?\n};/)[0];
    const entry = /\['([\w.]+)', (\[[^\]]*\]|'\w+')/g;
    const types = {};
    let namespace = null;
    for (const line of block.split('\n')) {
        const head = line.match(/^ {4}([A-Za-z_]+): \[(.*)$/);
        const rest = head ? head[2] : line;
        if (head) {
            namespace = head[1];
            types[namespace] = [];
        }
        if (namespace) {
            for (const m of rest.matchAll(entry)) types[namespace].push([m[1], m[2]]);
        }
        // 1 行で閉じる名前空間 (`Flow: [['Interview', 'class']],`・`X: [],`) と、複数行の閉じ
        if ((head && /\],?$/.test(head[2])) || /^ {4}\],?$/.test(line)) namespace = null;
    }
    const version = source.match(/APEX_STANDARD_TYPES_REFERENCE_API_VERSION = (\d+)/);
    return { types, referenceApiVersion: version ? Number(version[1]) : null };
};

/** Apex Reference の目次 (dot leader のあるページ) の名前空間と型 */
const readApexToc = (knownNamespaces) => {
    const toc = pages.filter((page) => /\. \. \. \./.test(page)).join('\n');
    // 「X Namespace」「X Class」「X Global Interface」「X Enum」。名前空間の見出しに「Namespace」が付かないもの
    // (industriesNlpSvc) は、リポジトリの名前空間に同じ名前があるときだけ名前空間として扱う
    // 項目の始まりは、行の頭か、前の項目のページ番号のあと (複数語の見出しの最後の語を拾わない)
    const pattern =
        /(?<=^|\d )([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)(?: (?:Global )?(Namespace|Class|Interface|Enums?|Exceptions?))?(?: \.){3,} *\d+/gm;
    const official = {};
    const unclassified = [];
    let current = null;
    for (const m of toc.matchAll(pattern)) {
        const [, name, kind] = m;
        if (kind === 'Namespace' || (!kind && knownNamespaces.has(name.toLowerCase()))) {
            current = name;
            official[current] ??= [];
        } else if (!kind) {
            unclassified.push(name);
        } else if (current && /^(Class|Interface|Enum)$/.test(kind)) {
            official[current].push([name, kind.toLowerCase()]);
        }
    }
    return { official, unclassified };
};

const apex = () => {
    const { types, referenceApiVersion } = readStandardTypes();
    const ours = new Map(Object.keys(types).map((ns) => [ns.toLowerCase(), ns]));
    const { official, unclassified } = readApexToc(new Set(ours.keys()));
    const theirs = new Map(Object.keys(official).map((ns) => [ns.toLowerCase(), ns]));

    const addCandidates = [];
    const kindDifferences = [];
    const caseDifferences = [];
    for (const [namespace, list] of Object.entries(official)) {
        const ourNamespace = ours.get(namespace.toLowerCase());
        if (!ourNamespace) continue;
        const ourTypes = new Map(types[ourNamespace].map(([n, k]) => [n.toLowerCase(), [n, k]]));
        for (const [name, kind] of list) {
            const ourType = ourTypes.get(name.toLowerCase());
            if (!ourType) addCandidates.push({ name: `${ourNamespace}.${name}`, kind });
            else {
                if (ourType[0] !== name)
                    caseDifferences.push(`${ourNamespace}.${ourType[0]} / 目次 ${name}`);
                if (!ourType[1].includes(`'${kind}'`))
                    kindDifferences.push(
                        `${ourNamespace}.${name}: リポジトリ ${ourType[1]} / 目次 ${kind}`,
                    );
            }
        }
    }
    // 名前の各部分が本文に出てこない型 (資料から消えた・名前が変わった可能性)
    const notInText = [];
    let total = 0;
    for (const [namespace, list] of Object.entries(types)) {
        for (const [name] of list) {
            total++;
            if (!name.split('.').every((part) => words.has(part)))
                notInText.push(`${namespace}.${name}`);
        }
    }
    print({
        cover: coverOf(),
        repository: { referenceApiVersion, namespaces: ours.size, typeRows: total },
        toc: { namespaces: theirs.size, unclassifiedEntries: unclassified },
        namespaces: {
            addCandidates: [...theirs.values()].filter((ns) => !ours.has(ns.toLowerCase())),
            notInToc: [...ours.values()].filter((ns) => !theirs.has(ns.toLowerCase())),
            caseDifferences: [...theirs.values()].filter(
                (ns) => ours.has(ns.toLowerCase()) && ours.get(ns.toLowerCase()) !== ns,
            ),
        },
        types: { addCandidates, kindDifferences, caseDifferences, notInText },
    });
};

const objects = () => {
    const source = fs.readFileSync(STANDARD_OBJECTS, 'utf8');
    // 一覧の宣言だけ (STANDARD_OBJECTS_REFERENCE_API_VERSION も同じ名前で始まる)
    const list = source.match(/^const STANDARD_OBJECTS: [\s\S]*?\n\];/m)[0];
    const names = [...list.matchAll(/^ {4}\{ name: '(\w+)' \}/gm)].map((m) => m[1]);
    const lines = text.split('\n').map((line) => line.trim());
    const headings = new Set(lines);
    const version = source.match(/STANDARD_OBJECTS_REFERENCE_API_VERSION = (\d+)/);
    // カスタムのオブジェクトの接尾辞 (CUSTOM_OBJECT_SUFFIXES) と、資料の「Salesforce Object Types」の表の Suffix
    const suffixBlock = source.match(/const CUSTOM_OBJECT_SUFFIXES[\s\S]*?\n\];/)[0];
    const suffixes = [...suffixBlock.matchAll(/^ {4}'(\w+)'/gm)].map((m) => m[1]);
    const tableSuffixes = new Set();
    lines.forEach((line, i) => {
        if (!line.startsWith('Suffix __')) return;
        // 表は「Suffix __b __c ...」の行と、続く __ で始まる名前だけの行
        for (const row of [line.slice('Suffix '.length), lines[i + 1] ?? '']) {
            if (!/^__\w/.test(row)) continue;
            for (const token of row.split(/\s+/)) {
                if (token.startsWith('__')) tableSuffixes.add(token.slice(2));
            }
        }
    });
    // 項目の接尾辞 (オブジェクトの名前の判定には使わない)
    const FIELD_SUFFIXES = new Set(['latitude__s', 'longitude__s', 'pc', 'pr', 'r']);
    const objectSuffixes = [...tableSuffixes].filter((s) => !FIELD_SUFFIXES.has(s));
    const lower = (values) => values.map((v) => v.toLowerCase());
    print({
        cover: coverOf(),
        repository: {
            referenceApiVersion: version ? Number(version[1]) : null,
            objects: names.length,
            customObjectSuffixes: suffixes.length,
        },
        objectsWithoutHeading: names.filter((name) => !headings.has(name)),
        customObjectSuffixes: {
            // 表にあって一覧にない → 追加する (項目の接尾辞は除いてある)
            addCandidates: objectSuffixes.filter((s) => !lower(suffixes).includes(s.toLowerCase())),
            // 一覧にあって表にない → 消さずに本文で確かめる
            notInTable: suffixes.filter((s) => !lower(objectSuffixes).includes(s.toLowerCase())),
            // 表が見つからなかった (資料の形が変わった) ときは空になる
            tableFound: tableSuffixes.size > 0,
        },
    });
};

const metadata = () => {
    const source = fs.readFileSync(METADATA_TYPES, 'utf8');
    const block = source.match(/const METADATA_TYPE_NAMES[\s\S]*?\n};/)[0];
    const names = [...new Set([...block.matchAll(/: '(\w+)'/g)].map((m) => m[1]))];
    const headings = new Set(text.split('\n').map((line) => line.trim()));
    const version = source.match(/METADATA_TYPES_REFERENCE_API_VERSION = (\d+)/);
    const defaultApiVersion = fs.readFileSync(GRAPH, 'utf8').match(/apiVersion = '(\d+\.\d+)'/);
    print({
        cover: coverOf(),
        repository: {
            referenceApiVersion: version ? Number(version[1]) : null,
            packageXmlTypeNames: names.length,
            packageXmlDefaultApiVersion: defaultApiVersion ? defaultApiVersion[1] : null,
        },
        // 見出しにない名前 (複数形の種類名 MatchingRules のように、本文にだけ出てくるものがある)
        typeNamesWithoutHeading: names
            .filter((name) => !headings.has(name))
            .map((name) => ({ name, mentionedInText: words.has(name) })),
    });
};

/** standardTargets.ts の一覧 (LwcStandardName の並び) */
const readLwcNames = (source, name) => {
    const block = source.match(new RegExp(`const ${name}: [\\s\\S]*?\\n\\];`))[0];
    return [...block.matchAll(/\{ name: '(\w+)', verified: (true|false) \}/g)].map((m) => ({
        name: m[1],
        verified: m[2] === 'true',
    }));
};

/**
 * LWC (Metadata API Developer Guide の LightningComponentBundle と FlexiPageType で照合できるもの)。
 * target の一覧は LWC の開発者ガイドにしかないので、資料に名前が出てくるかだけを見る
 */
const lwc = () => {
    const source = fs.readFileSync(LWC_TARGETS, 'utf8');
    const capabilities = readLwcNames(source, 'LWC_CAPABILITIES');
    const targets = readLwcNames(source, 'LWC_TARGETS');
    const pageTypes = [
        ...source.match(/const FLEXI_PAGE_TARGETS[\s\S]*?\n};/)[0].matchAll(/^ {4}(\w+): '/gm),
    ].map((m) => m[1]);
    // capability の「Valid values」(箇条書きの記号はテキストでは別の文字になる)
    const validValues = (text.match(
        /Specifies something that a component can do\. Valid values are:([^\n]*)/,
    ) ?? ['', ''])[1]
        .split(/\s+/)
        .filter((word) => /^\w+__\w+$/.test(word));
    const mentioned = (name) => words.has(name);
    const version = source.match(/LWC_STANDARD_TARGETS_REFERENCE_API_VERSION = (\d+)/);
    print({
        cover: coverOf(),
        repository: {
            referenceApiVersion: version ? Number(version[1]) : null,
            capabilities: capabilities.length,
            targets: targets.length,
        },
        capabilities: {
            // 資料の Valid values にあって一覧にない → 追加する
            addCandidates: validValues.filter((v) => !capabilities.some((c) => c.name === v)),
            // 一覧にあって資料の Valid values にない → 消さずに本文で確かめる
            notInValidValues: capabilities
                .map((c) => c.name)
                .filter((n) => !validValues.includes(n)),
        },
        targets: {
            // 照合済みなのに資料に出てこない → 本文で確かめる
            verifiedButNotMentioned: targets
                .filter((t) => t.verified && !mentioned(t.name))
                .map((t) => t.name),
            // 未照合だが資料に出てくる → 照合済み (verified: true) にできる
            unverifiedButMentioned: targets
                .filter((t) => !t.verified && mentioned(t.name))
                .map((t) => t.name),
            // 資料に出てくる target で、一覧にないもの
            mentionedNotListed: [
                ...new Set(text.match(/\blightning(?:Community|Snapin)?__[A-Z]\w+/g) ?? []),
            ]
                .filter((name) => !targets.some((t) => t.name === name))
                .filter((name) => !capabilities.some((c) => c.name === name))
                .sort(),
        },
        // Lightning ページの種類 (FlexiPageType) で、資料に出てこないもの
        pageTypesNotMentioned: pageTypes.filter((type) => !mentioned(type)),
    });
};

const commands = { cover: () => print(coverOf()), apex, objects, metadata, lwc };
if (!commands[command]) {
    console.error(`unknown command: ${command}`);
    process.exit(2);
}
commands[command]();
