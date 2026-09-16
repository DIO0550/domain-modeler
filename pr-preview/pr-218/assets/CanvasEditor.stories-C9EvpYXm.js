import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-B00CgIZW.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{_ as i,a,g as o,l as s,n as c,o as l,r as u,t as d,u as f,v as p,y as m}from"./sticky-oDovV6D0.js";import{a as h,c as g,i as _,n as v,o as y,r as b,s as x,t as S}from"./canvas-view-BSYtv19k.js";import{n as C,t as w}from"./connection-session-Cb-U2xvS.js";import{n as T,t as E}from"./connection-layer-_cm15Dmo.js";var D,O,k=t((()=>{s(),D={undo:`undo`,redo:`redo`,delete:`delete`,copy:`copy`,paste:`paste`,front:`front`,fitAll:`fitAll`,zoomIn:`zoomIn`,zoomOut:`zoomOut`},O={create(e){if(e.isComposing||e.keyCode===229||e.altKey)return m.none();if(!e.ctrlKey&&!e.metaKey)return!e.shiftKey&&(e.key===`Delete`||e.key===`Backspace`)?m.some(D.delete):m.none();switch(e.code){case`Digit0`:return m.some(D.fitAll);case`Equal`:return m.some(D.zoomIn);case`Minus`:return m.some(D.zoomOut);default:break}let t=e.key.toLowerCase();if(t===`z`)return m.some(e.shiftKey?D.redo:D.undo);if(e.shiftKey&&(t===`]`||t===`}`||e.code===`BracketRight`))return m.some(D.front);if(t===`+`||t===`=`)return m.some(D.zoomIn);if(t===`0`)return m.some(D.fitAll);if(t===`-`)return m.some(D.zoomOut);if(e.shiftKey)return m.none();switch(t){case`c`:return m.some(D.copy);case`v`:return m.some(D.paste);default:return m.none()}}}}));function A({saveStatus:e,initialDocument:t,initialHistory:n,onDocumentChange:r,onHistoryChange:i}){let o=h(t,n),s=(0,j.useEffectEvent)(e=>{r?.(e)}),l=(0,j.useEffectEvent)(e=>{i?.(e)});(0,j.useEffect)(()=>{o.session.status===`dragging`||o.session.status===`resizing`||(s(o.document),l(o.history))},[o.document,o.history,o.session.status]);let u=y(o.document.viewport,o.document.stickies,o.changeViewport),f=w.isCreating(o.connectionSession),p=o.connectionSession.status===`selectingSource`||o.connectionSession.status===`selectingTarget`?o.connectionSession.status:`inactive`;return(0,M.jsxs)(S,{onKeyDown:e=>{if(e.defaultPrevented||x.isTextEntry(e.target)||o.session.status===`editing`||o.session.status===`dragging`||o.session.status===`resizing`||o.connectionSession.status===`editing`)return;let t=O.create(e.nativeEvent);t.some&&(e.preventDefault(),{[D.undo]:o.undo,[D.redo]:o.redo,[D.delete]:o.pressDelete,[D.copy]:o.copy,[D.paste]:o.paste,[D.front]:o.bringToFront,[D.fitAll]:u.fitAll,[D.zoomIn]:()=>u.stepZoom(1.2),[D.zoomOut]:()=>u.stepZoom(1/1.2)}[t.value]())},viewport:u.viewport,viewportInteraction:u.surfaceInteraction,saveStatus:e,undo:o.hasUndo?v.enabled(o.undo):v.disabled(),redo:o.hasRedo?v.enabled(o.redo):v.disabled(),selectedType:o.selectedType,onSelectType:o.selectType,onSurfaceClick:e=>{o.clickAt(u.toWorldPoint(e))},onSurfaceDoubleClick:e=>{o.doubleClickAt(u.toWorldPoint(e))},onSurfaceKeyDown:e=>{if(e===`Enter`){o.pressEnter();return}if(e===`Escape`){o.pressEscape();return}o.pressDelete()},connectionTool:{status:p,errorMessage:o.connectionError.some?o.connectionError.value.message:void 0,onToggle:o.toggleConnectionMode},children:[(0,M.jsx)(E,{document:o.document,interaction:{session:o.connectionSession,onSelect:o.selectConnection,onEdit:o.editConnection,onDraftChange:o.changeConnectionDraft,onCommitEdit:o.commitConnectionEdit}}),o.stickies.map(e=>(0,M.jsx)(d,{sticky:e,chrome:c.of(a.chromeOf(o.session,e.id),{onDraftChange:o.changeDraft,onCommit:o.commitEdit}),connectionEndpoint:w.isSource(o.connectionSession,e.id)?`source`:void 0,onActivate:f?void 0:()=>{o.select(e.id)},onKeyActivate:f?()=>{o.selectConnectionEndpoint(e.id)}:void 0,manipulation:f?void 0:{onDragStart:t=>{o.beginDrag(e.id,u.toWorldClientPoint(t))},onResizeStart:(e,t)=>{o.beginResize(e,u.toWorldClientPoint(t))},onPointerMove:e=>{o.movePointer(u.toWorldClientPoint(e))},onPointerCommit:o.commitManipulation,onPointerCancel:o.cancelManipulation}},e.id))]})}var j,M,N=t((()=>{j=e(n(),1),k(),g(),C(),l(),_(),u(),b(),T(),M=r()})),P,F,I,L,R,z,B,V,H,U,W,G;t((()=>{s(),N(),P=r(),{userEvent:F}=__STORYBOOK_MODULE_TEST__,I={component:A,parameters:{layout:`fullscreen`},decorators:[e=>(0,P.jsx)(`div`,{className:`canvas-view-story`,children:(0,P.jsx)(e,{})})]},L={...f.empty(),stickies:[i.create(p.create(`stk_existing000`),o.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},R={...L,stickies:[...L.stickies,i.create(p.create(`stk_command0000`),o.command,`通知する`,{x:280,y:24},{width:160,height:100})]},z=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await F.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},B={args:{saveStatus:`saved`}},V={args:{saveStatus:`saving`,initialDocument:L},play:async({canvas:e})=>{await z(e,{x:40,y:40})}},H={args:{saveStatus:`saved`,initialDocument:L},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await F.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},U={args:{saveStatus:`saved`,initialDocument:R},play:async({canvas:e})=>{await F.click(e.getByRole(`button`,{name:`接続`})),await z(e,{x:48,y:48}),await z(e,{x:304,y:48})}},W={args:{saveStatus:`failed`,initialDocument:{...f.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await F.click(e.getByRole(`button`,{name:`External System`})),await z(e,{x:48,y:48})}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved"
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saving",
    initialDocument: documentWithEvent
  },
  play: async ({
    canvas
  }) => {
    await clickSurfaceAt(canvas, {
      x: 40,
      y: 40
    });
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved",
    initialDocument: documentWithEvent
  },
  play: async ({
    canvas
  }) => {
    const surface = canvas.getByRole("region", {
      name: "キャンバス"
    });
    const rect = surface.getBoundingClientRect();
    await userEvent.pointer({
      keys: "[MouseLeft][MouseLeft]",
      target: surface,
      coords: {
        clientX: rect.left + 40,
        clientY: rect.top + 40
      }
    });
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved",
    initialDocument: documentWithTwoStickies
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "接続"
    }));
    await clickSurfaceAt(canvas, {
      x: 48,
      y: 48
    });
    await clickSurfaceAt(canvas, {
      x: 304,
      y: 48
    });
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "failed",
    initialDocument: {
      ...Document.empty(),
      viewport: {
        x: 0,
        y: 0,
        zoom: 0.1
      }
    }
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "External System"
    }));
    await clickSurfaceAt(canvas, {
      x: 48,
      y: 48
    });
  }
}`,...W.parameters?.docs?.source}}},G=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{V as AllProps,U as CreatingConnection,B as Default,W as EdgeCases,H as Editing,G as __namedExportsOrder,I as default};