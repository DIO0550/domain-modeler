import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-Bcvnyfod.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{s as i,t as a}from"./src-Dpanet-j.js";import{i as o,n as s,r as c,t as l}from"./model-editor-hmBvcUV9.js";import{n as u,t as d}from"./preview-data-card-uua0SDk6.js";import{n as f,t as p}from"./preview-error-placeholder-Cv_rc6Y_.js";import{n as m,t as h}from"./preview-workflow-card-D25zBClc.js";var g=t((()=>{}));function _({value:e,onChange:t}){let n=c.from(e);return(0,y.jsxs)(`div`,{className:`model-diagnostics`,children:[(0,y.jsx)(`section`,{className:`model-diagnostics__editor`,"aria-label":`テキストエディタ`,children:(0,y.jsx)(l,{value:e,onChange:t})}),(0,y.jsx)(`section`,{className:`model-diagnostics__preview`,"aria-label":`構造化プレビュー`,children:n.document.declarations.map(e=>(0,y.jsx)(v,{decl:e,analyzed:n},b(e)))})]})}function v({decl:e,analyzed:t}){return i.isError(e)?(0,y.jsx)(p,{decl:e,diagnostics:t.diagnostics}):i.isData(e)?(0,y.jsx)(d,{decl:e,undefinedTypeNames:t.undefinedTypeNames}):(0,y.jsx)(h,{decl:e,undefinedTypeNames:t.undefinedTypeNames})}var y,b,x=t((()=>{a(),o(),s(),u(),f(),m(),g(),y=r(),b=e=>`${e.kind}-${e.range.startLine}-${e.range.startColumn}-${e.range.endLine}-${e.range.endColumn}`}));function S({value:e}){let[t,n]=(0,C.useState)(e);return(0,w.jsx)(`div`,{className:`model-diagnostics-story`,children:(0,w.jsx)(_,{value:t,onChange:n})})}var C,w,T,E,D,O,k,A;t((()=>{C=e(n(),1),x(),w=r(),T={component:_,title:`Model/ModelDiagnostics`,render:e=>(0,w.jsx)(S,{value:e.value}),argTypes:{onChange:{control:!1}}},E={args:{value:`data 注文ID = string

data 数量 = int constrained 10..1

data 注文 = 未検証の注文 OR 検証済みの注文

workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント
  error: 検証エラー
`}},D={args:{value:`data 注文ID = string
data 注文 =
  注文ID
  AND 顧客情報

workflow 通知する =
  input: string
  output: string
`}},O={args:{value:`data =
ゴミ行
data 注文 = 未定義型
`}},k={args:{value:``}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data 注文ID = string

data 数量 = int constrained 10..1

data 注文 = 未検証の注文 OR 検証済みの注文

workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント
  error: 検証エラー
\`
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data 注文ID = string
data 注文 =
  注文ID
  AND 顧客情報

workflow 通知する =
  input: string
  output: string
\`
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data =
ゴミ行
data 注文 = 未定義型
\`
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    value: ""
  }
}`,...k.parameters?.docs?.source}}},A=[`Default`,`AllProps`,`EdgeCases`,`Empty`]}))();export{D as AllProps,E as Default,O as EdgeCases,k as Empty,A as __namedExportsOrder,T as default};