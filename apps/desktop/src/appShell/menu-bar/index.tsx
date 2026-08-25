import { useEffect, useRef, useState, type RefObject } from "react";
import type { MenuCommandId, MenuState } from "../menu";

type MenuBarProps = Readonly<{
  menuState: MenuState;
  onCommand: (commandId: MenuCommandId) => void;
}>;

type MenuGroupId = "file" | "edit" | "generate";

type MenuBarOpenState =
  | Readonly<{ status: "closed" }>
  | Readonly<{ status: "open"; menuId: MenuGroupId }>;

type MenuItemDefinition = Readonly<{
  commandId: MenuCommandId;
  label: string;
}>;

type MenuGroupDefinition = Readonly<{
  id: MenuGroupId;
  label: string;
  items: readonly MenuItemDefinition[];
}>;

const MENU_GROUPS: readonly MenuGroupDefinition[] = [
  {
    id: "file",
    label: "ファイル",
    items: [
      { commandId: "newCanvas", label: "新規キャンバス" },
      { commandId: "newModel", label: "新規ドメインモデル" },
      { commandId: "open", label: "開く" },
      { commandId: "closeTab", label: "タブを閉じる" },
    ],
  },
  {
    id: "edit",
    label: "編集",
    items: [
      { commandId: "undo", label: "元に戻す" },
      { commandId: "redo", label: "やり直す" },
    ],
  },
  {
    id: "generate",
    label: "生成",
    items: [
      {
        commandId: "generateFromCanvas",
        label: "キャンバスからドメインモデルを生成",
      },
    ],
  },
];

/**
 * アプリケーションメニュー。アクティブ文書種別に応じてコマンドの有効状態が変わる。
 *
 * @param props メニュー状態とコマンド実行ハンドラ。
 * @returns メニューバー。
 */
export function MenuBar({ menuState, onCommand }: MenuBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [openState, setOpenState] = useState<MenuBarOpenState>({
    status: "closed",
  });
  const close = (): void => {
    setOpenState({ status: "closed" });
  };

  useMenuBarDismiss(openState.status === "open", rootRef, close);

  const handleToggle = (menuId: MenuGroupId): void => {
    if (openState.status === "open" && openState.menuId === menuId) {
      setOpenState({ status: "closed" });
      return;
    }
    setOpenState({ status: "open", menuId });
  };

  const handleCommand = (commandId: MenuCommandId): void => {
    if (menuState[commandId] === "disabled") {
      return;
    }
    onCommand(commandId);
    close();
  };

  return (
    <div
      ref={rootRef}
      className="menu-bar"
      role="menubar"
      aria-label="アプリケーションメニュー"
    >
      {MENU_GROUPS.map((group) => (
        <MenuGroup
          key={group.id}
          definition={group}
          menuState={menuState}
          isOpen={isGroupOpen(openState, group.id)}
          onToggle={handleToggle}
          onCommand={handleCommand}
        />
      ))}
    </div>
  );
}

type MenuGroupProps = Readonly<{
  definition: MenuGroupDefinition;
  menuState: MenuState;
  isOpen: boolean;
  onToggle: (menuId: MenuGroupId) => void;
  onCommand: (commandId: MenuCommandId) => void;
}>;

/**
 * 1つのメニューとその項目一覧。
 *
 * @param props メニュー定義、開閉、コマンド実行。
 * @returns メニューグループ。
 */
function MenuGroup({
  definition,
  menuState,
  isOpen,
  onToggle,
  onCommand,
}: MenuGroupProps) {
  return (
    <div className="menu-bar__group">
      <button
        type="button"
        className={menuButtonClassName(isOpen)}
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => {
          onToggle(definition.id);
        }}
      >
        {definition.label}
      </button>
      <MenuItemList
        definition={definition}
        menuState={menuState}
        isOpen={isOpen}
        onCommand={onCommand}
      />
    </div>
  );
}

type MenuItemListProps = Readonly<{
  definition: MenuGroupDefinition;
  menuState: MenuState;
  isOpen: boolean;
  onCommand: (commandId: MenuCommandId) => void;
}>;

/**
 * 開いているメニューの項目一覧。閉じているときは出さない。
 *
 * @param props メニュー定義とコマンド実行。
 * @returns メニュー項目、または null。
 */
function MenuItemList({
  definition,
  menuState,
  isOpen,
  onCommand,
}: MenuItemListProps) {
  if (!isOpen) {
    return null;
  }
  return (
    <div className="menu-bar__menu" role="menu" aria-label={definition.label}>
      {definition.items.map((item) => (
        <MenuCommandItem
          key={item.commandId}
          commandId={item.commandId}
          label={item.label}
          availability={menuState[item.commandId]}
          onCommand={onCommand}
        />
      ))}
    </div>
  );
}

type MenuCommandItemProps = Readonly<{
  commandId: MenuCommandId;
  label: string;
  availability: MenuState[MenuCommandId];
  onCommand: (commandId: MenuCommandId) => void;
}>;

/**
 * 1つのメニューコマンド。無効なときは実行しない。
 *
 * @param props コマンド、表示名、有効状態、実行ハンドラ。
 * @returns メニュー項目ボタン。
 */
function MenuCommandItem({
  commandId,
  label,
  availability,
  onCommand,
}: MenuCommandItemProps) {
  const isDisabled = availability === "disabled";
  return (
    <button
      type="button"
      className={menuItemClassName(availability)}
      role="menuitem"
      aria-disabled={isDisabled}
      onClick={() => {
        onCommand(commandId);
      }}
    >
      {label}
    </button>
  );
}

/**
 * メニュー外クリックと Escape で開いているメニューを閉じる。
 *
 * @param isOpen メニューが開いているか。
 * @param rootRef メニューバーのルート要素。
 * @param onClose 閉じる操作。
 */
const useMenuBarDismiss = (
  isOpen: boolean,
  rootRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
): void => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handlePointerDown = (event: PointerEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (rootRef.current?.contains(target) === true) {
        return;
      }
      onClose();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen, onClose, rootRef]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);
};

/**
 * 指定メニューが開いているか判定する。
 *
 * @param openState メニューバーの開閉状態。
 * @param menuId 判定するメニュー。
 * @returns そのメニューが開いているとき true。
 */
const isGroupOpen = (
  openState: MenuBarOpenState,
  menuId: MenuGroupId,
): boolean => openState.status === "open" && openState.menuId === menuId;

/**
 * メニュー開閉ボタンの class を組み立てる。
 *
 * @param isOpen このメニューが開いているか。
 * @returns menu-bar__menu-button と開閉修飾。
 */
const menuButtonClassName = (isOpen: boolean): string => {
  const openClass = isOpen ? ["menu-bar__menu-button--open"] : [];
  const classNames = ["menu-bar__menu-button", ...openClass];
  return classNames.join(" ");
};

/**
 * メニュー項目の class を組み立てる。
 *
 * @param availability 有効または無効。
 * @returns menu-bar__item と無効修飾。
 */
const menuItemClassName = (availability: MenuState[MenuCommandId]): string => {
  const disabledClass =
    availability === "disabled" ? ["menu-bar__item--disabled"] : [];
  const classNames = ["menu-bar__item", ...disabledClass];
  return classNames.join(" ");
};
