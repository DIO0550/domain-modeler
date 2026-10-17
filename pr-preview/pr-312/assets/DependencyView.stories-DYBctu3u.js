import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-DnoNx5mK.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{n as i,t as a}from"./analyzed-model-BPhk-lk-.js";import{n as o,t as s}from"./dependency-view-BBgWLObn.js";function c({source:e,measurement:t=`normal`}){let n=(0,l.useMemo)(()=>a.create(e),[e]);return(0,u.jsx)(`div`,{className:`dependency-view-story`,children:(0,u.jsxs)(s.Root,{analyzed:n,onEditSource:()=>void 0,observeSizes:t===`failure`?m:void 0,children:[(0,u.jsx)(s.Legend,{}),(0,u.jsx)(s.Toolbar,{}),(0,u.jsx)(s.Graph,{}),(0,u.jsx)(s.Inspector,{}),(0,u.jsx)(s.Diagnostics,{})]})})}var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O;t((()=>{l=e(n(),1),i(),o(),u=r(),{expect:d,userEvent:f,within:p}=__STORYBOOK_MODULE_TEST__,m=(e,t)=>(t(new Map),()=>void 0),h={component:c,title:`Model/DependencyView`,parameters:{layout:`fullscreen`}},g={args:{source:`data 注文ID = string
data 数量 = int constrained 1..100
data 注文 = 注文ID AND 数量
data 結果 = 注文 OR string
workflow 注文を確定する =
  input: 注文
  output: 結果
  error: string
`}},_={args:{source:`data 注文 = string
workflow 更新する =
  input: 注文 list option
  output: 注文
  error: 注文
`}},v={args:{source:``}},y={args:{source:`state-machine 処理 =
  initial: 待機
  state: 待機
`}},b={args:{source:`data =
data 注文 = 不明な注文
data 数量 = int
`}},x={args:{source:`data 注文 = 注文ID AND 未定義の数量 option
`}},S={args:{source:`data 注文 = string
`,measurement:`failure`}},C={args:{source:`data 木 = 木 list
data A = B
data B = A
data 孤立 = string
`}},w={args:{source:`data とても長い名前を持つ注文に関連する詳細情報 = string
data 商品名 = string constrained length 1..80
data 注文 = とても長い名前を持つ注文に関連する詳細情報 list option AND 商品名 option list
`}},T={args:{source:`data 注文 = string
data 注文 = int
workflow 更新 =
  input: 注文
  output: 注文
`}},E={args:{source:`data 注文ID = string
data 顧客情報 = string
data 商品ID = string
data 数量 = int constrained 1..100
data 注文明細 = 商品ID AND 数量
data 注文 = 注文ID AND 顧客情報 AND 注文明細 list
data 注文確定 = 注文ID
data 検証エラー = string
workflow 注文を確定する =
  input: 注文
  output: 注文確定
  error: 検証エラー
`},play:async({canvasElement:e})=>{let t=p(e);await f.click(await t.findByRole(`button`,{name:`注文 RECORD`})),await f.click(t.getByRole(`button`,{name:`関連のみ`})),await d(t.getByRole(`button`,{name:`関連のみ`})).toHaveAttribute(`aria-pressed`,`true`),await d(e.querySelectorAll(`[data-node-id]`)).toHaveLength(5),await d(e.querySelectorAll(`svg g`)).toHaveLength(4)}},D={args:E.args,play:async({canvasElement:e})=>{let t=p(e),n=()=>e.querySelector(`.dependency-view__drawing`);await t.findByRole(`button`,{name:`注文 RECORD`}),await f.click(t.getByRole(`button`,{name:`拡大`}));let r=n().style.transform;await f.click(t.getByRole(`button`,{name:`注文 RECORD`})),await f.click(t.getByRole(`button`,{name:`関連のみ`})),await f.click(t.getByRole(`button`,{name:`全体に合わせる`})),await f.click(t.getByRole(`button`,{name:/^全体$/})),await d(n().style.transform).toBe(r),await d(t.getByRole(`button`,{name:`注文 RECORD`})).toHaveAttribute(`aria-pressed`,`true`)}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    source: \`data 注文ID = string
data 数量 = int constrained 1..100
data 注文 = 注文ID AND 数量
data 結果 = 注文 OR string
workflow 注文を確定する =
  input: 注文
  output: 結果
  error: string
\`
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    source: \`data 注文 = string
workflow 更新する =
  input: 注文 list option
  output: 注文
  error: 注文
\`
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    source: ""
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    source: \`state-machine 処理 =
  initial: 待機
  state: 待機
\`
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data =\\ndata 注文 = 不明な注文\\ndata 数量 = int\\n"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data 注文 = 注文ID AND 未定義の数量 option\\n"
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data 注文 = string\\n",
    measurement: "failure"
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data 木 = 木 list\\ndata A = B\\ndata B = A\\ndata 孤立 = string\\n"
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    source: \`data とても長い名前を持つ注文に関連する詳細情報 = string
data 商品名 = string constrained length 1..80
data 注文 = とても長い名前を持つ注文に関連する詳細情報 list option AND 商品名 option list
\`
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data 注文 = string\\ndata 注文 = int\\nworkflow 更新 =\\n  input: 注文\\n  output: 注文\\n"
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    source: \`data 注文ID = string
data 顧客情報 = string
data 商品ID = string
data 数量 = int constrained 1..100
data 注文明細 = 商品ID AND 数量
data 注文 = 注文ID AND 顧客情報 AND 注文明細 list
data 注文確定 = 注文ID
data 検証エラー = string
workflow 注文を確定する =
  input: 注文
  output: 注文確定
  error: 検証エラー
\`
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "注文 RECORD"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: "関連のみ"
    }));
    await expect(canvas.getByRole("button", {
      name: "関連のみ"
    })).toHaveAttribute("aria-pressed", "true");
    await expect(canvasElement.querySelectorAll("[data-node-id]")).toHaveLength(5);
    await expect(canvasElement.querySelectorAll("svg g")).toHaveLength(4);
  }
}`,...E.parameters?.docs?.source},description:{story:`直接近傍を選択した状態。全体へ戻す操作も試せる。`,...E.parameters?.docs?.description}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: DirectNeighborhood.args,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const drawing = () => canvasElement.querySelector<HTMLElement>(".dependency-view__drawing")!;
    await canvas.findByRole("button", {
      name: "注文 RECORD"
    });
    await userEvent.click(canvas.getByRole("button", {
      name: "拡大"
    }));
    const wholeTransform = drawing().style.transform;
    await userEvent.click(canvas.getByRole("button", {
      name: "注文 RECORD"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: "関連のみ"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: "全体に合わせる"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: /^全体$/
    }));
    await expect(drawing().style.transform).toBe(wholeTransform);
    await expect(canvas.getByRole("button", {
      name: "注文 RECORD"
    })).toHaveAttribute("aria-pressed", "true");
  }
}`,...D.parameters?.docs?.source},description:{story:`関連表示へのフィットと全体viewportの復元を確認する。`,...D.parameters?.docs?.description}}},O=[`Normal`,`WorkflowRoles`,`Empty`,`StateMachineOnly`,`PartialSyntaxError`,`Undefined`,`LayoutFailure`,`Cycles`,`LongContent`,`DuplicateNames`,`DirectNeighborhood`,`PanZoom`]}))();export{C as Cycles,E as DirectNeighborhood,T as DuplicateNames,v as Empty,S as LayoutFailure,w as LongContent,g as Normal,D as PanZoom,b as PartialSyntaxError,y as StateMachineOnly,x as Undefined,_ as WorkflowRoles,O as __namedExportsOrder,h as default};