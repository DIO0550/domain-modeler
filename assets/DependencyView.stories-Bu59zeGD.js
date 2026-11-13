import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t}from"./iframe-L9XTDX8b.js";import{t as n}from"./jsx-runtime-MKhVqBIO.js";import{n as r,t as i}from"./analyzed-model-CPBzqcyB.js";import{n as a,t as o}from"./dependency-view--JcCXEbt.js";function s({source:e,measurement:t=`normal`}){let n=(0,c.useMemo)(()=>i.create(e),[e]);return(0,l.jsx)(`div`,{className:`dependency-view-story`,children:(0,l.jsxs)(o.Root,{analyzed:n,onEditSource:()=>void 0,observeSizes:t===`failure`?p:void 0,children:[(0,l.jsx)(o.Legend,{}),(0,l.jsx)(o.Toolbar,{}),(0,l.jsx)(o.Graph,{}),(0,l.jsx)(o.Inspector,{}),(0,l.jsx)(o.Diagnostics,{})]})})}var c,l,u,d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D;function O(){return(O=e((()=>{c=t(),r(),a(),l=n(),{expect:u,userEvent:d,within:f}=__STORYBOOK_MODULE_TEST__,p=(e,t)=>(t(new Map),()=>void 0),m={component:s,title:`Model/DependencyView`,parameters:{layout:`fullscreen`}},h={args:{source:`data 注文ID = string
data 数量 = int constrained 1..100
data 注文 = 注文ID AND 数量
data 結果 = 注文 OR string
workflow 注文を確定する =
  input: 注文
  output: 結果
  error: string
`}},g={args:{source:`data 注文 = string
workflow 更新する =
  input: 注文 list option
  output: 注文
  error: 注文
`}},_={args:{source:``}},v={args:{source:`state-machine 処理 =
  initial: 待機
  state: 待機
`}},y={args:{source:`data =
data 注文 = 不明な注文
data 数量 = int
`}},b={args:{source:`data 注文 = 注文ID AND 未定義の数量 option
`}},x={args:{source:`data 注文 = string
`,measurement:`failure`}},S={args:{source:`data 木 = 木 list
data A = B
data B = A
data 孤立 = string
`}},C={args:{source:`data とても長い名前を持つ注文に関連する詳細情報 = string
data 商品名 = string constrained length 1..80
data 注文 = とても長い名前を持つ注文に関連する詳細情報 list option AND 商品名 option list
`}},w={args:{source:`data 注文 = string
data 注文 = int
workflow 更新 =
  input: 注文
  output: 注文
`}},T={args:{source:`data 注文ID = string
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
`},play:async({canvasElement:e})=>{let t=f(e);await d.click(await t.findByRole(`button`,{name:`注文 RECORD`})),await d.click(t.getByRole(`button`,{name:`関連のみ`})),await u(t.getByRole(`button`,{name:`関連のみ`})).toHaveAttribute(`aria-pressed`,`true`),await u(e.querySelectorAll(`[data-node-id]`)).toHaveLength(5),await u(e.querySelectorAll(`svg g`)).toHaveLength(4)}},E={args:T.args,play:async({canvasElement:e})=>{let t=f(e),n=()=>e.querySelector(`.dependency-view__drawing`);await t.findByRole(`button`,{name:`注文 RECORD`}),await d.click(t.getByRole(`button`,{name:`拡大`}));let r=n().style.transform;await d.click(t.getByRole(`button`,{name:`注文 RECORD`})),await d.click(t.getByRole(`button`,{name:`関連のみ`})),await d.click(t.getByRole(`button`,{name:`全体に合わせる`})),await d.click(t.getByRole(`button`,{name:/^全体$/})),await u(n().style.transform).toBe(r),await u(t.getByRole(`button`,{name:`注文 RECORD`})).toHaveAttribute(`aria-pressed`,`true`)}},D=[`Normal`,`WorkflowRoles`,`Empty`,`StateMachineOnly`,`PartialSyntaxError`,`Undefined`,`LayoutFailure`,`Cycles`,`LongContent`,`DuplicateNames`,`DirectNeighborhood`,`PanZoom`]})))()}O();export{S as Cycles,T as DirectNeighborhood,w as DuplicateNames,_ as Empty,x as LayoutFailure,C as LongContent,h as Normal,E as PanZoom,y as PartialSyntaxError,v as StateMachineOnly,b as Undefined,g as WorkflowRoles,D as __namedExportsOrder,m as default};