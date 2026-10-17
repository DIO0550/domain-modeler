import { Viewport, type Point } from "@domain-modeler/canvas-core";
import { Option } from "@/utils/Option";
import { DependencyDiagram } from "../dependency-diagram";
import { DependencySelection } from "../dependency-selection";
import type { ModelGraphLayout } from "../model-graph-layout";

type Frame = Readonly<{
  layout: ModelGraphLayout;
  attempt: number;
  size: Readonly<{ width: number; height: number }>;
}>;

/** 選択・表示範囲と、それに対応する一時的な表示位置。文書履歴には含めない。 */
export type DependencyNavigation = Readonly<{
  selection: DependencySelection;
  attempt: number;
  fitPending: boolean;
  frame: Option<Frame>;
  camera: Option<
    Readonly<{
      viewport: Viewport;
      wholeViewport: Viewport;
    }>
  >;
}>;

type NavigationAction =
  | Readonly<{
      type: "synchronize";
      diagram: DependencyDiagram;
      frame: Option<Frame>;
    }>
  | Readonly<{
      type: "selection";
      action: Parameters<typeof DependencySelection.reduce>[1];
    }>
  | Readonly<{ type: "pan"; delta: Point }>
  | Readonly<{ type: "zoom"; factor: number; anchor: Option<Point> }>
  | Readonly<{ type: "fit" }>
  | Readonly<{ type: "rearrange" }>
  | Readonly<{ type: "reveal"; id: string }>
  | Readonly<{ type: "ensure-visible"; id: string }>;

/** 全文書の配置を使い、表示対象のカードと経路へフィットする。 */
export const DependencyNavigation = {
  create(diagram: DependencyDiagram): DependencyNavigation {
    return {
      selection: DependencySelection.create(diagram),
      attempt: 0,
      fitPending: false,
      frame: Option.none(),
      camera: Option.none(),
    };
  },

  viewport(navigation: DependencyNavigation): Viewport {
    return Option.isSome(navigation.camera)
      ? navigation.camera.value.viewport
      : Viewport.default();
  },

  fitViewport(selection: DependencySelection, frame: Frame): Viewport {
    const graph = DependencySelection.visibleDiagram(selection).graph;
    const ids = new Set(graph.nodes.map((node) => node.id));
    const edgeIds = new Set(graph.edges.map((edge) => edge.id));
    const nodes = frame.layout.nodes.filter((node) => ids.has(node.id));
    const corners = nodes.flatMap((node) => [
      { x: node.x, y: node.y },
      { x: node.x + node.width, y: node.y + node.height },
    ]);
    const routes = frame.layout.edges
      .filter((edge) => edgeIds.has(edge.id))
      .flatMap((edge) => edge.points);
    const points = [...corners, ...routes];

    if (points.length === 0) {
      return Viewport.default();
    }

    const left = Math.min(...points.map((point) => point.x)) - 32;
    const top = Math.min(...points.map((point) => point.y)) - 32;
    const right = Math.max(...points.map((point) => point.x)) + 32;
    const bottom = Math.max(...points.map((point) => point.y)) + 32;
    const zoom = Viewport.clampZoom(
      Math.min(
        frame.size.width / (right - left),
        frame.size.height / (bottom - top),
        1,
      ),
    );

    return {
      zoom,
      x: frame.size.width / 2 - ((left + right) / 2) * zoom,
      y: frame.size.height / 2 - ((top + bottom) / 2) * zoom,
    };
  },

  /** 関連表示へ入る前の全体viewportをスナップショットとして保持する。 */
  withSelection(
    navigation: DependencyNavigation,
    selection: DependencySelection,
  ): DependencyNavigation {
    const next = { ...navigation, selection };

    if (Option.isNone(navigation.camera)) {
      return next;
    }

    const camera = navigation.camera.value;
    const previousTarget = navigation.selection.target;
    const target = selection.target;

    if (target.mode === "all") {
      if (previousTarget.mode === "related") {
        return {
          ...next,
          camera: Option.some({ ...camera, viewport: camera.wholeViewport }),
        };
      }

      return next;
    }

    if (previousTarget.mode === "related") {
      const current = DependencyDiagram.currentNode(
        selection.diagram,
        previousTarget.node,
      );

      if (Option.isSome(current) && current.value === target.node) {
        return next;
      }
    }

    const wholeViewport =
      previousTarget.mode === "all" ? camera.viewport : camera.wholeViewport;
    const viewport = Option.isSome(navigation.frame)
      ? DependencyNavigation.fitViewport(selection, navigation.frame.value)
      : camera.viewport;

    return { ...next, camera: Option.some({ viewport, wholeViewport }) };
  },

  /** 初回のみ自動フィットし、その後の本文・寸法更新では閲覧位置を保つ。 */
  synchronize(
    navigation: DependencyNavigation,
    request: Readonly<{ diagram: DependencyDiagram; frame: Option<Frame> }>,
  ): DependencyNavigation {
    if (
      navigation.selection.diagram === request.diagram &&
      navigation.frame === request.frame
    ) {
      return navigation;
    }

    const selection =
      navigation.selection.diagram === request.diagram
        ? navigation.selection
        : DependencySelection.synchronize(
            navigation.selection,
            request.diagram,
          );
    const next = DependencyNavigation.withSelection(
      { ...navigation, frame: request.frame },
      selection,
    );

    if (Option.isNone(request.frame)) {
      return next;
    }

    if (
      Option.isNone(next.camera) ||
      (next.fitPending && request.frame.value.attempt === next.attempt)
    ) {
      const viewport = DependencyNavigation.fitViewport(
        selection,
        request.frame.value,
      );

      const wholeViewport = Option.isSome(next.camera)
        ? next.camera.value.wholeViewport
        : viewport;

      return {
        ...next,
        fitPending: false,
        camera: Option.some({ viewport, wholeViewport }),
      };
    }

    if (Option.isSome(navigation.frame)) {
      const previous = navigation.frame.value;
      const current = request.frame.value;

      if (
        previous.layout === current.layout &&
        previous.size.width === current.size.width &&
        previous.size.height === current.size.height
      ) {
        return next;
      }
    }

    const selected = DependencySelection.selectedNode(selection);

    return Option.isSome(selected)
      ? DependencyNavigation.reveal(next, selected.value.id)
      : next;
  },

  /** 選択先が画面外の場合だけ、倍率を保って中央へ移す。 */
  reveal(navigation: DependencyNavigation, id: string): DependencyNavigation {
    if (Option.isNone(navigation.frame) || Option.isNone(navigation.camera)) {
      return navigation;
    }

    const { layout, size } = navigation.frame.value;
    const node = layout.nodes.find((item) => item.id === id);

    if (node === undefined) {
      return navigation;
    }

    const { camera } = navigation;
    const { viewport } = camera.value;
    const start = Viewport.worldToScreen(viewport, node);
    const end = Viewport.worldToScreen(viewport, {
      x: node.x + node.width,
      y: node.y + node.height,
    });

    if (
      start.x >= 0 &&
      start.y >= 0 &&
      end.x <= size.width &&
      end.y <= size.height
    ) {
      return navigation;
    }

    return {
      ...navigation,
      camera: Option.some({
        ...camera.value,
        viewport: {
          ...viewport,
          x: size.width / 2 - (node.x + node.width / 2) * viewport.zoom,
          y: size.height / 2 - (node.y + node.height / 2) * viewport.zoom,
        },
      }),
    };
  },

  reduce(
    navigation: DependencyNavigation,
    action: NavigationAction,
  ): DependencyNavigation {
    switch (action.type) {
      case "rearrange":
        return {
          ...navigation,
          attempt: navigation.attempt + 1,
          fitPending: true,
        };
      case "synchronize":
        return DependencyNavigation.synchronize(navigation, action);
      case "selection":
        return DependencyNavigation.withSelection(
          navigation,
          DependencySelection.reduce(navigation.selection, action.action),
        );
      case "ensure-visible":
        return DependencyNavigation.reveal(navigation, action.id);
      case "reveal": {
        if (
          !navigation.selection.diagram.graph.nodes.some(
            (node) => node.id === action.id,
          )
        ) {
          return navigation;
        }

        const next = DependencyNavigation.withSelection(
          navigation,
          DependencySelection.reduce(navigation.selection, {
            type: "select",
            id: action.id,
          }),
        );

        return DependencyNavigation.reveal(next, action.id);
      }
    }

    if (Option.isNone(navigation.camera)) {
      return navigation;
    }

    const camera = navigation.camera.value;
    const viewport = camera.viewport;

    switch (action.type) {
      case "pan":
        return {
          ...navigation,
          camera: Option.some({
            ...camera,
            viewport: Viewport.pan(viewport, action.delta),
          }),
        };
      case "zoom": {
        if (Option.isNone(navigation.frame)) {
          return navigation;
        }

        const size = navigation.frame.value.size;
        const anchor = Option.isSome(action.anchor)
          ? action.anchor.value
          : { x: size.width / 2, y: size.height / 2 };

        return {
          ...navigation,
          camera: Option.some({
            ...camera,
            viewport: Viewport.zoomAt(
              viewport,
              viewport.zoom * action.factor,
              anchor,
            ),
          }),
        };
      }
      case "fit":
        return Option.isSome(navigation.frame)
          ? {
              ...navigation,
              camera: Option.some({
                ...camera,
                viewport: DependencyNavigation.fitViewport(
                  navigation.selection,
                  navigation.frame.value,
                ),
              }),
            }
          : navigation;
    }
  },
} as const;
