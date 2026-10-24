import{a as e,n as t}from"./chunk-BneVvdWh.js";import{n,t as r}from"./preload-helper-CV6hqhE5.js";import{t as i}from"./iframe-BJYWlwgI.js";import{t as a}from"./jsx-runtime-DXFqSddf.js";import{f as o,r as s,t as c,u as l}from"./src-Ci4-bCnI.js";import{a as u,i as d,n as f,o as p,r as m,t as h}from"./analyzed-model-BPhk-lk-.js";import{n as g,t as _}from"./dependency-view-BkiAC2_H.js";import{i as v,r as ee}from"./decl-name-ByXi6G4Q.js";import{a as te,i as y,n as ne,r as b}from"./model-editor-DtNtXOAc.js";import{n as x,t as S}from"./preview-data-card-CU6P8TCX.js";import{n as C,t as w}from"./preview-error-placeholder-CEKSAWqF.js";import{n as T,t as re}from"./preview-workflow-card-DC0RbmxY.js";import{n as ie,t as E}from"./state-machine-screen-DSW60sMq.js";var D,O,k,A,j,M,ae=t((()=>{d(),D={data:`data`,workflow:`workflow`},O=`名前`,k=(e,t)=>{let n=t.indexOf(O);return{kind:e,source:t,nameStart:n,nameEnd:n+2}},A=e=>e===void 0||e===`
`||e===`\r`,j=e=>e===void 0||e===`
`||e===`\r`,M={data(){return k(D.data,`data ${O} = string`)},workflow(){return k(D.workflow,`workflow ${O} =\n  input: string\n  output: string`)},insert(e,t){let n=t.start===0?void 0:t.source[t.start-1],r=t.end===t.source.length?void 0:t.source[t.end],i=A(n)?``:`
`,a=j(r)?``:`
`,o=`${i}${e.source}${a}`,s=t.start+i.length+e.nameStart,c=t.start+i.length+e.nameEnd,l=`${t.source.slice(0,t.start)}${o}${t.source.slice(t.end)}`;return{edit:{start:t.start,end:t.end,replacement:o},nameStart:s,nameEnd:c,line:m.atOffset(l,s).line}}}})),N,oe,se=t((()=>{c(),d(),N=e=>e.endsWith(`
`)||e.endsWith(`\r`),oe={atDocumentEnd(e){let t=s.generate(e.name);if(l.isErr(t))return t;let n=e.source.length>0&&!N(e.source)?`
`:``,r=`${n}${t.value}`,i=`${e.source}${r}`,a=e.source.length+n.length;return l.ok({edit:{start:e.source.length,end:e.source.length,replacement:r},caret:m.atOffset(i,a)})}}})),P,ce=t((()=>{P={create(e){return{current:e,past:[],future:[]}},record(e,t){return e.current===t?e:{current:t,past:[...e.past,e.current],future:[]}},undo(e){let t=e.past[e.past.length-1];return t===void 0?e:{current:t,past:e.past.slice(0,-1),future:[e.current,...e.future]}},redo(e){let t=e.future[0];return t===void 0?e:{current:t,past:[...e.past,e.current],future:e.future.slice(1)}}}}));function le({value:e,onChange:t}){let[n,r]=(0,F.useState)(()=>P.create(e));n.current!==e&&r(P.create(e));let i=n.current===e?n:P.create(e);return{change:n=>{n!==e&&(r(P.record(i,n)),t(n))},undo:()=>{let e=P.undo(i);e!==i&&(r(e),t(e.current))},redo:()=>{let e=P.redo(i);e!==i&&(r(e),t(e.current))},canUndo:i.past.length>0,canRedo:i.future.length>0}}var F,ue=t((()=>{F=e(i(),1),ce()}));function de({editing:e}){let[t,n]=(0,I.useReducer)(L,{mode:`model`,modelView:`definition`,selectedMachineIndex:0}),r=(0,I.useRef)(null),i=(0,I.useRef)({editorTop:0,editorLeft:0,previewTop:0}),a=(0,I.useRef)(!1),o=(0,I.useRef)(null),s=()=>{if(t.mode===`model`&&t.modelView===`definition`){let t=e.inputRef.current;e.rememberCurrentSelection(),i.current={editorTop:t?.scrollTop??0,editorLeft:t?.scrollLeft??0,previewTop:r.current?.scrollTop??0},a.current=!0}},c=e=>{s(),n({type:`stateMachineOpened`,index:e})},l=r=>{if(r!==void 0&&t.mode===`model`&&t.modelView===`definition`){e.selectRange(r);return}o.current=r??null,n({type:`definitionOpened`})},u=()=>{s(),n({type:`dependencyOpened`})},d=(0,I.useEffectEvent)(()=>{if(!a.current)return;let t=e.inputRef.current;if(t===null)return;r.current!==null&&(r.current.scrollTop=i.current.previewTop);let n=o.current;if(o.current=null,n!==null){e.selectRange(n);return}e.restoreSelection(),t.scrollTop=i.current.editorTop,t.scrollLeft=i.current.editorLeft,t.dispatchEvent(new Event(`scroll`,{bubbles:!0}))});return(0,I.useLayoutEffect)(()=>{t.mode===`model`&&t.modelView===`definition`&&d()},[t.mode,t.modelView]),{mode:t.mode,modelView:t.modelView,selectedMachineIndex:t.selectedMachineIndex,previewRef:r,openModel:l,openModelMode:()=>n({type:`modelOpened`}),openDependency:u,openStateMachine:c,selectMachine:e=>n({type:`machineSelected`,index:e})}}var I,L,fe=t((()=>{I=e(i(),1),L=(e,t)=>{switch(t.type){case`modelOpened`:return{...e,mode:`model`};case`definitionOpened`:return{...e,mode:`model`,modelView:`definition`};case`dependencyOpened`:return{...e,mode:`model`,modelView:`dependency`};case`stateMachineOpened`:return{...e,mode:`state-machine`,selectedMachineIndex:t.index??e.selectedMachineIndex};case`machineSelected`:return{...e,selectedMachineIndex:t.index}}}})),pe=t((()=>{}));function R({value:e,onChange:t,isActive:n=!0,onHistoryControlsChange:r}){let i=le({value:e,onChange:t}),a=te({value:e,onChange:i.change}),o=de({editing:a}),{mode:s,selectedMachineIndex:c,previewRef:d,openModel:f,openStateMachine:p}=o,m=(0,z.useMemo)(()=>h.create(a.value),[a.value]),g=(0,z.useRef)(null),v=(0,z.useEffectEvent)(()=>{r?.({undo:i.canUndo?i.undo:void 0,redo:i.canRedo?i.redo:void 0})});(0,z.useEffect)(()=>{n&&v()},[n,e,i.canUndo,i.canRedo]);let y=e=>{let t=()=>{d.current?.querySelector(`[data-decl-name="${CSS.escape(e)}"]`)?.scrollIntoView({block:`nearest`})};t(),requestAnimationFrame(t)},b=e=>{let t=h.caretOfDefinition(m,e);u.isNone(t)||(a.moveCaret(t.value),y(e))},x=e=>{let t=oe.atDocumentEnd({source:a.value,name:e});l.isErr(t)||(a.applyEdit(t.value.edit,t.value.caret),y(e))},S=e=>{if(ee.isDefined(e)){b(e.term.name);return}x(e.term.name)},C=e=>{x(e.term.name)},w=e=>{let t=h.rename(m,e);l.isErr(t)||(a.applyEdit(t.value.edit,t.value.caret),y(e.nextName))},T=e=>{let t=a.inputRef.current;if(t===null)return;let n=M.insert(e,{source:a.value,start:t.selectionStart,end:t.selectionEnd});a.applyEditSelecting(n.edit,{start:n.nameStart,end:n.nameEnd,line:n.line})};return(0,B.jsxs)(`div`,{ref:g,className:`model-diagnostics-workspace`,onKeyDownCapture:e=>{if(!e.metaKey&&!e.ctrlKey||e.altKey||e.nativeEvent.isComposing||e.target instanceof HTMLInputElement)return;let t=e.key.toLowerCase();if(t!==`z`&&t!==`y`)return;e.preventDefault();let n=()=>{s===`state-machine`&&requestAnimationFrame(()=>{document.activeElement===document.body&&(g.current?.querySelector(`svg.state-machine-screen__graph`)??g.current?.querySelector(`.state-machine-screen__toolbar select`))?.focus()})};if(t===`y`||e.shiftKey){i.redo(),n();return}i.undo(),n()},children:[(0,B.jsxs)(`nav`,{className:`model-diagnostics-workspace__modes`,"aria-label":`表示モード`,children:[(0,B.jsx)(`button`,{type:`button`,"aria-current":s===`model`?`page`:void 0,onClick:o.openModelMode,children:`モデル`}),(0,B.jsx)(`button`,{type:`button`,"aria-current":s===`state-machine`?`page`:void 0,onClick:()=>p(),children:`ステートマシン`})]}),s===`model`&&(0,B.jsxs)(`nav`,{className:`model-diagnostics-workspace__modes`,"aria-label":`モデルの表示`,children:[(0,B.jsx)(`button`,{type:`button`,"aria-current":o.modelView===`definition`?`page`:void 0,onClick:()=>f(),children:`定義＋プレビュー`}),(0,B.jsx)(`button`,{type:`button`,"aria-current":o.modelView===`dependency`?`page`:void 0,onClick:o.openDependency,children:`依存図`})]}),(0,B.jsxs)(_.Root,{analyzed:m,onEditSource:f,isVisible:s===`model`&&o.modelView===`dependency`,children:[(0,B.jsx)(_.Legend,{}),(0,B.jsx)(_.Toolbar,{}),(0,B.jsx)(_.Graph,{}),(0,B.jsx)(_.Inspector,{}),(0,B.jsx)(_.Diagnostics,{})]}),s===`state-machine`?(0,B.jsxs)(E.Root,{value:e,onChange:i.change,initialMachineIndex:c,onMachineSelected:o.selectMachine,onEditSource:f,children:[(0,B.jsx)(E.Palette,{}),(0,B.jsx)(E.Graph,{}),(0,B.jsx)(E.Inspector,{})]}):(0,B.jsx)(B.Fragment,{children:o.modelView===`definition`&&(0,B.jsxs)(`div`,{className:`model-diagnostics`,children:[(0,B.jsx)(`div`,{className:`model-diagnostics__editor-heading`,children:`モデル定義`}),(0,B.jsxs)(`div`,{className:`model-diagnostics__toolbar`,role:`toolbar`,"aria-label":`編集支援`,children:[(0,B.jsx)(`span`,{className:`model-diagnostics__preview-heading`,children:`プレビュー`}),(0,B.jsxs)(`div`,{className:`model-diagnostics__actions`,children:[(0,B.jsx)(`button`,{type:`button`,className:`model-diagnostics__toolbar-button`,onClick:()=>T(M.data()),children:`＋ data`}),(0,B.jsx)(`button`,{type:`button`,className:`model-diagnostics__toolbar-button`,onClick:()=>T(M.workflow()),children:`＋ workflow`})]})]}),(0,B.jsx)(`section`,{className:`model-diagnostics__editor`,"aria-label":`テキストエディタ`,children:(0,B.jsx)(ne,{editing:a})}),(0,B.jsx)(`section`,{ref:d,className:`model-diagnostics__preview`,"aria-label":`構造化プレビュー`,children:m.document.declarations.map(e=>(0,B.jsx)(me,{decl:e,analyzed:m,onTypeRefClick:S,onUndefinedBadgeClick:C,onRename:w,onOpenStateMachine:e=>p(e)},V(e)))})]})})]})}function me({decl:e,analyzed:t,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:i,onOpenStateMachine:a}){if(o.isError(e))return(0,B.jsx)(w,{decl:e,diagnostics:t.diagnostics});if(o.isStateMachine(e)){let n=h.stateMachineIndex(t,e);return(0,B.jsxs)(`article`,{className:`model-diagnostics__machine-card`,"data-decl-name":e.name,children:[(0,B.jsxs)(`strong`,{children:[`state-machine `,e.name]}),(0,B.jsx)(`button`,{type:`button`,disabled:u.isNone(n),onClick:()=>{u.isNone(n)||a(n.value)},children:`ステートマシンで開く`})]})}let s=t=>{i({decl:e,nextName:t})};return o.isData(e)?(0,B.jsx)(S,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:s}):(0,B.jsx)(re,{decl:e,undefinedTypeNames:t.undefinedTypeNames,onTypeRefClick:n,onUndefinedBadgeClick:r,onRename:s})}var z,B,V,he=t((()=>{z=e(i(),1),c(),p(),f(),ae(),v(),se(),y(),ue(),fe(),b(),x(),C(),T(),ie(),g(),pe(),B=a(),V=e=>`${e.kind}-${e.range.startLine}-${e.range.startColumn}-${e.range.endLine}-${e.range.endColumn}`}));function ge({value:e}){let[t,n]=(0,H.useState)(e);return(0,U.jsx)(`div`,{className:`model-diagnostics-story`,children:(0,U.jsx)(R,{value:t,onChange:n})})}var H,U,W,G,K,q,J,Y,X,Z,Q,$,_e;t((()=>{H=e(i(),1),he(),U=a(),n(),W={component:R,title:`Model/ModelDiagnostics`,render:e=>(0,U.jsx)(ge,{value:e.value}),argTypes:{onChange:{control:!1}}},G={args:{value:`data 注文ID = string

data 数量 = int constrained 10..1

data 注文 = 未検証の注文 OR 検証済みの注文

workflow 注文を確定する =
  input: 未検証の注文
  output: 確定イベント
  error: 検証エラー
`}},K={args:{value:`data 注文ID = string
data 注文 =
  注文ID
  AND 顧客情報

workflow 通知する =
  input: string
  output: string
`}},q={args:{value:`data =
ゴミ行
data 注文 = 未定義型
`}},J={args:{value:``}},Y={args:{value:`data 注文 = 商品
data 商品 = string
data 独立 = int
state-machine 注文処理 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
`}},X={args:{value:`state-machine 注文 =
  initial: 待機
  state: 待機
  state: 処理中
  state: 完了 terminal
  transition: 待機 -> 処理中 on 開始
  transition: 処理中 -> 完了 on 確定
`},play:async({canvasElement:e})=>{[...e.querySelectorAll(`nav button`)].find(e=>e.textContent===`ステートマシン`)?.click(),await new Promise(e=>setTimeout(e,0)),e.querySelector(`.state-machine-screen__node[aria-label^="待機"]`)?.dispatchEvent(new MouseEvent(`click`,{bubbles:!0}))}},Z={args:X.args,play:async({canvasElement:e})=>{[...e.querySelectorAll(`nav button`)].find(e=>e.textContent===`ステートマシン`)?.click(),await new Promise(e=>setTimeout(e,0)),e.querySelector(`.state-machine-screen__edge`)?.dispatchEvent(new MouseEvent(`click`,{bubbles:!0}))}},Q={args:X.args,play:async({canvasElement:e})=>{[...e.querySelectorAll(`nav button`)].find(e=>e.textContent===`ステートマシン`)?.click(),await new Promise(e=>setTimeout(e,0)),e.querySelector(`.state-machine-screen__node[aria-label^="待機"]`)?.dispatchEvent(new MouseEvent(`click`,{bubbles:!0})),await new Promise(e=>setTimeout(e,0));let t=e.querySelector(`input[aria-label="状態名"]`);t!==null&&(Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,`value`)?.set?.call(t,`保留`),t.dispatchEvent(new Event(`input`,{bubbles:!0})),await new Promise(e=>setTimeout(e,0)),t.form?.requestSubmit())}},$={args:{value:`data 注文 = 商品
data 商品 = string
data 独立 = int
`},play:async({canvasElement:e})=>{let{expect:t,userEvent:n,within:i}=await r(async()=>{let{expect:e,userEvent:t,within:n}=await import(__STORYBOOK_MODULE_TEST__);return{expect:e,userEvent:t,within:n}},[],import.meta.url),a=i(e),o=a.getByRole(`button`,{name:/^依存図$/});o.focus(),await n.keyboard(`{Enter}`),await a.findByRole(`button`,{name:`注文 ALIAS`});for(let e=0;e<6;e+=1)await n.tab();await t(a.getByRole(`button`,{name:`注文 ALIAS`})).toHaveFocus(),await n.keyboard(`{Enter}`);for(let e=0;e<5;e+=1)await n.tab({shift:!0});await t(a.getByRole(`button`,{name:`関連のみ`})).toHaveFocus(),await n.keyboard(` `),await t(e.querySelectorAll(`[data-node-id]`)).toHaveLength(2);for(let e=0;e<6;e+=1)await n.tab();await t(a.getByRole(`button`,{name:`商品 ALIAS`})).toHaveFocus(),await n.keyboard(` `),await t(a.getByRole(`button`,{name:`商品 ALIAS`})).toHaveAttribute(`aria-pressed`,`true`);for(let e=0;e<3;e+=1)await n.tab();await t(a.getByRole(`button`,{name:`定義を編集`})).toHaveFocus(),await n.keyboard(`{Enter}`),await t(a.getByRole(`textbox`)).toHaveFocus();let s=e.querySelector(`textarea`);await t(s.value.slice(s.selectionStart,s.selectionEnd)).toBe(`data 商品 = string`);for(let e=0;e<3;e+=1)await n.tab({shift:!0});await t(o).toHaveFocus(),await n.keyboard(`{Enter}`),await t(await a.findByRole(`button`,{name:`商品 ALIAS`})).toHaveAttribute(`aria-pressed`,`true`)}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
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
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data =
ゴミ行
data 注文 = 未定義型
\`
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    value: ""
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    value: \`data 注文 = 商品
data 商品 = string
data 独立 = int
state-machine 注文処理 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
\`
  }
}`,...Y.parameters?.docs?.source},description:{story:`本文編集・図の選択・表示モード往復・履歴の同期を確認する。`,...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  args: {
    value: "data 注文 = 商品\\ndata 商品 = string\\ndata 独立 = int\\n"
  },
  play: async ({
    canvasElement
  }) => {
    const {
      expect,
      userEvent,
      within
    } = await import("storybook/test");
    const canvas = within(canvasElement);
    const diagramButton = canvas.getByRole("button", {
      name: /^依存図$/
    });
    diagramButton.focus();
    await userEvent.keyboard("{Enter}");
    await canvas.findByRole("button", {
      name: "注文 ALIAS"
    });

    // 未選択の「関連のみ」はTab順に含まれない。
    for (let step = 0; step < 6; step += 1) {
      await userEvent.tab();
    }
    await expect(canvas.getByRole("button", {
      name: "注文 ALIAS"
    })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    for (let step = 0; step < 5; step += 1) {
      await userEvent.tab({
        shift: true
      });
    }
    await expect(canvas.getByRole("button", {
      name: "関連のみ"
    })).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvasElement.querySelectorAll("[data-node-id]")).toHaveLength(2);
    for (let step = 0; step < 6; step += 1) {
      await userEvent.tab();
    }
    await expect(canvas.getByRole("button", {
      name: "商品 ALIAS"
    })).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByRole("button", {
      name: "商品 ALIAS"
    })).toHaveAttribute("aria-pressed", "true");
    for (let step = 0; step < 3; step += 1) {
      await userEvent.tab();
    }
    await expect(canvas.getByRole("button", {
      name: "定義を編集"
    })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const editor = canvas.getByRole("textbox");
    await expect(editor).toHaveFocus();
    const input = canvasElement.querySelector("textarea")!;
    await expect(input.value.slice(input.selectionStart, input.selectionEnd)).toBe("data 商品 = string");

    // エディタの前にある雛形挿入ボタン2個もTab順で通過する。
    for (let step = 0; step < 3; step += 1) {
      await userEvent.tab({
        shift: true
      });
    }
    await expect(diagramButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByRole("button", {
      name: "商品 ALIAS"
    })).toHaveAttribute("aria-pressed", "true");
  }
}`,...$.parameters?.docs?.source},description:{story:`UI-07: 最初のフォーカス以降はTab・Enter・Spaceだけで図と定義を往復する。`,...$.parameters?.docs?.description}}},_e=[`Default`,`AllProps`,`EdgeCases`,`Empty`,`DependencySynchronization`,`StateMachineEditing`,`StateMachineTransitionEditing`,`StateMachineAfterEdit`,`DependencyKeyboard`]}))();export{K as AllProps,G as Default,$ as DependencyKeyboard,Y as DependencySynchronization,q as EdgeCases,J as Empty,Q as StateMachineAfterEdit,X as StateMachineEditing,Z as StateMachineTransitionEditing,_e as __namedExportsOrder,W as default};