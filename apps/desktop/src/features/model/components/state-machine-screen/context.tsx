import { createContext, useContext, type ReactNode } from "react";
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

const StateMachineContext = createContext<StateMachineContextValue | null>(null);

export function useStateMachineContext(): StateMachineContextValue {
  const context = useContext(StateMachineContext);
  if (context === null) {
    throw new Error("StateMachine の子コンポーネントは StateMachine.Root の内側で使用してください");
  }
  return context;
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
    <StateMachineContext.Provider value={{ view, value, onChange, onEditSource }}>
      <div className="state-machine-screen">{children}</div>
    </StateMachineContext.Provider>
  );
}
