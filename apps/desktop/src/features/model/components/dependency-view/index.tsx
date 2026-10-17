import { DependencyRoot } from "./context";
import { DependencyGraph } from "./graph";
import { DependencyInspector } from "./inspector";
import { DependencyDiagnostics } from "./diagnostics";
import { DependencyLegend } from "./legend";
import { DependencyToolbar } from "./toolbar";
import "./DependencyView.css";

/** 同じ図の状態を読む、モデル依存図の構成要素。 */
export const DependencyView = {
  Root: DependencyRoot,
  Graph: DependencyGraph,
  Toolbar: DependencyToolbar,
  Inspector: DependencyInspector,
  Diagnostics: DependencyDiagnostics,
  Legend: DependencyLegend,
} as const;
