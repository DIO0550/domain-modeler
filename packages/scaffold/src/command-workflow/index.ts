import type { Document, Sticky } from "@domain-modeler/canvas-core";
import { Comment } from "../comment";
import { Identifier } from "../identifier";
import { Option } from "../option";
import { WorkflowPort } from "../workflow-port";

/** 同一識別子の Command と、変換可能な接続先の付箋。 */
export type CommandWorkflow = Readonly<{
  name: string;
  stickies: readonly Sticky[];
}>;

type WorkflowTarget = Readonly<{
  kind: "event" | "comment";
  text: string;
  label: string;
}>;

/** Command から workflow 宣言を生成する。 */
export const CommandWorkflow = {
  /** workflow と同じ名前空間で衝突しない input data 名を返す。 */
  inputName: (name: string): string => `${name}コマンド`,

  /** Command の変換可能な workflow 名を返す。 */
  names: (sticky: Sticky): readonly string[] => {
    if (sticky.type !== "command") {
      return [];
    }
    return Identifier.unify([sticky.text]);
  },

  /** 付箋順で workflow 名を統合する。 */
  namesIn: (stickies: readonly Sticky[]): readonly string[] => [
    ...new Set(stickies.flatMap(CommandWorkflow.names)),
  ],

  /** Event への出力と、変換しない接続のコメントを持つ宣言を返す。 */
  toDmodelText: (workflow: CommandWorkflow, document: Document): string => {
    const sourceIds = new Set(
      workflow.stickies
        .filter((sticky) =>
          CommandWorkflow.names(sticky).includes(workflow.name),
        )
        .map((sticky) => sticky.id),
    );
    const outgoing = document.connections.filter((connection) =>
      sourceIds.has(connection.from),
    );
    const targets = outgoing.flatMap(
      (connection): readonly WorkflowTarget[] => {
        const sticky = document.stickies.find(
          (candidate) => candidate.id === connection.to,
        );
        if (sticky === undefined) {
          return [];
        }
        const identifier = Identifier.create(sticky.text);
        const accepted = workflow.stickies.some(
          (candidate) => candidate.id === sticky.id,
        );
        if (sticky.type === "event" && accepted && Option.isSome(identifier)) {
          return [
            {
              kind: "event",
              text: identifier.value,
              label: connection.label,
            },
          ];
        }
        return [
          {
            kind: "comment",
            text: sticky.text,
            label: connection.label,
          },
        ];
      },
    );
    const comments = targets
      .filter((target) => target.kind === "comment")
      .flatMap(Comment.connectionLines);
    const events = targets.filter((target) => target.kind === "event");
    const output = CommandWorkflow.outputText(events);
    const declaration = `workflow ${workflow.name} =\n  input: ${CommandWorkflow.inputName(workflow.name)}\n${output}`;
    return [...comments, declaration].join("\n");
  },

  /** ラベルがある場合は各項を継続行にし、ラベル全文をコメントで残す。 */
  outputText: (
    events: readonly Readonly<{ text: string; label: string }>[],
  ): string => {
    return WorkflowPort.toDmodelText({
      direction: "output",
      operator: "OR",
      fallback: "TODO結果イベント",
      terms: events,
    });
  },
} as const;
