import { createContext, useContext, type ReactNode } from "react";
import { Option, type Option as Optional } from "@/utils/Option";
import {
  useStateMachineView,
  type UseStateMachineViewResult,
} from "../../hooks/use-state-machine-view";

type StateMachineRootProps = Readonly<{
  value: string;
  onChange: (text: string) => void;
  onEditSource: () => void;
  children: ReactNode;
}>;

type StateMachineContextValue = Readonly<{
  view: UseStateMachineViewResult;
  value: string;
  onChange: (text: string) => void;
  onEditSource: () => void;
}>;

const StateMachineContext = createContext<Optional<StateMachineContextValue>>(Option.none());

export function useStateMachineContext(): Optional<StateMachineContextValue> {
  return useContext(StateMachineContext);
}

/**
 * `.dmodel` のステートマシンをパレット・グラフ・インスペクターで表示する。
 *
 * @param props 文書全文、変更通知、モデル定義画面への切替操作、配置する子要素。
 * @returns ステートマシン全体の編集画面。
 */
export function StateMachineRoot({ value, onChange, onEditSource, children }: StateMachineRootProps) {
  const view = useStateMachineView(value);
  return (
    <StateMachineContext.Provider value={Option.some({ view, value, onChange, onEditSource })}>
      <div className="state-machine-screen">{children}</div>
    </StateMachineContext.Provider>
  );
}
