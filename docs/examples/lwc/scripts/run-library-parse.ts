/**
 * LWC のサンプルのバンドル (repository/before の lwc) を、各ライブラリでそのまま parse して結果を出す (docs/lwc-implementation.md)。
 * IR / JSON に変換する前の、ライブラリが返す形を確かめるためのもの。属性の説明は docs/lwc-implementation.md。
 *
 * | ファイル     | 構文 (①)                 | LWC の検証 (②)                                     |
 * | ------------ | ------------------------ | -------------------------------------------------- |
 * | .ts / .js    | @babel/parser            | @lwc/compiler transformSync (.ts は型を空白にして) |
 * | .html        | parse5 parseFragment     | @lwc/template-compiler parse                       |
 * | .css         | postcss parse            | @lwc/style-compiler transform                      |
 * | .js-meta.xml | parseXml (types/commons) | -                                                  |
 *
 * 出力: output/library/<バンドル>/<ファイル>.<ライブラリ>.json と、
 *       ライブラリ・ノードの種類ごとの属性の一覧 output/library/attributes.md (自動生成)
 *
 * 実行: npx ttsx --noCheck docs/examples/lwc/scripts/run-library-parse.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse as babelParse } from '@babel/parser';
import * as lwc from '@lwc/compiler';
import * as templateCompiler from '@lwc/template-compiler';
import * as styleCompiler from '@lwc/style-compiler';
import { parseFragment } from 'parse5';
import postcss from 'postcss';
import { parseXml } from '../../../../src/analyzer/types/commons/xml';
import { sourceOf } from '../../paths';
import {
    BABEL_TS_OPTIONS,
    eraseTypes,
} from '../../../../src/analyzer/parser/Lwc/validate/eraseTypes';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = sourceOf('before', 'lwc');
const OUT = path.resolve(here, '../output/library');
/** --raw のときだけ、ライブラリが返した木をそのまま <バンドル>/<ファイル>.<ライブラリ>.json に出す (大きいのでコミットしない) */
const RAW = process.argv.includes('--raw');

// ---------------------------------------------------------------------------
// 出力
// ---------------------------------------------------------------------------

/**
 * JSON にできる形にする。親への参照 (parse5 の parentNode、template-compiler の parent) は除く。
 * template-compiler は location を複数のノードで共有するので、祖先にあるときだけ循環とみなす
 */
const toJson = (value: unknown, ancestors = new Set<object>()): unknown => {
    if (value instanceof Map) value = Object.fromEntries(value);
    if (value instanceof Set) value = [...value];
    if (typeof value !== 'object' || value === null) return value;
    if (ancestors.has(value)) return '[Circular]';
    ancestors.add(value);
    const result = Array.isArray(value)
        ? value.map((item) => toJson(item, ancestors))
        : Object.fromEntries(
              Object.entries(value)
                  .filter(([key, v]) => key !== 'parentNode' && key !== 'parent' && v !== undefined)
                  .map(([key, v]) => [key, toJson(v, ancestors)]),
          );
    ancestors.delete(value);
    return result;
};

/** エラーのメッセージから、色の制御文字と絶対パスを除く */
const cleanMessage = (message: unknown) =>
    typeof message !== 'string'
        ? message
        : message.replace(/\u001b\[[0-9;]*m/g, '').replaceAll(process.cwd() + path.sep, '');

const write = (bundle: string, file: string, library: string, value: unknown) => {
    if (!RAW) return;
    const dir = path.join(OUT, bundle);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
        path.join(dir, `${file}.${library}.json`),
        JSON.stringify(value, null, 2) + '\n',
    );
};

// ---------------------------------------------------------------------------
// 属性の収集 (ライブラリ・ノードの種類ごとに、キー・値の型・例)
// ---------------------------------------------------------------------------

type KeyInfo = { types: Set<string>; example?: string; count: number };
type NodeInfo = { count: number; keys: Map<string, KeyInfo> };
const catalog = new Map<string, Map<string, NodeInfo>>();

type KindOf = (v: Record<string, unknown>) => string | undefined;

const typeOf = (v: unknown, kindOf: KindOf): string => {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (typeof v === 'object') {
        const kind = kindOf(v as Record<string, unknown>);
        return kind ? `node(${kind})` : 'object';
    }
    return typeof v;
};

/** kindOf はノードの種類を返す (Babel / postcss / template-compiler は type、parse5 は nodeName、XML は name) */
const collect = (library: string, value: unknown, kindOf: KindOf) => {
    const nodes = catalog.get(library) ?? new Map<string, NodeInfo>();
    catalog.set(library, nodes);
    /** keyPath は直近のノードからのキーの道筋 */
    const visit = (v: unknown, keyPath: string) => {
        if (Array.isArray(v)) return v.forEach((item) => visit(item, keyPath));
        if (typeof v !== 'object' || v === null) return;
        const record = v as Record<string, unknown>;
        const kind = kindOf(record);
        // ノードでないオブジェクト (loc など) は、ノードの種類によらず道筋でまとめる
        const name = kind ?? `(${keyPath})`;
        const info = nodes.get(name) ?? { count: 0, keys: new Map<string, KeyInfo>() };
        nodes.set(name, info);
        info.count++;
        // キーが属性名のオブジェクト (parse5 の sourceCodeLocation.attrs / startTag.attrs) は、キーを * にまとめる
        const isMap = !kind && /^sourceCodeLocation(\.startTag)?\.attrs$/.test(keyPath);
        for (const [key0, child] of Object.entries(record)) {
            const key = isMap ? '*' : key0;
            const keyInfo = info.keys.get(key) ?? { types: new Set<string>(), count: 0 };
            info.keys.set(key, keyInfo);
            keyInfo.count++;
            keyInfo.types.add(typeOf(child, kindOf));
            if (keyInfo.example === undefined && typeof child !== 'object')
                keyInfo.example = JSON.stringify(child);
            visit(child, kind ? key : `${keyPath}.${key}`);
        }
    };
    visit(value, 'root');
};

const writeCatalog = () => {
    const lines = [
        '# LWC のライブラリの parse 結果の属性 (自動生成)',
        '',
        '`run-library-parse.ts` が bundles/ のサンプルから集めたもの。ノードの種類ごとに、出てきたキー・値の型・例 (最初に出た値) を並べる。',
        '`件数` はそのキーを持っていたノードの数 (ノードの数より少なければ、ないこともあるキー)。説明は [docs/lwc-implementation.md](../../../../lwc-implementation.md)。',
        '',
    ];
    for (const [library, nodes] of catalog) {
        lines.push(`## ${library}`, '');
        for (const [name, info] of [...nodes].sort(([a], [b]) => a.localeCompare(b))) {
            lines.push(
                `### ${name} (${info.count})`,
                '',
                '| キー | 値の型 | 件数 | 例 |',
                '| --- | --- | --- | --- |',
            );
            for (const [key, k] of info.keys) {
                const example = (k.example ?? '')
                    .replace(/\|/g, '\\|')
                    .replace(/\n/g, '\\n')
                    .slice(0, 60);
                lines.push(
                    `| \`${key}\` | ${[...k.types].join(' / ')} | ${k.count} | ${example ? `\`${example}\`` : ''} |`,
                );
            }
            lines.push('');
        }
    }
    fs.writeFileSync(path.join(OUT, 'attributes.md'), lines.join('\n'));
};

// ---------------------------------------------------------------------------
// ファイルごとの parse
// ---------------------------------------------------------------------------

const byType = (v: Record<string, unknown>) => (typeof v.type === 'string' ? v.type : undefined);
const summary: string[] = [];

const parseScript = (bundle: string, file: string, source: string) => {
    const isTs = file.endsWith('.ts');
    const ast = babelParse(source, {
        ...BABEL_TS_OPTIONS,
        plugins: isTs
            ? ([...BABEL_TS_OPTIONS.plugins] as never[])
            : [['decorators', { decoratorsBeforeExport: true }] as never],
        errorRecovery: true,
        attachComment: false,
    });
    // tokens は件数が多いので別ファイルにする
    const { tokens, ...rest } = ast as typeof ast & { tokens?: unknown[] };
    const json = toJson(rest);
    write(bundle, file, 'babel', json);
    write(bundle, file, 'babel-tokens', toJson(tokens));
    collect('@babel/parser', json, byType);

    const js = isTs ? eraseTypes(source) : { code: source, unsupported: [] };
    let diagnostics: unknown;
    try {
        const result = lwc.transformSync(js.code, file.replace(/\.ts$/, '.js'), {
            namespace: 'c',
            name: bundle,
        });
        diagnostics = { warnings: result.warnings ?? [], code: result.code };
    } catch (error) {
        const e = error as Record<string, unknown>;
        diagnostics = {
            error: {
                message: cleanMessage(e.message),
                code: e.code,
                filename: e.filename,
                location: e.location,
            },
        };
    }
    write(bundle, file, 'lwc-compiler', diagnostics);
    collect('@lwc/compiler', diagnostics, () => undefined);
    summary.push(
        `${bundle}/${file}: babel errors ${ast.errors?.length ?? 0}, tokens ${tokens?.length ?? 0}, ` +
            `lwc ${'error' in (diagnostics as object) ? 'error' : 'ok'}, unsupported ${js.unsupported.length}`,
    );
};

const parseTemplate = (bundle: string, file: string, source: string) => {
    const fragment = toJson(parseFragment(source, { sourceCodeLocationInfo: true }));
    write(bundle, file, 'parse5', fragment);
    // 要素はタグ名によらず同じ形なので 1 つにまとめる (#text などと template は分ける)
    collect('parse5', fragment, (v) =>
        typeof v.nodeName !== 'string'
            ? undefined
            : /^#|^template$/.test(v.nodeName)
              ? v.nodeName
              : '<要素>',
    );

    const { root, warnings } = templateCompiler.parse(source, { name: bundle, namespace: 'c' });
    const ir = toJson({ root, warnings });
    write(bundle, file, 'template-compiler', ir);
    collect('@lwc/template-compiler', ir, byType);
    summary.push(`${bundle}/${file}: template-compiler warnings ${warnings.length}`);
};

const parseStyle = (bundle: string, file: string, source: string) => {
    const root = postcss.parse(source, { from: file }).toJSON() as { inputs?: { file?: string }[] };
    // inputs.file は from を絶対パスにしたもの。ファイル名に戻す
    for (const input of root.inputs ?? []) input.file = file;
    write(bundle, file, 'postcss', root);
    collect('postcss', root, byType);

    let result: unknown;
    try {
        result = { code: styleCompiler.transform(source, file, {}).code };
    } catch (error) {
        const e = error as Record<string, unknown>;
        result = {
            error: {
                message: cleanMessage(e.message),
                code: e.code,
                line: e.line,
                column: e.column,
                reason: e.reason,
            },
        };
    }
    write(bundle, file, 'style-compiler', result);
    summary.push(
        `${bundle}/${file}: style-compiler ${'error' in (result as object) ? 'error' : 'ok'}`,
    );
};

const parseMeta = (bundle: string, file: string, source: string) => {
    const root = parseXml(source);
    write(bundle, file, 'xml', root);
    collect('parseXml', root, (v) =>
        typeof v.name === 'string' && 'children' in v ? v.name : undefined,
    );
    summary.push(`${bundle}/${file}: xml <${root.name}> children ${root.children.length}`);
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const bundle of fs.readdirSync(ROOT).sort()) {
    for (const file of fs.readdirSync(path.join(ROOT, bundle)).sort()) {
        const source = fs
            .readFileSync(path.join(ROOT, bundle, file), 'utf8')
            .replace(/\r\n?/g, '\n');
        if (file.endsWith('.js-meta.xml')) parseMeta(bundle, file, source);
        else if (/\.(ts|js)$/.test(file)) parseScript(bundle, file, source);
        else if (file.endsWith('.html')) parseTemplate(bundle, file, source);
        else if (file.endsWith('.css')) parseStyle(bundle, file, source);
    }
}
writeCatalog();
console.log(summary.join('\n'));
