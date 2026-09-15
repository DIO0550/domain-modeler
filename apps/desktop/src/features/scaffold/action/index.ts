import type { Document } from "@domain-modeler/canvas-core";
import { Generate } from "@domain-modeler/scaffold";
import { createDmodelFile } from "@/libs/file-create";
import type { FileWriteError } from "@/libs/file-write";
import type { Option } from "@/utils/Option";

type ScaffoldSource = Readonly<{
  activeDocument: Option<
    | Readonly<{ kind: "canvas"; document: Document }>
    | Readonly<{ kind: "model" }>
  >;
  generatedOn: string;
}>;

type ScaffoldOperations = Readonly<{
  confirm: (text: string) => Promise<"confirmed" | "cancelled">;
  selectSavePath: () => Promise<Option<string>>;
  openTab: (path: string, documentType: "model") => void;
}>;

type ScaffoldResult =
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{ status: "created"; path: string }>
  | Readonly<{ status: "writeFailed"; error: FileWriteError }>;

/** アクティブキャンバスの叩き台を確認して、新しいモデルファイルとして保存する。 */
export const ScaffoldAction = {
  /**
   * 実行開始時の文書から生成した全文を確認し、保存成功後だけモデルタブを開く。
   * @param source アクティブ文書のスナップショットと生成日。
   * @param operations 確認画面、保存ダイアログ、タブ追加の接続先。
   * @returns 作成先、キャンセル、対象外、または保存失敗。
   */
  async run(
    source: ScaffoldSource,
    operations: ScaffoldOperations,
  ): Promise<ScaffoldResult> {
    const active = source.activeDocument;
    if (!active.some || active.value.kind !== "canvas") {
      return { status: "unavailable" };
    }
    const text = Generate.toDmodelText(
      active.value.document,
      source.generatedOn,
    );
    if ((await operations.confirm(text)) === "cancelled") {
      return { status: "cancelled" };
    }
    const selection = await operations.selectSavePath();
    if (!selection.some) {
      return { status: "cancelled" };
    }
    const result = await createDmodelFile({
      path: selection.value,
      contents: text,
    });
    if (result.type === "err") {
      return { status: "writeFailed", error: result.error };
    }
    operations.openTab(selection.value, "model");
    return { status: "created", path: selection.value };
  },
} as const;
