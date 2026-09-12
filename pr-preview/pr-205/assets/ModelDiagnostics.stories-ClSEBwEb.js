import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-Bpcsvgfo.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{s as i,t as a}from"./src-Cn0NMhrP.js";import{a as o,i as s,n as c,o as l,r as u,s as d}from"./model-editor-zmkbGN3c.js";import{n as f,t as p}from"./preview-data-card-tBFMG1gT.js";import{n as m,t as h}from"./preview-error-placeholder-PIa1M-QS.js";import{n as g,t as _}from"./preview-workflow-card-Bem9YC5f.js";var v=t((()=>{}));function y({value:e,onChange:t}){let n=o({value:e,onChange:t}),r=l.create(n.value);return(0,x.jsxs)(`div`,{className:`model-diagnostics`,children:[(0,x.jsx)(`section`,{className:`model-diagnostics__editor`,"aria-label":`テキストエディタ`,children:(0,x.jsx)(c,{editing:n})}),(0,x.jsx)(`section`,{className:`model-diagnostics__preview`,"aria-label":`構造化プレビュー`,children:r.document.declarations.map(e=>(0,x.jsx)(b,{decl:e,analyzed:r},S(e)))})]})}function b({decl:e,analyzed:t}){return i.isError(e)?(0,x.jsx)(h,{decl:e,diagnostics:t.diagnostics}):i.isData(e)?(0,x.jsx)(p,{decl:e,undefinedTypeNames:t.undefinedTypeNames}):(0,x.jsx)(_,{decl:e,undefinedTypeNames:t.undefinedTypeNames})}var x,S,C=t((()=>{a(),d(),s(),u(),f(),m(),g(),v(),x=r(),S=e=>`${e.kind}-${e.range.startLine}-${e.range.startColumn}-${e.range.endLine}-${e.range.endColumn}`}));function w({value:e}){let[t,n]=(0,T.useState)(e);return(0,E.jsx)(`div`,{className:`model-diagnostics-story`,children:(0,E.jsx)(y,{value:t,onChange:n})})}var T,E,D,O,k,A,j,M;t((()=>{T=e(n(),1),C(),E=r(),D={component:y,title:`Model/ModelDiagnostics`,render:e=>(0,E.jsx)(w,{value:e.value}),argTypes:{onChange:{control:!1}}},O={args:{value:`data 注文ID = string

data 数量 = int constrained 10..1

data 注文 = 未検証の注文 OR 検証済みの注文

workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント
  error: 検証エラー
`}},k={args:{value:`data 注文ID = string
data 注文 =
  注文ID
  AND 顧客情報

workflow 通知する =
  input: string
  output: string
`}},A={args:{value:`data =
ゴミ行
data 注文 = 未定義型
`}},j={args:{value:``}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
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
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data =
ゴミ行
data 注文 = 未定義型
\`
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    value: ""
  }
}`,...j.parameters?.docs?.source}}},M=[`Default`,`AllProps`,`EdgeCases`,`Empty`]}))();export{k as AllProps,O as Default,A as EdgeCases,j as Empty,M as __namedExportsOrder,D as default};