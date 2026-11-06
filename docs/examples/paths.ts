/**
 * サンプルのリポジトリ (docs/examples/repository) の場所。サンプルのスクリプトとテストはここから引く。
 *
 * repository/{before,after} は Salesforce DX のプロジェクトの形 (sfdx-project.json、force-app/main/default/<種類>/、
 * scripts/apex/*.apex) で、before → after が「変更前 → 変更後」。Apex の構文のサンプル (Parser*.cls など) は両方にある
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const SIDES = ['before', 'after'] as const;
export type Side = (typeof SIDES)[number];

/** サンプルのリポジトリのルート */
export const REPOSITORY = path.join(here, 'repository');

/** before / after のリポジトリ (sfdx-project.json のあるフォルダ) */
export const repositoryOf = (side: Side): string => path.join(REPOSITORY, side);

/** force-app/main/default の下 (sourceOf('after', 'lwc') など) */
export const sourceOf = (side: Side, ...parts: string[]): string =>
    path.join(REPOSITORY, side, 'force-app', 'main', 'default', ...parts);

/** Apex のファイル名から、リポジトリの中の場所 (classes/・triggers/・scripts/apex/) */
export const apexSampleOf = (side: Side, fileName: string): string => {
    if (/\.cls(-meta\.xml)?$/.test(fileName)) return sourceOf(side, 'classes', fileName);
    if (/\.trigger(-meta\.xml)?$/.test(fileName)) return sourceOf(side, 'triggers', fileName);
    return path.join(repositoryOf(side), 'scripts', 'apex', fileName);
};
