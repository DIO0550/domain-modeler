import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-WPlR1P7I.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{d as i,l as a,n as o,t as s}from"./src-4hRut5Gm.js";import{a as c,i as l,n as u,o as d,r as f,t as p}from"./analyzed-model-DundV7M9.js";import{i as m,r as ee}from"./decl-name-CgdWtr5o.js";import{a as te,i as h,n as ne,r as g}from"./model-editor-B0z2cH3w.js";import{n as _,t as v}from"./preview-data-card-DEFwKYSh.js";import{n as y,t as b}from"./preview-error-placeholder-CuClimPm.js";import{n as x,t as S}from"./preview-workflow-card-qIFRpr2D.js";import{n as C,t as w}from"./state-machine-screen-jz9fgQo2.js";var T,E,D,O,k,A,re=t((()=>{l(),T={data:`data`,workflow:`workflow`},E=`名前`,D=(e,t)=>{let n=t.indexOf(E);return{kind:e,source:t,nameStart:n,nameEnd:n+2}},O=e=>e===void 0||e===`
`||e===`\r`,k=e=>e===void 0||e===`
`||e===`\r`,A={data(){return D(T.data,`data ${E} = string`)},workflow(){return D(T.workflow,`workflow ${E} =\n  input: string\n  output: string`)},insert(e,t){let n=t.start===0?void 0:t.source[t.start-1],r=t.end===t.source.length?void 0:t.source[t.end],i=O(n)?``:`
`,a=k(r)?``:`
`,o=`${i}${e.source}${a}`,s=t.start+i.length+e.nameStart,c=t.start+i.length+e.nameEnd,l=`${t.source.slice(0,t.start)}${o}${t.source.slice(t.end)}`;return{edit:{start:t.start,end:t.end,replacement:o},nameStart:s,nameEnd:c,line:f.atOffset(l,s).line}}}})),j,M,ie=t((()=>{s(),l(),j=e=>e.endsWith(`
`)||e.endsWith(`\r`),M={atDocumentEnd(e){let t=o.generate(e.name);if(a.isErr(t))return t;let n=e.source.length>0&&!j(e.source)?`
`:``,r=`${n}${t.value}`,i=`${e.source}${r}`,s=e.source.length+n.length;return a.ok({edit:{start:e.source.length,end:e.source.length,replacement:r},caret:f.atOffset(i,s)})}}})),N,ae=t((()=>{N={create(e){return{current:e,past:[],future:[]}},record(e,t){return e.current===t?e:{current:t,past:[...e.past,e.current],future:[]}},undo(e){let t=e.past[e.past.length-1];return t===void 0?e:{current:t,past:e.past.slice(0,-1),future:[e.current,...e.future]}},redo(e){let t=e.future[0];return t===void 0?e:{current:t,past:[...e.past,e.current],future:e.future.slice(1)}}}}));function oe({value:e,onChange:t}){let[n,r]=(0,P.useState)(()=>N.create(e));n.current!==e&&r(N.create(e));let i=n.current===e?n:N.create(e);return{change:n=>{n!==e&&(r(N.record(i,n)),t(n))},undo:()=>{let e=N.undo(i);e!==i&&(r(e),t(e.current))},redo:()=>{let e=N.redo(i);e!==i&&(r(e),t(e.current))},canUndo:i.past.length>0,canRedo:i.future.length>0}}var P,se=t((()=>{P=e(n(),1),ae()}));function F({editing:e}){let[t,n]=(0,I.useReducer)(L,{mode:`model`,selectedMachineIndex:0}),r=(0,I.useRef)(null),i=(0,I.useRef)({editorTop:0,editorLeft:0,previewTop:0}),a=(0,I.useRef)(!1),o=(0,I.useRef)(null),s=o=>{if(t.mode===`model`){let t=e.inputRef.current;e.rememberCurrentSelection(),i.current={editorTop:t?.scrollTop??0,editorLeft:t?.scrollLeft??0,previewTop:r.current?.scrollTop??0},a.current=!0}n({type:`stateMachineOpened`,index:o})},c=e=>{o.current=e??null,n({type:`modelOpened`})},l=(0,I.useEffectEvent)(()=>{if(!a.current)return;let t=e.inputRef.current;if(t===null)return;r.current!==null&&(r.current.scrollTop=i.current.previewTop);let n=o.current;if(o.current=null,n!==null){e.selectRange(n);return}e.restoreSelection(),t.scrollTop=i.current.editorTop,t.scrollLeft=i.current.editorLeft,t.dispatchEvent(new Event(`scroll`,{bubbles:!0}))});return(0,I.useLayoutEffect)(()=>{t.mode===`model`&&l()},[t.mode]),{mode:t.mode,selectedMachineIndex:t.selectedMachineIndex,previewRef:r,openModel:c,openStateMachine:s,selectMachine:e=>n({type:`machineSelected`,index:e})}}var I,L,ce=t((()=>{I=e(n(),1),L=(e,t)=>{switch(t.type){case`modelOpened`:return{...e,mode:`model`};case`stateMachineOpened`:return{mode:`state-machine`,selectedMachineIndex:t.index??e.selectedMachineIndex};case`machineSelected`:return{...e,selectedMachineIndex:t.index}}}})),le=t((()=>{}));function R({value:e,onChange:t,isActive:n=!0,onHistoryControlsChange:r}){let i=oe({value:e,onChange:t}),o=te({value:e,onChange:i.change}),s=F({editing:o}),{mode:l,selectedMachineIndex:u,previewRef:d,openModel:f,openStateMachine:m}=s,h=p.create(o.value),g=(0,z.useRef)(null),_=(0,z.useEffectEvent)(()=>{r?.({undo:i.canUndo?i.undo:void 0,redo:i.canRedo?i.redo:void 0})});(0,z.useEffect)(()=>{n&&_()},[n,e,i.canUndo,i.canRedo]);let v=e=>{let t=()=>{d.current?.querySelector(`[data-decl-name="${CSS.escape(e)}"]`)?.scrollIntoView({block:`nearest`})};t(),requestAnimationFrame(t)},y=e=>{let t=p.caretOfDefinition(h,e);c.isNone(t)||(o.moveCaret(t.value),v(e))},b=e=>{let t=M.atDocumentEnd({source:o.value,name:e});a.isErr(t)||(o.applyEdit(t.value.edit,t.value.caret),v(e))},x=e=>{if(ee.isDefined(e)){y(e.term.name);return}b(e.term.name)},S=e=>{b(e.term.name)},C=e=>{let t=p.rename(h,e);a.isErr(t)||(o.applyEdit(t.value.edit,t.value.caret),v(e.nextName))},T=e=>{let t=o.inputRef.current;if(t===null)return;let n=A.insert(e,{source:o.value,start:t.selectionStart,end:t.selectionEnd});o.applyEditSelecting(n.edit,{start:n.nameStart,end:n.nameEnd,line:n.line})};return(0,B.jsxs)(`div`,{ref:g,className:`model-diagnostics-workspace`,onKeyDownCapture:e=>{if(!e.metaKey&&!e.ctrlKey||e.altKey||e.nativeEvent.isComposing||e.target instanceof HTMLInputElement)return;let t=e.key.toLowerCase();if(t!==`z`&&t!==`y`)return;e.preventDefault();let n=()=>{l===`state-machine`&&requestAnimationFrame(()=>{document.activeElement===document.body&&(g.current?.querySelector(`svg.state-machine-screen__graph`)??g.current?.querySelector(`.state-machine-screen__toolbar select`))?.focus()})};if(t===`y`||e.shiftKey){i.redo(),n();return}i.undo(),n()},children:[(0,B.jsxs)(`nav`,{className:`model-diagnostics-workspace__modes`,"aria-label":`表示モード`,children:[(0,B.jsx)(`button`,{type:`button`,"aria-current":l===`model`?`page`:void 0,onClick:()=>f(),children:`モデル`}),(0,B.jsx)(`button`,{type:`button`,"aria-current":l===`state-machine`?`page`:void 0,onClick:()=>m(),children:`ステートマシン`})]}),l===`state-machine`?(0,B.jsxs)(w.Root,{value:e,onChange:i.change,initialMachineIndex:u,onMachineSelected:s.selectMachine,onEditSource:f,children:[(0,B.jsx)(w.Palette,{}),(0,B.jsx)(w.Graph,{}),(0,B.jsx)(w.Inspector,{})]}):(0,B.jsxs)(`div`,{className:`model-diagnostics`,children:[(0,B.jsx)(`div`,{className:`model-diagnostics__editor-heading`,children:`モデル定義`}),(0,B.jsxs)(`div`,{className:`model-diagnostics__toolbar`,role:`toolbar`,"aria-label":`編集支援`,children:[(0,B.jsx)(`span`,{className:`model-diagnostics__preview-heading`,children:`プレビュー`}),(0,B.jsxs)(`div`,{className:`model-diagnostics__actions`,children:[(0,B.jsx)(`button`,{type:`button`,className:`model-diagnostics__toolbar-button`,onClick:()=>T(A.data()),children:`＋ data`}),(0,B.jsx)(`button`,{type:`button`,className:`model-diagnostics__toolbar-button`,onClick:()=>T(A.workflow()),children:`＋ workflow`})]})]}),(0,B.jsx)(`section`,{className:`model-diagnostics__editor`,"aria-label":`テキストエディタ`,children:(0,B.jsx)(ne,{editing:o})}),(0,B.jsx)(`section`,{ref:d,className:`model-diagnostics__preview`,"aria-label":`構造化プレビュー`,children:h.document.declarations.map(e=>(0,B.jsx)(ue,{decl:e,analyzed:h,onTypeRefClick:x,onUndefinedBadgeClick:S,onRename:C,onOpenStateMachine:e=>m(e)},V(e)))})]})]})}function ue({decl:e,analyzed:t,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:a,onOpenStateMachine:o}){if(i.isError(e))return(0,B.jsx)(b,{decl:e,diagnostics:t.diagnostics});if(i.isStateMachine(e)){let n=p.stateMachineIndex(t,e);return(0,B.jsxs)(`article`,{className:`model-diagnostics__machine-card`,"data-decl-name":e.name,children:[(0,B.jsxs)(`strong`,{children:[`state-machine `,e.name]}),(0,B.jsx)(`button`,{type:`button`,disabled:c.isNone(n),onClick:()=>{c.isNone(n)||o(n.value)},children:`ステートマシンで開く`})]})}let s=t=>{a({decl:e,nextName:t})};return i.isData(e)?(0,B.jsx)(v,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:s}):(0,B.jsx)(S,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:s})}var z,B,V,H=t((()=>{z=e(n(),1),s(),d(),u(),re(),m(),ie(),h(),se(),ce(),g(),_(),y(),x(),C(),le(),B=r(),V=e=>`${e.kind}-${e.range.startLine}-${e.range.startColumn}-${e.range.endLine}-${e.range.endColumn}`}));function de({value:e}){let[t,n]=(0,U.useState)(e);return(0,W.jsx)(`div`,{className:`model-diagnostics-story`,children:(0,W.jsx)(R,{value:t,onChange:n})})}var U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{U=e(n(),1),H(),W=r(),G={component:R,title:`Model/ModelDiagnostics`,render:e=>(0,W.jsx)(de,{value:e.value}),argTypes:{onChange:{control:!1}}},K={args:{value:`data 注文ID = string

data 数量 = int constrained 10..1

data 注文 = 未検証の注文 OR 検証済みの注文

workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント
  error: 検証エラー
`}},q={args:{value:`data 注文ID = string
data 注文 =
  注文ID
  AND 顧客情報

workflow 通知する =
  input: string
  output: string
`}},J={args:{value:`data =
ゴミ行
data 注文 = 未定義型
`}},Y={args:{value:``}},X={args:{value:`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 処理中
  state: 完了 terminal
  transition: 待機 -> 処理中 on 開始
  transition: 処理中 -> 完了 on 確定
`},play:async({canvasElement:e})=>{[...e.querySelectorAll(`nav button`)].find(e=>e.textContent===`ステートマシン`)?.click(),await new Promise(e=>setTimeout(e,0)),e.querySelector(`.state-machine-screen__node[aria-label^="待機"]`)?.dispatchEvent(new MouseEvent(`click`,{bubbles:!0}))}},Z={args:X.args,play:async({canvasElement:e})=>{[...e.querySelectorAll(`nav button`)].find(e=>e.textContent===`ステートマシン`)?.click(),await new Promise(e=>setTimeout(e,0)),e.querySelector(`.state-machine-screen__edge`)?.dispatchEvent(new MouseEvent(`click`,{bubbles:!0}))}},Q={args:X.args,play:async({canvasElement:e})=>{[...e.querySelectorAll(`nav button`)].find(e=>e.textContent===`ステートマシン`)?.click(),await new Promise(e=>setTimeout(e,0)),e.querySelector(`.state-machine-screen__node[aria-label^="待機"]`)?.dispatchEvent(new MouseEvent(`click`,{bubbles:!0})),await new Promise(e=>setTimeout(e,0));let t=e.querySelector(`input[aria-label="状態名"]`);t!==null&&(Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,`value`)?.set?.call(t,`保留`),t.dispatchEvent(new Event(`input`,{bubbles:!0})),await new Promise(e=>setTimeout(e,0)),t.form?.requestSubmit())}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data =
ゴミ行
data 注文 = 未定義型
\`
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    value: ""
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 処理中
  state: 完了 terminal
  transition: 待機 -> 処理中 on 開始
  transition: 処理中 -> 完了 on 確定
\`
  },
  play: async ({
    canvasElement
  }) => {
    const mode = [...canvasElement.querySelectorAll<HTMLButtonElement>("nav button")].find(button => button.textContent === "ステートマシン");
    mode?.click();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    canvasElement.querySelector('.state-machine-screen__node[aria-label^="待機"]')?.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  args: StateMachineEditing.args,
  play: async ({
    canvasElement
  }) => {
    const mode = [...canvasElement.querySelectorAll<HTMLButtonElement>("nav button")].find(button => button.textContent === "ステートマシン");
    mode?.click();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    canvasElement.querySelector(".state-machine-screen__edge")?.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  args: StateMachineEditing.args,
  play: async ({
    canvasElement
  }) => {
    const mode = [...canvasElement.querySelectorAll<HTMLButtonElement>("nav button")].find(button => button.textContent === "ステートマシン");
    mode?.click();
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    canvasElement.querySelector('.state-machine-screen__node[aria-label^="待機"]')?.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const name = canvasElement.querySelector<HTMLInputElement>('input[aria-label="状態名"]');
    if (name === null) {
      return;
    }
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(name, "保留");
    name.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    name.form?.requestSubmit();
  }
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`AllProps`,`EdgeCases`,`Empty`,`StateMachineEditing`,`StateMachineTransitionEditing`,`StateMachineAfterEdit`]}))();export{q as AllProps,K as Default,J as EdgeCases,Y as Empty,Q as StateMachineAfterEdit,X as StateMachineEditing,Z as StateMachineTransitionEditing,$ as __namedExportsOrder,G as default};