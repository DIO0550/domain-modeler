import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-DUWZN8-i.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{f as i,r as a,t as o,u as s}from"./src-B7ErLPOH.js";import{a as c,i as l,n as u,o as d,r as f,t as p}from"./analyzed-model-cBcx9bky.js";import{n as m,t as h}from"./dependency-view-D3suI7ab.js";import{i as g,r as ee}from"./decl-name-8WJQMHmg.js";import{a as te,i as _,n as ne,r as v}from"./model-editor-DDyiWSaG.js";import{n as y,t as b}from"./preview-data-card-DY6hHdPl.js";import{n as x,t as S}from"./preview-error-placeholder-DQRFGrKv.js";import{n as C,t as w}from"./preview-workflow-card-Dn85zHY_.js";import{n as T,t as E}from"./state-machine-screen-CnVd2h6-.js";var D,O,k,A,j,M,re=t((()=>{l(),D={data:`data`,workflow:`workflow`},O=`名前`,k=(e,t)=>{let n=t.indexOf(O);return{kind:e,source:t,nameStart:n,nameEnd:n+2}},A=e=>e===void 0||e===`
`||e===`\r`,j=e=>e===void 0||e===`
`||e===`\r`,M={data(){return k(D.data,`data ${O} = string`)},workflow(){return k(D.workflow,`workflow ${O} =\n  input: string\n  output: string`)},insert(e,t){let n=t.start===0?void 0:t.source[t.start-1],r=t.end===t.source.length?void 0:t.source[t.end],i=A(n)?``:`
`,a=j(r)?``:`
`,o=`${i}${e.source}${a}`,s=t.start+i.length+e.nameStart,c=t.start+i.length+e.nameEnd,l=`${t.source.slice(0,t.start)}${o}${t.source.slice(t.end)}`;return{edit:{start:t.start,end:t.end,replacement:o},nameStart:s,nameEnd:c,line:f.atOffset(l,s).line}}}})),N,P,ie=t((()=>{o(),l(),N=e=>e.endsWith(`
`)||e.endsWith(`\r`),P={atDocumentEnd(e){let t=a.generate(e.name);if(s.isErr(t))return t;let n=e.source.length>0&&!N(e.source)?`
`:``,r=`${n}${t.value}`,i=`${e.source}${r}`,o=e.source.length+n.length;return s.ok({edit:{start:e.source.length,end:e.source.length,replacement:r},caret:f.atOffset(i,o)})}}})),F,ae=t((()=>{F={create(e){return{current:e,past:[],future:[]}},record(e,t){return e.current===t?e:{current:t,past:[...e.past,e.current],future:[]}},undo(e){let t=e.past[e.past.length-1];return t===void 0?e:{current:t,past:e.past.slice(0,-1),future:[e.current,...e.future]}},redo(e){let t=e.future[0];return t===void 0?e:{current:t,past:[...e.past,e.current],future:e.future.slice(1)}}}}));function oe({value:e,onChange:t}){let[n,r]=(0,I.useState)(()=>F.create(e));n.current!==e&&r(F.create(e));let i=n.current===e?n:F.create(e);return{change:n=>{n!==e&&(r(F.record(i,n)),t(n))},undo:()=>{let e=F.undo(i);e!==i&&(r(e),t(e.current))},redo:()=>{let e=F.redo(i);e!==i&&(r(e),t(e.current))},canUndo:i.past.length>0,canRedo:i.future.length>0}}var I,se=t((()=>{I=e(n(),1),ae()}));function ce({editing:e}){let[t,n]=(0,L.useReducer)(R,{mode:`model`,modelView:`definition`,selectedMachineIndex:0}),r=(0,L.useRef)(null),i=(0,L.useRef)({editorTop:0,editorLeft:0,previewTop:0}),a=(0,L.useRef)(!1),o=(0,L.useRef)(null),s=()=>{if(t.mode===`model`&&t.modelView===`definition`){let t=e.inputRef.current;e.rememberCurrentSelection(),i.current={editorTop:t?.scrollTop??0,editorLeft:t?.scrollLeft??0,previewTop:r.current?.scrollTop??0},a.current=!0}},c=e=>{s(),n({type:`stateMachineOpened`,index:e})},l=r=>{if(r!==void 0&&t.mode===`model`&&t.modelView===`definition`){e.selectRange(r);return}o.current=r??null,n({type:`definitionOpened`})},u=()=>{s(),n({type:`dependencyOpened`})},d=(0,L.useEffectEvent)(()=>{if(!a.current)return;let t=e.inputRef.current;if(t===null)return;r.current!==null&&(r.current.scrollTop=i.current.previewTop);let n=o.current;if(o.current=null,n!==null){e.selectRange(n);return}e.restoreSelection(),t.scrollTop=i.current.editorTop,t.scrollLeft=i.current.editorLeft,t.dispatchEvent(new Event(`scroll`,{bubbles:!0}))});return(0,L.useLayoutEffect)(()=>{t.mode===`model`&&t.modelView===`definition`&&d()},[t.mode,t.modelView]),{mode:t.mode,modelView:t.modelView,selectedMachineIndex:t.selectedMachineIndex,previewRef:r,openModel:l,openModelMode:()=>n({type:`modelOpened`}),openDependency:u,openStateMachine:c,selectMachine:e=>n({type:`machineSelected`,index:e})}}var L,R,le=t((()=>{L=e(n(),1),R=(e,t)=>{switch(t.type){case`modelOpened`:return{...e,mode:`model`};case`definitionOpened`:return{...e,mode:`model`,modelView:`definition`};case`dependencyOpened`:return{...e,mode:`model`,modelView:`dependency`};case`stateMachineOpened`:return{...e,mode:`state-machine`,selectedMachineIndex:t.index??e.selectedMachineIndex};case`machineSelected`:return{...e,selectedMachineIndex:t.index}}}})),ue=t((()=>{}));function z({value:e,onChange:t,isActive:n=!0,onHistoryControlsChange:r}){let i=oe({value:e,onChange:t}),a=te({value:e,onChange:i.change}),o=ce({editing:a}),{mode:l,selectedMachineIndex:u,previewRef:d,openModel:f,openStateMachine:m}=o,g=(0,B.useMemo)(()=>p.create(a.value),[a.value]),_=(0,B.useRef)(null),v=(0,B.useEffectEvent)(()=>{r?.({undo:i.canUndo?i.undo:void 0,redo:i.canRedo?i.redo:void 0})});(0,B.useEffect)(()=>{n&&v()},[n,e,i.canUndo,i.canRedo]);let y=e=>{let t=()=>{d.current?.querySelector(`[data-decl-name="${CSS.escape(e)}"]`)?.scrollIntoView({block:`nearest`})};t(),requestAnimationFrame(t)},b=e=>{let t=p.caretOfDefinition(g,e);c.isNone(t)||(a.moveCaret(t.value),y(e))},x=e=>{let t=P.atDocumentEnd({source:a.value,name:e});s.isErr(t)||(a.applyEdit(t.value.edit,t.value.caret),y(e))},S=e=>{if(ee.isDefined(e)){b(e.term.name);return}x(e.term.name)},C=e=>{x(e.term.name)},w=e=>{let t=p.rename(g,e);s.isErr(t)||(a.applyEdit(t.value.edit,t.value.caret),y(e.nextName))},T=e=>{let t=a.inputRef.current;if(t===null)return;let n=M.insert(e,{source:a.value,start:t.selectionStart,end:t.selectionEnd});a.applyEditSelecting(n.edit,{start:n.nameStart,end:n.nameEnd,line:n.line})};return(0,V.jsxs)(`div`,{ref:_,className:`model-diagnostics-workspace`,onKeyDownCapture:e=>{if(!e.metaKey&&!e.ctrlKey||e.altKey||e.nativeEvent.isComposing||e.target instanceof HTMLInputElement)return;let t=e.key.toLowerCase();if(t!==`z`&&t!==`y`)return;e.preventDefault();let n=()=>{l===`state-machine`&&requestAnimationFrame(()=>{document.activeElement===document.body&&(_.current?.querySelector(`svg.state-machine-screen__graph`)??_.current?.querySelector(`.state-machine-screen__toolbar select`))?.focus()})};if(t===`y`||e.shiftKey){i.redo(),n();return}i.undo(),n()},children:[(0,V.jsxs)(`nav`,{className:`model-diagnostics-workspace__modes`,"aria-label":`表示モード`,children:[(0,V.jsx)(`button`,{type:`button`,"aria-current":l===`model`?`page`:void 0,onClick:o.openModelMode,children:`モデル`}),(0,V.jsx)(`button`,{type:`button`,"aria-current":l===`state-machine`?`page`:void 0,onClick:()=>m(),children:`ステートマシン`})]}),l===`model`&&(0,V.jsxs)(`nav`,{className:`model-diagnostics-workspace__modes`,"aria-label":`モデルの表示`,children:[(0,V.jsx)(`button`,{type:`button`,"aria-current":o.modelView===`definition`?`page`:void 0,onClick:()=>f(),children:`定義＋プレビュー`}),(0,V.jsx)(`button`,{type:`button`,"aria-current":o.modelView===`dependency`?`page`:void 0,onClick:o.openDependency,children:`依存図`})]}),l===`state-machine`?(0,V.jsxs)(E.Root,{value:e,onChange:i.change,initialMachineIndex:u,onMachineSelected:o.selectMachine,onEditSource:f,children:[(0,V.jsx)(E.Palette,{}),(0,V.jsx)(E.Graph,{}),(0,V.jsx)(E.Inspector,{})]}):(0,V.jsxs)(V.Fragment,{children:[o.modelView===`dependency`&&(0,V.jsxs)(h.Root,{analyzed:g,onEditSource:f,children:[(0,V.jsx)(h.Legend,{}),(0,V.jsx)(h.Graph,{}),(0,V.jsx)(h.Inspector,{}),(0,V.jsx)(h.Diagnostics,{})]}),o.modelView===`definition`&&(0,V.jsxs)(`div`,{className:`model-diagnostics`,children:[(0,V.jsx)(`div`,{className:`model-diagnostics__editor-heading`,children:`モデル定義`}),(0,V.jsxs)(`div`,{className:`model-diagnostics__toolbar`,role:`toolbar`,"aria-label":`編集支援`,children:[(0,V.jsx)(`span`,{className:`model-diagnostics__preview-heading`,children:`プレビュー`}),(0,V.jsxs)(`div`,{className:`model-diagnostics__actions`,children:[(0,V.jsx)(`button`,{type:`button`,className:`model-diagnostics__toolbar-button`,onClick:()=>T(M.data()),children:`＋ data`}),(0,V.jsx)(`button`,{type:`button`,className:`model-diagnostics__toolbar-button`,onClick:()=>T(M.workflow()),children:`＋ workflow`})]})]}),(0,V.jsx)(`section`,{className:`model-diagnostics__editor`,"aria-label":`テキストエディタ`,children:(0,V.jsx)(ne,{editing:a})}),(0,V.jsx)(`section`,{ref:d,className:`model-diagnostics__preview`,"aria-label":`構造化プレビュー`,children:g.document.declarations.map(e=>(0,V.jsx)(de,{decl:e,analyzed:g,onTypeRefClick:S,onUndefinedBadgeClick:C,onRename:w,onOpenStateMachine:e=>m(e)},H(e)))})]})]})]})}function de({decl:e,analyzed:t,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:a,onOpenStateMachine:o}){if(i.isError(e))return(0,V.jsx)(S,{decl:e,diagnostics:t.diagnostics});if(i.isStateMachine(e)){let n=p.stateMachineIndex(t,e);return(0,V.jsxs)(`article`,{className:`model-diagnostics__machine-card`,"data-decl-name":e.name,children:[(0,V.jsxs)(`strong`,{children:[`state-machine `,e.name]}),(0,V.jsx)(`button`,{type:`button`,disabled:c.isNone(n),onClick:()=>{c.isNone(n)||o(n.value)},children:`ステートマシンで開く`})]})}let s=t=>{a({decl:e,nextName:t})};return i.isData(e)?(0,V.jsx)(b,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:s}):(0,V.jsx)(w,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:s})}var B,V,H,fe=t((()=>{B=e(n(),1),o(),d(),u(),re(),g(),ie(),_(),se(),le(),v(),y(),x(),C(),T(),m(),ue(),V=r(),H=e=>`${e.kind}-${e.range.startLine}-${e.range.startColumn}-${e.range.endLine}-${e.range.endColumn}`}));function pe({value:e}){let[t,n]=(0,U.useState)(e);return(0,W.jsx)(`div`,{className:`model-diagnostics-story`,children:(0,W.jsx)(z,{value:t,onChange:n})})}var U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{U=e(n(),1),fe(),W=r(),G={component:z,title:`Model/ModelDiagnostics`,render:e=>(0,W.jsx)(pe,{value:e.value}),argTypes:{onChange:{control:!1}}},K={args:{value:`data 注文ID = string

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