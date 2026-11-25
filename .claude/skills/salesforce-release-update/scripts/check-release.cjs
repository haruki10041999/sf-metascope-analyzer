#!/usr/bin/env node
// Salesforce の公式 PDF (pdftotext でテキストにしたもの) と、リポジトリの一覧を照合する。
// 依存のない Node のスクリプト。リポジトリの根で実行する。結果は JSON で標準出力に出す。
//
//   node check-release.cjs cover    <pdfのテキスト>           表紙の版 (Version・リリース・更新日)
//   node check-release.cjs apex     <Apex Reference のテキスト>
//   node check-release.cjs objects  <Object Reference のテキスト>
//   node check-release.cjs metadata <Metadata API のテキスト>
//
// 照合の決まり (SKILL.md の「照合の決まり」):
// - 公式資料にあってリポジトリにないものは「追加の候補」、リポジトリにあって資料にないものは「要確認」として出す。
//   どちらも自動では消さない (資料の抽出漏れ・別の資料にしか載らない型がある)
'use strict';
const fs = require('fs');

const STANDARD_TYPES = 'src/analyzer/processor/Apex/semantic/standardTypes.ts';
const STANDARD_OBJECTS = 'src/analyzer/processor/Apex/semantic/standardObjects.ts';
const GRAPH = 'src/analyzer/processor/dependency/graph.ts';

const [command, textFile] = process.argv.slice(2);
if (!command || !textFile) {
    console.error('usage: node check-release.cjs <cover|apex|objects|metadata> <text file>');
    process.exit(2);
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
    const list = source.match(/const STANDARD_OBJECTS[\s\S]*?\n\];/)[0];
    const names = [...list.matchAll(/^ {4}\{ name: '(\w+)' \}/gm)].map((m) => m[1]);
    const lines = text.split('\n').map((line) => line.trim());
    const headings = new Set(lines);
    const version = source.match(/APEX_STANDARD_OBJECTS_REFERENCE_API_VERSION = (\d+)/);
    print({
        cover: coverOf(),
        repository: {
            referenceApiVersion: version ? Number(version[1]) : null,
            objects: names.length,
        },
        objectsWithoutHeading: names.filter((name) => !headings.has(name)),
    });
};

const metadata = () => {
    const source = fs.readFileSync(GRAPH, 'utf8');
    const block = source.match(/const METADATA_TYPE_NAMES[\s\S]*?\n};/)[0];
    const names = [...new Set([...block.matchAll(/: '(\w+)'/g)].map((m) => m[1]))];
    const headings = new Set(text.split('\n').map((line) => line.trim()));
    const defaultApiVersion = source.match(/apiVersion = '(\d+\.\d+)'/);
    print({
        cover: coverOf(),
        repository: {
            packageXmlTypeNames: names.length,
            packageXmlDefaultApiVersion: defaultApiVersion ? defaultApiVersion[1] : null,
        },
        // 見出しにない名前 (複数形の種類名 MatchingRules のように、本文にだけ出てくるものがある)
        typeNamesWithoutHeading: names
            .filter((name) => !headings.has(name))
            .map((name) => ({ name, mentionedInText: words.has(name) })),
    });
};

const commands = { cover: () => print(coverOf()), apex, objects, metadata };
if (!commands[command]) {
    console.error(`unknown command: ${command}`);
    process.exit(2);
}
commands[command]();
