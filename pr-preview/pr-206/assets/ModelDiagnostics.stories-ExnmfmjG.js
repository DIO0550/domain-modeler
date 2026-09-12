import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-CoN0ZaUS.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{l as i,n as a,s as o,t as s}from"./src-Bbzburo7.js";import{a as c,c as l,d as u,i as d,l as f,n as p,o as m,r as h,s as g,u as _}from"./model-editor-BanvNaYd.js";import{n as v,t as y}from"./preview-type-ref-BJgau_7n.js";import{n as b,t as x}from"./preview-data-card-FQj1edcj.js";import{n as S,t as C}from"./preview-error-placeholder-BI6J1DGA.js";import{n as w,t as T}from"./preview-workflow-card-7S2L6uGn.js";var E,D,O=t((()=>{s(),f(),E=e=>e.endsWith(`
`)||e.endsWith(`\r`),D={atDocumentEnd(e){let t=a.generate(e.name);if(o.isErr(t))return t;let n=e.source.length>0&&!E(e.source)?`
`:``,r=`${n}${t.value}`,i=`${e.source}${r}`,s=e.source.length+n.length;return o.ok({edit:{start:e.source.length,end:e.source.length,replacement:r},caret:l.atOffset(i,s)})}}})),k=t((()=>{}));function A({value:e,onChange:t}){let n=c({value:e,onChange:t}),r=m.create(n.value),i=(0,M.useRef)(null),a=e=>{let t=()=>{i.current?.querySelector(`[data-decl-name="${CSS.escape(e)}"]`)?.scrollIntoView({block:`nearest`})};t(),requestAnimationFrame(t)},s=e=>{let t=m.caretOfDefinition(r,e);_.isNone(t)||(n.moveCaret(t.value),a(e))},l=e=>{let t=D.atDocumentEnd({source:n.value,name:e});o.isErr(t)||(n.applyEdit(t.value.edit,t.value.caret),a(e))},u=e=>{if(y.isDefined(e)){s(e.term.name);return}l(e.term.name)},d=e=>{l(e.term.name)};return(0,N.jsxs)(`div`,{className:`model-diagnostics`,children:[(0,N.jsx)(`section`,{className:`model-diagnostics__editor`,"aria-label":`テキストエディタ`,children:(0,N.jsx)(p,{editing:n})}),(0,N.jsx)(`section`,{ref:i,className:`model-diagnostics__preview`,"aria-label":`構造化プレビュー`,children:r.document.declarations.map(e=>(0,N.jsx)(j,{decl:e,analyzed:r,onTypeRefClick:u,onUndefinedBadgeClick:d},P(e)))})]})}function j({decl:e,analyzed:t,onTypeRefClick:n,onUndefinedBadgeClick:r}){return i.isError(e)?(0,N.jsx)(C,{decl:e,diagnostics:t.diagnostics}):i.isData(e)?(0,N.jsx)(x,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r}):(0,N.jsx)(T,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r})}var M,N,P,F=t((()=>{M=e(n(),1),s(),u(),g(),v(),O(),d(),h(),b(),S(),w(),k(),N=r(),P=e=>`${e.kind}-${e.range.startLine}-${e.range.startColumn}-${e.range.endLine}-${e.range.endColumn}`}));function I({value:e}){let[t,n]=(0,L.useState)(e);return(0,R.jsx)(`div`,{className:`model-diagnostics-story`,children:(0,R.jsx)(A,{value:t,onChange:n})})}var L,R,z,B,V,H,U,W;t((()=>{L=e(n(),1),F(),R=r(),z={component:A,title:`Model/ModelDiagnostics`,render:e=>(0,R.jsx)(I,{value:e.value}),argTypes:{onChange:{control:!1}}},B={args:{value:`data 注文ID = string

data 数量 = int constrained 10..1

data 注文 = 未検証の注文 OR 検証済みの注文

workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント
  error: 検証エラー
`}},V={args:{value:`data 注文ID = string
data 注文 =
  注文ID
  AND 顧客情報

workflow 通知する =
  input: string
  output: string
`}},H={args:{value:`data =
ゴミ行
data 注文 = 未定義型
`}},U={args:{value:``}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data =
ゴミ行
data 注文 = 未定義型
\`
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    value: ""
  }
}`,...U.parameters?.docs?.source}}},W=[`Default`,`AllProps`,`EdgeCases`,`Empty`]}))();export{V as AllProps,B as Default,H as EdgeCases,U as Empty,W as __namedExportsOrder,z as default};