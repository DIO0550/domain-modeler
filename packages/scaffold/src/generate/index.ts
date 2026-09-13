import type { Document, Sticky } from "@domain-modeler/canvas-core";
import { Result, Stub } from "@domain-modeler/model-core";
import { Identifier } from "../identifier";
import { Option } from "../option";

/** Command の input 用 data に付ける接尾辞。 */
const COMMAND_INPUT_SUFFIX = "コマンド";

/** 生成ファイル先頭の説明コメント。 */
const FILE_INTRO =
  "このファイルは叩き台です。TODO と未定義の警告を埋めて育ててください";

/** data 群の見出し。 */
const DATA_SECTION_HEADER = "// ---- data ----";

/** workflow 群の見出し。 */
const WORKFLOW_SECTION_HEADER = "// ---- workflow ----";

/** 未変換群の見出し。 */
const UNCONVERTED_SECTION_HEADER = "// ---- 未変換 ----";

/** Hotspot コメントの接頭辞。 */
const HOTSPOT_COMMENT_PREFIX = "// TODO(hotspot): ";

/** この変換が扱わない付箋。Policy は workflow 変換の対象。 */
const OMITTED = { kind: "omitted" } as const;

/** data 名の由来。identifier は付箋テキストの識別子そのもの。 */
const STUB_NAME_SOURCES = {
  identifier: "identifier",
  commandInput: "commandInput",
} as const;

/** data 名の由来。 */
type StubNameSource =
  (typeof STUB_NAME_SOURCES)[keyof typeof STUB_NAME_SOURCES];

/** data スタブ行。 */
type StubLine = Readonly<{
  kind: "stub";
  identifier: string;
  nameSource: StubNameSource;
  line: string;
  sticky: Sticky;
}>;

/** Hotspot コメント行。 */
type HotspotLine = Readonly<{
  kind: "hotspot";
  lines: readonly string[];
}>;

/** 未変換コメント行。 */
type UnconvertedLine = Readonly<{
  kind: "unconverted";
  lines: readonly string[];
}>;

/** 付箋1枚の分類結果。 */
type ClassifiedSticky =
  | StubLine
  | HotspotLine
  | UnconvertedLine
  | typeof OMITTED;

/** 出力済み data スタブの識別子と由来。 */
type EmittedStub = Readonly<{
  identifier: string;
  nameSource: StubNameSource;
}>;

/** 出力欄の蓄積。 */
type Sections = Readonly<{
  dataLines: readonly string[];
  unconvertedLines: readonly string[];
  emittedStubs: readonly EmittedStub[];
}>;

/** data 名の決め方。 */
type DataNameRule = Readonly<{
  nameSource: StubNameSource;
  dataNameFromIdentifier: (identifier: string) => string;
}>;

/**
 * テキストの各物理行をコメントにする。2行目以降は `// ` で始める。
 * @param prefix 先頭行に付ける接頭辞。
 * @param text コメントにするテキスト。
 * @returns コメント行。
 */
const commentLines = (prefix: string, text: string): readonly string[] => {
  const physicalLines = text.split(/\r?\n/u);
  const [first = "", ...rest] = physicalLines;
  const firstCommented = `${prefix}${first}`;
  const restCommented = rest.map((line) => `// ${line}`);
  return [firstCommented, ...restCommented];
};

/**
 * 識別子をそのまま data 名にする。
 * @param identifier 識別子。
 * @returns data 名。
 */
const asDataName = (identifier: string): string => identifier;

/**
 * Command の input 用 data 名にする。
 * @param identifier workflow 名になる識別子。
 * @returns `<識別子>コマンド`。
 */
const asCommandInputName = (identifier: string): string =>
  `${identifier}${COMMAND_INPUT_SUFFIX}`;

/** Event / Aggregate / Read Model の data 名規則。 */
const IDENTIFIER_DATA_NAME = {
  nameSource: STUB_NAME_SOURCES.identifier,
  dataNameFromIdentifier: asDataName,
} as const satisfies DataNameRule;

/** Command input の data 名規則。 */
const COMMAND_INPUT_DATA_NAME = {
  nameSource: STUB_NAME_SOURCES.commandInput,
  dataNameFromIdentifier: asCommandInputName,
} as const satisfies DataNameRule;

/**
 * 未変換として分類する。
 * @param sticky 未変換の付箋。
 * @returns 未変換の分類。
 */
const unconverted = (sticky: Sticky): UnconvertedLine => ({
  kind: "unconverted",
  lines: commentLines(`// ${sticky.type}: `, sticky.text),
});

/**
 * 識別子化して data スタブにする。できない場合は未変換。
 * @param sticky 変換する付箋。
 * @param dataNameRule data 名の決め方。
 * @returns スタブまたは未変換。
 */
const stubOrUnconverted = (
  sticky: Sticky,
  dataNameRule: DataNameRule,
): ClassifiedSticky => {
  const identifier = Identifier.create(sticky.text);
  if (Option.isNone(identifier)) {
    return unconverted(sticky);
  }
  const dataName = dataNameRule.dataNameFromIdentifier(identifier.value);
  const stub = Stub.generate(dataName);
  if (Result.isErr(stub)) {
    return unconverted(sticky);
  }
  return {
    kind: "stub",
    identifier: dataName,
    nameSource: dataNameRule.nameSource,
    line: stub.value,
    sticky,
  };
};

/**
 * 付箋1枚を data / hotspot / 未変換 / 対象外へ分類する。
 * @param sticky 分類する付箋。
 * @returns 分類結果。
 */
const classifySticky = (sticky: Sticky): ClassifiedSticky => {
  if (sticky.text.length === 0) {
    return unconverted(sticky);
  }
  switch (sticky.type) {
    case "event":
    case "aggregate":
    case "readModel":
      return stubOrUnconverted(sticky, IDENTIFIER_DATA_NAME);
    case "command":
      return stubOrUnconverted(sticky, COMMAND_INPUT_DATA_NAME);
    case "hotspot":
      return {
        kind: "hotspot",
        lines: commentLines(HOTSPOT_COMMENT_PREFIX, sticky.text),
      };
    case "actor":
    case "externalSystem":
      return unconverted(sticky);
    case "policy":
      return OMITTED;
  }
};

/**
 * 分類結果を出力欄へ足す。同じ由来の同一識別子は先出だけ残し、
 * Command 接尾辞など別由来の衝突は後着を未変換欄へ送る。
 * @param sections ここまでの出力欄。
 * @param classified 足す分類結果。
 * @returns 更新した出力欄。
 */
const appendClassified = (
  sections: Sections,
  classified: ClassifiedSticky,
): Sections => {
  switch (classified.kind) {
    case "omitted":
      return sections;
    case "unconverted": {
      const unconvertedLines = [
        ...sections.unconvertedLines,
        ...classified.lines,
      ];
      return {
        ...sections,
        unconvertedLines,
      };
    }
    case "hotspot": {
      const dataLines = [...sections.dataLines, ...classified.lines];
      return {
        ...sections,
        dataLines,
      };
    }
    case "stub": {
      const emitted = sections.emittedStubs.find(
        (stub) => stub.identifier === classified.identifier,
      );
      if (emitted === undefined) {
        const dataLines = [...sections.dataLines, classified.line];
        const emittedStubs = [
          ...sections.emittedStubs,
          {
            identifier: classified.identifier,
            nameSource: classified.nameSource,
          },
        ];
        return {
          dataLines,
          unconvertedLines: sections.unconvertedLines,
          emittedStubs,
        };
      }
      if (emitted.nameSource === classified.nameSource) {
        return sections;
      }
      const collision = unconverted(classified.sticky);
      const unconvertedLines = [
        ...sections.unconvertedLines,
        ...collision.lines,
      ];
      return {
        ...sections,
        unconvertedLines,
      };
    }
  }
};

/**
 * 見出しと本文を空行でつなぐ。本文が無ければ見出しだけ返す。
 * @param header 見出しコメント。
 * @param lines 本文行。
 * @returns セクション文字列。
 */
const sectionText = (header: string, lines: readonly string[]): string => {
  if (lines.length === 0) {
    return header;
  }
  const body = lines.join("\n");
  return `${header}\n\n${body}`;
};

/**
 * ヘッダと3つの欄を .dmodel テキストに組む。
 * @param title 元キャンバスのタイトル。
 * @param generatedOn 生成日。
 * @param sections 出力欄。
 * @returns .dmodel テキスト。
 */
const formatDmodel = (
  title: string,
  generatedOn: string,
  sections: Sections,
): string => {
  const titleComment = commentLines(
    "// ",
    `${title} から生成 (${generatedOn})`,
  ).join("\n");
  const header = `${titleComment}\n// ${FILE_INTRO}`;
  const dataSection = sectionText(DATA_SECTION_HEADER, sections.dataLines);
  const workflowSection = sectionText(WORKFLOW_SECTION_HEADER, []);
  const unconvertedSection = sectionText(
    UNCONVERTED_SECTION_HEADER,
    sections.unconvertedLines,
  );
  return `${header}\n\n${dataSection}\n\n${workflowSection}\n\n${unconvertedSection}\n`;
};

const EMPTY_SECTIONS: Sections = {
  dataLines: [],
  unconvertedLines: [],
  emittedStubs: [],
};

/** キャンバス文書から .dmodel 叩き台テキストを生成する関数群。 */
export const Generate = {
  /**
   * キャンバス文書から .dmodel 叩き台テキストを生成する。
   * Event / Aggregate / Read Model / Command input の data スタブと
   * Hotspot コメントを配列順で出し、Actor / External System / 空文字 /
   * 識別子化できない付箋は未変換欄に残す。
   * @param document 変換元のキャンバス文書。
   * @param generatedOn 生成日(呼び出し側が決めた日付文字列)。
   * @returns .dmodel テキスト。
   */
  toDmodelText: (document: Document, generatedOn: string): string => {
    const classifiedStickies = document.stickies.map(classifySticky);
    const sections = classifiedStickies.reduce(
      appendClassified,
      EMPTY_SECTIONS,
    );
    return formatDmodel(document.title, generatedOn, sections);
  },
} as const;
