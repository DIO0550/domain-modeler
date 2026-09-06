import { act } from "react";
import { expect, test } from "vitest";
import {
  Document,
  Sticky as StickyModel,
  StickyId,
  STICKY_TYPES,
} from "@domain-modeler/canvas-core";
import {
  articleOf,
  buttonNamed,
  clickSurface,
  documentWithConnection,
  documentWithTwoStickies,
  doubleClickSurface,
  editorOf,
  existingStickyDocument,
  renderEditor,
} from "./canvasEditor.test-support";

const canvasSurfaceOf = (host: HTMLDivElement): HTMLElement => {
  const found = host.querySelector(".canvas-surface");
  return found instanceof HTMLElement ? found : document.createElement("div");
};

const canvasWorldOf = (host: HTMLDivElement): HTMLElement => {
  const found = host.querySelector(".canvas-world");
  return found instanceof HTMLElement ? found : document.createElement("div");
};

const panSurface = (
  surface: HTMLElement,
  button: number,
  points: readonly Readonly<{ x: number; y: number }>[],
): void => {
  const first = points[0] ?? { x: 0, y: 0 };
  const last = points[points.length - 1] ?? first;
  act(() => {
    surface.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button,
        pointerId: 20,
        clientX: first.x,
        clientY: first.y,
      }),
    );
  });
  for (const point of points.slice(1)) {
    act(() => {
      surface.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          button,
          pointerId: 20,
          clientX: point.x,
          clientY: point.y,
        }),
      );
    });
  }
  act(() => {
    surface.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        button,
        pointerId: 20,
        clientX: last.x,
        clientY: last.y,
      }),
    );
  });
};

const wheelSurface = (
  surface: HTMLElement,
  delta: Readonly<{ x: number; y: number }>,
  options: Readonly<{
    ctrlKey?: boolean;
    metaKey?: boolean;
    clientX?: number;
    clientY?: number;
  }> = {},
): WheelEvent => {
  const event = new WheelEvent("wheel", {
    bubbles: true,
    cancelable: true,
    deltaX: delta.x,
    deltaY: delta.y,
  });
  Object.defineProperties(event, {
    ctrlKey: { value: options.ctrlKey ?? false },
    metaKey: { value: options.metaKey ?? false },
    clientX: { value: options.clientX ?? 0 },
    clientY: { value: options.clientY ?? 0 },
  });
  act(() => {
    surface.dispatchEvent(event);
  });
  return event;
};

test("文書の viewport を全キャンバス要素へ適用する", () => {
  const initialDocument = {
    ...documentWithConnection,
    viewport: { x: 48, y: -24, zoom: 1.5 },
  };
  const host = renderEditor(initialDocument);

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(48px, -24px) scale(1.5)",
  );
  expect(host.querySelector('[aria-label="ズーム 150%"]')).not.toBeNull();
  expect(canvasWorldOf(host).querySelectorAll("article")).toHaveLength(2);
  expect(canvasWorldOf(host).querySelectorAll("[data-connection-id]")).toHaveLength(
    1,
  );
});

test("空白部の左ドラッグで pan し、付箋を作成しない", () => {
  const host = renderEditor();
  const surface = canvasSurfaceOf(host);
  const world = canvasWorldOf(host);

  panSurface(world, 0, [
    { x: 100, y: 80 },
    { x: 132, y: 104 },
  ]);
  act(() => {
    world.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 132,
        clientY: 104,
      }),
    );
  });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(32px, 24px) scale(1)",
  );
  expect(surface.getAttribute("data-panning")).toBe("false");
  expect(host.querySelectorAll("article")).toHaveLength(0);
});

test("空白部の左クリックでは付箋を作成する", () => {
  const host = renderEditor();
  const world = canvasWorldOf(host);

  panSurface(world, 0, [{ x: 100, y: 80 }]);
  clickSurface(host, { x: 100, y: 80 });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(0px, 0px) scale(1)",
  );
  expect(host.querySelectorAll("article")).toHaveLength(1);
});

test("Space と左ドラッグで pan し、付箋を作成しない", () => {
  const host = renderEditor();
  const surface = canvasSurfaceOf(host);

  const toolbarButton = buttonNamed(host, "Domain Event");
  act(() => {
    toolbarButton.focus();
    toolbarButton.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "Space",
        key: " ",
      }),
    );
  });
  panSurface(surface, 0, [
    { x: 100, y: 80 },
    { x: 132, y: 104 },
  ]);
  act(() => {
    surface.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 132,
        clientY: 104,
      }),
    );
    toolbarButton.dispatchEvent(
      new KeyboardEvent("keyup", {
        bubbles: true,
        code: "Space",
        key: " ",
      }),
    );
  });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(32px, 24px) scale(1)",
  );
  expect(host.querySelectorAll("article")).toHaveLength(0);
});

test("中ボタンドラッグで pan する", () => {
  const host = renderEditor();
  const surface = canvasSurfaceOf(host);

  panSurface(surface, 1, [
    { x: 80, y: 90 },
    { x: 60, y: 130 },
  ]);

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(-20px, 40px) scale(1)",
  );
});

test("中ボタンで pan した直後の左クリックで付箋を作成できる", () => {
  const host = renderEditor();
  panSurface(canvasSurfaceOf(host), 1, [
    { x: 80, y: 90 },
    { x: 60, y: 130 },
  ]);

  clickSurface(host, { x: 120, y: 130 });

  expect(host.querySelectorAll("article")).toHaveLength(1);
});

test("中ボタンで pan した直後の左クリックで既存の付箋を選択できる", () => {
  const host = renderEditor(existingStickyDocument);
  panSurface(canvasSurfaceOf(host), 1, [
    { x: 80, y: 90 },
    { x: 60, y: 130 },
  ]);

  act(() => {
    articleOf(host).dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: 20,
        clientY: 90,
      }),
    );
  });

  expect(articleOf(host).getAttribute("data-sticky-session")).toBe("selected");
});

test("pointer capture を失うと pan を中止する", () => {
  const host = renderEditor();
  const surface = canvasSurfaceOf(host);

  act(() => {
    surface.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 1,
        pointerId: 20,
        clientX: 80,
        clientY: 90,
      }),
    );
    surface.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        button: 1,
        pointerId: 20,
        clientX: 100,
        clientY: 110,
      }),
    );
    surface.dispatchEvent(
      new PointerEvent("lostpointercapture", {
        bubbles: true,
        pointerId: 20,
      }),
    );
  });
  const transformAtCancel = canvasWorldOf(host).style.transform;

  act(() => {
    surface.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        button: 1,
        pointerId: 20,
        clientX: 140,
        clientY: 150,
      }),
    );
  });

  expect(transformAtCancel).toBe("translate(20px, 20px) scale(1)");
  expect(canvasWorldOf(host).style.transform).toBe(transformAtCancel);
  expect(surface.getAttribute("data-panning")).toBe("false");
});

test("window が blur すると pan とクリック抑止を解除する", () => {
  const host = renderEditor();
  const surface = canvasSurfaceOf(host);

  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        code: "Space",
        key: " ",
      }),
    );
    surface.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        pointerId: 20,
        clientX: 80,
        clientY: 90,
      }),
    );
    window.dispatchEvent(new Event("blur"));
  });
  clickSurface(host, { x: 120, y: 130 });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(0px, 0px) scale(1)",
  );
  expect(surface.getAttribute("data-panning")).toBe("false");
  expect(host.querySelectorAll("article")).toHaveLength(1);
});

test("修飾キーなしのホイールで pan する", () => {
  const host = renderEditor();
  const surface = canvasSurfaceOf(host);

  wheelSurface(surface, { x: 18, y: -30 });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(-18px, 30px) scale(1)",
  );
});

test("Ctrl ホイールの前後でカーソル下のワールド座標を維持する", () => {
  const host = renderEditor();
  const surface = canvasSurfaceOf(host);

  wheelSurface(
    surface,
    { x: 0, y: -120 },
    { ctrlKey: true, clientX: 240, clientY: 180 },
  );
  clickSurface(host, { x: 240, y: 180 });

  const sticky = articleOf(host);
  expect(Number.parseFloat(sticky.style.left)).toBeCloseTo(240);
  expect(Number.parseFloat(sticky.style.top)).toBeCloseTo(180);
  expect(canvasWorldOf(host).style.transform).not.toBe(
    "translate(0px, 0px) scale(1)",
  );
});

test("付箋がないとき Ctrl+0 で viewport を既定値へ戻す", () => {
  const initialDocument = {
    ...Document.empty(),
    viewport: { x: 80, y: -40, zoom: 2 },
  };
  const host = renderEditor(initialDocument);
  const surface = canvasSurfaceOf(host);

  act(() => {
    surface.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "0",
      }),
    );
  });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(0px, 0px) scale(1)",
  );
  expect(host.querySelector('[aria-label="ズーム 100%"]')).not.toBeNull();
});

test("Ctrl+0 で全付箋をキャンバス面へ収める", () => {
  const spreadDocument = {
    ...Document.empty(),
    stickies: [
      StickyModel.create(
        StickyId.create("stk_farleft00000"),
        STICKY_TYPES.event,
        "left",
        { x: -100, y: 50 },
        { width: 200, height: 100 },
      ),
      StickyModel.create(
        StickyId.create("stk_farright0000"),
        STICKY_TYPES.command,
        "right",
        { x: 300, y: 250 },
        { width: 100, height: 50 },
      ),
    ],
    viewport: { x: 80, y: -40, zoom: 0.5 },
  };
  const host = renderEditor(spreadDocument);
  const surface = canvasSurfaceOf(host);

  act(() => {
    surface.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "0",
      }),
    );
  });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(160px, 20px) scale(1.6)",
  );
  expect(host.querySelector('[aria-label="ズーム 160%"]')).not.toBeNull();
});

test("pan 中も接続作成セッションを維持する", () => {
  const host = renderEditor(documentWithTwoStickies);
  const surface = canvasSurfaceOf(host);

  act(() => {
    buttonNamed(host, "接続").click();
  });
  wheelSurface(surface, { x: 20, y: 30 });

  expect(host.textContent).toContain("始点の付箋を選択");
});

test("本文エディタ上のホイールはキャンバスを移動しない", () => {
  const host = renderEditor(existingStickyDocument);
  doubleClickSurface(host, { x: 20, y: 30 });
  const editor = editorOf(host);

  wheelSurface(editor, { x: 0, y: 80 });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(0px, 0px) scale(1)",
  );
});

test("本文編集中でも Ctrl+0 で viewport をリセットする", () => {
  const initialDocument = {
    ...existingStickyDocument,
    viewport: { x: 80, y: -40, zoom: 2 },
  };
  const host = renderEditor(initialDocument);
  doubleClickSurface(host, { x: 120, y: 20 });
  const editor = editorOf(host);

  act(() => {
    editor.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "0",
      }),
    );
  });

  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(40px, 20px) scale(4)",
  );
  expect(editorOf(host)).toBe(editor);
});

test("本文エディタ上の Ctrl ホイールはネイティブズームを抑止する", () => {
  const host = renderEditor(existingStickyDocument);
  doubleClickSurface(host, { x: 20, y: 30 });
  const editor = editorOf(host);

  const event = wheelSurface(
    editor,
    { x: 0, y: -80 },
    { ctrlKey: true, clientX: 20, clientY: 30 },
  );

  expect(event.defaultPrevented).toBe(true);
  expect(canvasWorldOf(host).style.transform).toBe(
    "translate(0px, 0px) scale(1)",
  );
});

test("Ctrl+= と Ctrl+- はキャンバス中心を固定して段階ズームする", () => {
  const host = renderEditor();
  const toolbarButton = buttonNamed(host, "Domain Event");

  act(() => {
    toolbarButton.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "=",
      }),
    );
  });
  expect(host.querySelector('[aria-label="ズーム 120%"]')).not.toBeNull();

  act(() => {
    toolbarButton.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "-",
      }),
    );
  });
  expect(host.querySelector('[aria-label="ズーム 100%"]')).not.toBeNull();
});
