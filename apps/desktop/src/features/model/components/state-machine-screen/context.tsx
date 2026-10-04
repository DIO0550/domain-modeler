import { createContext, useContext, type ReactNode } from "react";
import { EventTargetEx } from "@/utils/EventTargetEx";
import { Option, type Option as Optional } from "@/utils/Option";
import type { SourceRange } from "@domain-modeler/model-core";
import {
  useStateMachineView,
  type UseStateMachineViewResult,
} from "../../hooks/use-state-machine-view";

type StateMachineRootProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  onEditSource: (range?: SourceRange) => void;
  initialMachineIndex?: number;
  onMachineSelected?: (index: number) => void;
  children: ReactNode;
}>;

type StateMachineContextValue = Readonly<{
  view: UseStateMachineViewResult;
  value: string;
  onChange: (text: string) => void;
  onEditSource: (range?: SourceRange) => void;
}>;

const StateMachineContext = createContext<Optional<StateMachineContextValue>>(Option.none());

export function useStateMachineContext(): Optional<StateMachineContextValue> {
  return useContext(StateMachineContext);
}

/**
 * `.dmodel` のステートマシンをパレット・グラフ・インスペクターで表示する。
 *
 * @param props 文書全文、変更通知、モデル定義画面への切替操作、初期マシン位置、マシン選択通知、配置する子要素。
 * @returns ステートマシン全体の編集画面。
 */
export function StateMachineRoot({ value, onChange, onEditSource,
  initialMachineIndex, onMachineSelected, children }: StateMachineRootProps) {
  const view = useStateMachineView(value, initialMachineIndex, onMachineSelected);
  return (
    <StateMachineContext.Provider value={Option.some({ view, value, onChange, onEditSource })}>
      <div className="state-machine-screen" onKeyDown={(event) => {
        if (event.key !== "Escape" || event.nativeEvent.isComposing) {
          return;
        }
        if (EventTargetEx.isTextEntry(event.target)) {
          return;
        }
        view.clearSelection();
      }}>{children}</div>
    </StateMachineContext.Provider>
  );
}
