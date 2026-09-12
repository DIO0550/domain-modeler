import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{_ as n,a as r,g as i,l as a,n as o,o as s,r as c,t as l,u,v as d,y as f}from"./sticky-CkV99BJi.js";import{a as p,c as m,i as h,n as g,o as _,r as v,s as y,t as b}from"./canvas-view-B06Sb7K4.js";import{n as x,t as S}from"./connection-session-CVzygf0M.js";import{n as C,t as w}from"./connection-layer-BTgy9sF5.js";var T,E,D=e((()=>{a(),T={undo:`undo`,redo:`redo`,delete:`delete`,copy:`copy`,paste:`paste`,front:`front`,fitAll:`fitAll`,zoomIn:`zoomIn`,zoomOut:`zoomOut`},E={create(e){if(e.isComposing||e.keyCode===229||e.altKey)return f.none();if(!e.ctrlKey&&!e.metaKey)return!e.shiftKey&&(e.key===`Delete`||e.key===`Backspace`)?f.some(T.delete):f.none();switch(e.code){case`Digit0`:return f.some(T.fitAll);case`Equal`:return f.some(T.zoomIn);case`Minus`:return f.some(T.zoomOut);default:break}let t=e.key.toLowerCase();if(t===`z`)return f.some(e.shiftKey?T.redo:T.undo);if(e.shiftKey&&(t===`]`||t===`}`||e.code===`BracketRight`))return f.some(T.front);if(t===`+`||t===`=`)return f.some(T.zoomIn);if(t===`0`)return f.some(T.fitAll);if(t===`-`)return f.some(T.zoomOut);if(e.shiftKey)return f.none();switch(t){case`c`:return f.some(T.copy);case`v`:return f.some(T.paste);default:return f.none()}}}}));function O({saveStatus:e,initialDocument:t}){let n=p(t),i=_(n.document.viewport,n.document.stickies,n.changeViewport),a=S.isCreating(n.connectionSession),s=n.connectionSession.status===`selectingSource`||n.connectionSession.status===`selectingTarget`?n.connectionSession.status:`inactive`;return(0,k.jsxs)(b,{onKeyDown:e=>{if(e.defaultPrevented||y.isTextEntry(e.target)||n.session.status===`editing`||n.session.status===`dragging`||n.session.status===`resizing`||n.connectionSession.status===`editing`)return;let t=E.create(e.nativeEvent);t.some&&(e.preventDefault(),{[T.undo]:n.undo,[T.redo]:n.redo,[T.delete]:n.pressDelete,[T.copy]:n.copy,[T.paste]:n.paste,[T.front]:n.bringToFront,[T.fitAll]:i.fitAll,[T.zoomIn]:()=>i.stepZoom(1.2),[T.zoomOut]:()=>i.stepZoom(1/1.2)}[t.value]())},viewport:i.viewport,viewportInteraction:i.surfaceInteraction,saveStatus:e,undo:n.hasUndo?g.enabled(n.undo):g.disabled(),redo:n.hasRedo?g.enabled(n.redo):g.disabled(),selectedType:n.selectedType,onSelectType:n.selectType,onSurfaceClick:e=>{n.clickAt(i.toWorldPoint(e))},onSurfaceDoubleClick:e=>{n.doubleClickAt(i.toWorldPoint(e))},onSurfaceKeyDown:e=>{if(e===`Enter`){n.pressEnter();return}if(e===`Escape`){n.pressEscape();return}n.pressDelete()},connectionTool:{status:s,errorMessage:n.connectionError.some?n.connectionError.value.message:void 0,onToggle:n.toggleConnectionMode},children:[(0,k.jsx)(w,{document:n.document,interaction:{session:n.connectionSession,onSelect:n.selectConnection,onEdit:n.editConnection,onDraftChange:n.changeConnectionDraft,onCommitEdit:n.commitConnectionEdit}}),n.stickies.map(e=>(0,k.jsx)(l,{sticky:e,chrome:o.of(r.chromeOf(n.session,e.id),{onDraftChange:n.changeDraft,onCommit:n.commitEdit}),connectionEndpoint:S.isSource(n.connectionSession,e.id)?`source`:void 0,onActivate:a?void 0:()=>{n.select(e.id)},onKeyActivate:a?()=>{n.selectConnectionEndpoint(e.id)}:void 0,manipulation:a?void 0:{onDragStart:t=>{n.beginDrag(e.id,i.toWorldClientPoint(t))},onResizeStart:(e,t)=>{n.beginResize(e,i.toWorldClientPoint(t))},onPointerMove:e=>{n.movePointer(i.toWorldClientPoint(e))},onPointerCommit:n.commitManipulation,onPointerCancel:n.cancelManipulation}},e.id))]})}var k,A=e((()=>{D(),m(),x(),s(),h(),c(),v(),C(),k=t()})),j,M,N,P,F,I,L,R,z,B,V,H;e((()=>{a(),A(),j=t(),{userEvent:M}=__STORYBOOK_MODULE_TEST__,N={component:O,parameters:{layout:`fullscreen`},decorators:[e=>(0,j.jsx)(`div`,{className:`canvas-view-story`,children:(0,j.jsx)(e,{})})]},P={...u.empty(),stickies:[n.create(d.create(`stk_existing000`),i.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},F={...P,stickies:[...P.stickies,n.create(d.create(`stk_command0000`),i.command,`通知する`,{x:280,y:24},{width:160,height:100})]},I=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await M.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},L={args:{saveStatus:`saved`}},R={args:{saveStatus:`saving`,initialDocument:P},play:async({canvas:e})=>{await I(e,{x:40,y:40})}},z={args:{saveStatus:`saved`,initialDocument:P},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await M.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},B={args:{saveStatus:`saved`,initialDocument:F},play:async({canvas:e})=>{await M.click(e.getByRole(`button`,{name:`接続`})),await I(e,{x:48,y:48}),await I(e,{x:304,y:48})}},V={args:{saveStatus:`failed`,initialDocument:{...u.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await M.click(e.getByRole(`button`,{name:`External System`})),await I(e,{x:48,y:48})}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved"
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{R as AllProps,B as CreatingConnection,L as Default,V as EdgeCases,z as Editing,H as __namedExportsOrder,N as default};