import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-DUWZN8-i.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{n as i,t as a}from"./analyzed-model-cBcx9bky.js";import{n as o,t as s}from"./dependency-view-D3suI7ab.js";function c({source:e,measurement:t=`normal`}){let n=(0,l.useMemo)(()=>a.create(e),[e]);return(0,u.jsx)(`div`,{className:`dependency-view-story`,children:(0,u.jsxs)(s.Root,{analyzed:n,onEditSource:()=>void 0,observeSizes:t===`failure`?d:void 0,children:[(0,u.jsx)(s.Legend,{}),(0,u.jsx)(s.Graph,{}),(0,u.jsx)(s.Inspector,{}),(0,u.jsx)(s.Diagnostics,{})]})})}var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C;t((()=>{l=e(n(),1),i(),o(),u=r(),d=(e,t)=>(t(new Map),()=>void 0),f={component:c,title:`Model/DependencyView`,parameters:{layout:`fullscreen`}},p={args:{source:`data 注文ID = string
data 数量 = int constrained 1..100
data 注文 = 注文ID AND 数量
data 結果 = 注文 OR string
workflow 注文を確定する =
  input: 注文
  output: 結果
  error: string
`}},m={args:{source:`data 注文 = string
workflow 更新する =
  input: 注文 list option
  output: 注文
  error: 注文
`}},h={args:{source:``}},g={args:{source:`state-machine 処理 =
  initial: 待機
  state: 待機
`}},_={args:{source:`data =
data 注文 = 不明な注文
data 数量 = int
`}},v={args:{source:`data 注文 = 注文ID AND 未定義の数量 option
`}},y={args:{source:`data 注文 = string
`,measurement:`failure`}},b={args:{source:`data 木 = 木 list
data A = B
data B = A
data 孤立 = string
`}},x={args:{source:`data とても長い名前を持つ注文に関連する詳細情報 = string
data 商品名 = string constrained length 1..80
data 注文 = とても長い名前を持つ注文に関連する詳細情報 list option AND 商品名 option list
`}},S={args:{source:`data 注文 = string
data 注文 = int
workflow 更新 =
  input: 注文
  output: 注文
`}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    source: \`data 注文 = string
workflow 更新する =
  input: 注文 list option
  output: 注文
  error: 注文
\`
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    source: ""
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    source: \`state-machine 処理 =
  initial: 待機
  state: 待機
\`
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data =\\ndata 注文 = 不明な注文\\ndata 数量 = int\\n"
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data 注文 = 注文ID AND 未定義の数量 option\\n"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data 注文 = string\\n",
    measurement: "failure"
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data 木 = 木 list\\ndata A = B\\ndata B = A\\ndata 孤立 = string\\n"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    source: \`data とても長い名前を持つ注文に関連する詳細情報 = string
data 商品名 = string constrained length 1..80
data 注文 = とても長い名前を持つ注文に関連する詳細情報 list option AND 商品名 option list
\`
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    source: "data 注文 = string\\ndata 注文 = int\\nworkflow 更新 =\\n  input: 注文\\n  output: 注文\\n"
  }
}`,...S.parameters?.docs?.source}}},C=[`Normal`,`WorkflowRoles`,`Empty`,`StateMachineOnly`,`PartialSyntaxError`,`Undefined`,`LayoutFailure`,`Cycles`,`LongContent`,`DuplicateNames`]}))();export{b as Cycles,S as DuplicateNames,h as Empty,y as LayoutFailure,x as LongContent,p as Normal,_ as PartialSyntaxError,g as StateMachineOnly,v as Undefined,m as WorkflowRoles,C as __namedExportsOrder,f as default};