import { StateMachineRoot } from "./context";
import { StateMachineGraphPanel } from "./graph";
import { StateMachineInspector } from "./inspector";
import { StateMachinePalette } from "./palette";
import "./StateMachineScreen.css";

/** 画面状態を共有するステートマシンの構成要素。 */
export const StateMachine = {
  Root: StateMachineRoot,
  Palette: StateMachinePalette,
  Graph: StateMachineGraphPanel,
  Inspector: StateMachineInspector,
} as const;
