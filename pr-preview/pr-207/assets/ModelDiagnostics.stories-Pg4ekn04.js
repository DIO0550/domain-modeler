import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-D0QF86Nw.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{c as i,n as a,t as o,u as s}from"./src-C9_3HDZb.js";import{a as c,c as l,d as u,i as d,l as f,n as p,o as m,r as h,s as g,u as _}from"./model-editor-C2tWzzkI.js";import{i as v,r as y}from"./decl-name-rXb-n9HU.js";import{n as b,t as x}from"./preview-data-card-BQIdlhsX.js";import{n as S,t as C}from"./preview-error-placeholder-D5qvLl6F.js";import{n as w,t as T}from"./preview-workflow-card-B6EG04tX.js";var E,D,O,k,A,j,M=t((()=>{f(),E={data:`data`,workflow:`workflow`},D=`名前`,O=(e,t)=>{let n=t.indexOf(D);return{kind:e,source:t,nameStart:n,nameEnd:n+2}},k=e=>e===void 0||e===`
`||e===`\r`,A=e=>e===void 0||e===`
`||e===`\r`,j={data(){return O(E.data,`data ${D} = string`)},workflow(){return O(E.workflow,`workflow ${D} =\n  input: string\n  output: string`)},insert(e,t){let n=t.start===0?void 0:t.source[t.start-1],r=t.end===t.source.length?void 0:t.source[t.end],i=k(n)?``:`
`,a=A(r)?``:`
`,o=`${i}${e.source}${a}`,s=t.start+i.length+e.nameStart,c=t.start+i.length+e.nameEnd,u=`${t.source.slice(0,t.start)}${o}${t.source.slice(t.end)}`;return{edit:{start:t.start,end:t.end,replacement:o},nameStart:s,nameEnd:c,line:l.atOffset(u,s).line}}}})),N,P,F=t((()=>{o(),f(),N=e=>e.endsWith(`
`)||e.endsWith(`\r`),P={atDocumentEnd(e){let t=a.generate(e.name);if(i.isErr(t))return t;let n=e.source.length>0&&!N(e.source)?`
`:``,r=`${n}${t.value}`,o=`${e.source}${r}`,s=e.source.length+n.length;return i.ok({edit:{start:e.source.length,end:e.source.length,replacement:r},caret:l.atOffset(o,s)})}}})),I=t((()=>{}));function L({value:e,onChange:t}){let n=c({value:e,onChange:t}),r=m.create(n.value),a=(0,z.useRef)(null),o=e=>{let t=()=>{a.current?.querySelector(`[data-decl-name="${CSS.escape(e)}"]`)?.scrollIntoView({block:`nearest`})};t(),requestAnimationFrame(t)},s=e=>{let t=m.caretOfDefinition(r,e);_.isNone(t)||(n.moveCaret(t.value),o(e))},l=e=>{let t=P.atDocumentEnd({source:n.value,name:e});i.isErr(t)||(n.applyEdit(t.value.edit,t.value.caret),o(e))},u=e=>{if(y.isDefined(e)){s(e.term.name);return}l(e.term.name)},d=e=>{l(e.term.name)},f=e=>{let t=m.rename(r,e);i.isErr(t)||(n.applyEdit(t.value.edit,t.value.caret),o(e.nextName))},h=e=>{let t=n.inputRef.current;if(t===null)return;let r=j.insert(e,{source:n.value,start:t.selectionStart,end:t.selectionEnd});n.applyEditSelecting(r.edit,{start:r.nameStart,end:r.nameEnd,line:r.line})};return(0,B.jsxs)(`div`,{className:`model-diagnostics`,children:[(0,B.jsxs)(`div`,{className:`model-diagnostics__toolbar`,role:`toolbar`,"aria-label":`編集支援`,children:[(0,B.jsx)(`button`,{type:`button`,className:`model-diagnostics__toolbar-button`,onClick:()=>h(j.data()),children:`data雛形`}),(0,B.jsx)(`button`,{type:`button`,className:`model-diagnostics__toolbar-button`,onClick:()=>h(j.workflow()),children:`workflow雛形`})]}),(0,B.jsx)(`section`,{className:`model-diagnostics__editor`,"aria-label":`テキストエディタ`,children:(0,B.jsx)(p,{editing:n})}),(0,B.jsx)(`section`,{ref:a,className:`model-diagnostics__preview`,"aria-label":`構造化プレビュー`,children:r.document.declarations.map(e=>(0,B.jsx)(R,{decl:e,analyzed:r,onTypeRefClick:u,onUndefinedBadgeClick:d,onRename:f},V(e)))})]})}function R({decl:e,analyzed:t,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:i}){if(s.isError(e))return(0,B.jsx)(C,{decl:e,diagnostics:t.diagnostics});let a=t=>{i({currentName:e.name,nextName:t})};return s.isData(e)?(0,B.jsx)(x,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:a}):(0,B.jsx)(T,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:a})}var z,B,V,H=t((()=>{z=e(n(),1),o(),u(),g(),M(),v(),F(),d(),h(),b(),S(),w(),I(),B=r(),V=e=>`${e.kind}-${e.range.startLine}-${e.range.startColumn}-${e.range.endLine}-${e.range.endColumn}`}));function U({value:e}){let[t,n]=(0,W.useState)(e);return(0,G.jsx)(`div`,{className:`model-diagnostics-story`,children:(0,G.jsx)(L,{value:t,onChange:n})})}var W,G,K,q,J,Y,X,Z;t((()=>{W=e(n(),1),H(),G=r(),K={component:L,title:`Model/ModelDiagnostics`,render:e=>(0,G.jsx)(U,{value:e.value}),argTypes:{onChange:{control:!1}}},q={args:{value:`data 注文ID = string

data 数量 = int constrained 10..1

data 注文 = 未検証の注文 OR 検証済みの注文

workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント
  error: 検証エラー
`}},J={args:{value:`data 注文ID = string
data 注文 =
  注文ID
  AND 顧客情報

workflow 通知する =
  input: string
  output: string
`}},Y={args:{value:`data =
ゴミ行
data 注文 = 未定義型
`}},X={args:{value:``}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data =
ゴミ行
data 注文 = 未定義型
\`
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    value: ""
  }
}`,...X.parameters?.docs?.source}}},Z=[`Default`,`AllProps`,`EdgeCases`,`Empty`]}))();export{J as AllProps,q as Default,Y as EdgeCases,X as Empty,Z as __namedExportsOrder,K as default};