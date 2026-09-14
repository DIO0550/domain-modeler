import type { Document, Sticky } from "@domain-modeler/canvas-core";
import { Comment } from "../comment";
import { Identifier } from "../identifier";
import { Option } from "../option";
import { WorkflowPort } from "../workflow-port";

/** 同一識別子の Policy と、変換可能な入力付箋。 */
export type PolicyWorkflow = Readonly<{
  name: string;
  stickies: readonly Sticky[];
}>;

/** Policy の Event トリガーと接続先 Command を生成する。 */
export const PolicyWorkflow = {
  names: (sticky: Sticky): readonly string[] => {
    if (sticky.type !== "policy") {
      return [];
    }
    return Identifier.unify([sticky.text]);
  },

  toDmodelText: (workflow: PolicyWorkflow, document: Document): string => {
    const policyIds = new Set(
      workflow.stickies
        .filter((sticky) =>
          PolicyWorkflow.names(sticky).includes(workflow.name),
        )
        .map((sticky) => sticky.id),
    );
    const events = document.connections
      .filter((connection) => policyIds.has(connection.to))
      .flatMap((connection) => {
        const event = workflow.stickies.find(
          (sticky) => sticky.id === connection.from && sticky.type === "event",
        );
        if (event === undefined) {
          return [];
        }
        const identifier = Identifier.create(event.text);
        if (Option.isNone(identifier)) {
          return [];
        }
        return [{ text: identifier.value, label: connection.label }];
      });
    const comments = document.connections
      .filter((connection) => policyIds.has(connection.from))
      .flatMap((connection) => {
        const command = document.stickies.find(
          (sticky) => sticky.id === connection.to && sticky.type === "command",
        );
        if (command === undefined) {
          return [];
        }
        return Comment.connectionLines({
          text: command.text,
          label: connection.label,
        });
      });
    const input = WorkflowPort.toDmodelText({
      direction: "input",
      operator: "AND",
      fallback: "TODOトリガーイベント",
      terms: events,
    });
    const declaration = `workflow ${workflow.name} =\n${input}\n  output: TODO結果イベント`;
    return [...comments, declaration].join("\n");
  },
} as const;
