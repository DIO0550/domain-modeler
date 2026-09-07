import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{a as n,b as r,f as i,l as a,n as o,o as s,r as c,t as l,v as u,x as d,y as f}from"./sticky-615AHcMg.js";import{a as p,c as m,i as h,n as g,o as _,r as v,s as y,t as b}from"./canvas-view-B1HP3jsk.js";import{n as x,t as S}from"./connection-session-CVzygf0M.js";import{n as C,t as w}from"./connection-layer-C-o6-sQi.js";var T,E=e((()=>{a(),T={fromKey(e){if(e.isComposing||e.keyCode===229||e.altKey)return d.none();if(!e.ctrlKey&&!e.metaKey)return!e.shiftKey&&(e.key===`Delete`||e.key===`Backspace`)?d.some(`delete`):d.none();let t=e.key.toLowerCase();if(t===`z`)return d.some(e.shiftKey?`redo`:`undo`);if(e.shiftKey&&(t===`]`||t===`}`))return d.some(`front`);if(t===`+`||t===`=`)return d.some(`zoomIn`);if(e.shiftKey)return d.none();switch(t){case`c`:return d.some(`copy`);case`v`:return d.some(`paste`);case`0`:return d.some(`fitAll`);case`-`:return d.some(`zoomOut`);default:return d.none()}}}}));function D({saveStatus:e,initialDocument:t}){let r=p(t),i=_(r.document.viewport,r.document.stickies,r.changeViewport),a=S.isCreating(r.connectionSession),s=r.connectionSession.status===`selectingSource`||r.connectionSession.status===`selectingTarget`?r.connectionSession.status:`inactive`;return(0,O.jsxs)(b,{onKeyDown:e=>{if(e.defaultPrevented||y.isTextEntry(e.target)||r.session.status===`editing`||r.session.status===`dragging`||r.session.status===`resizing`||r.connectionSession.status===`editing`)return;let t=T.fromKey(e.nativeEvent);t.some&&(e.preventDefault(),{undo:r.undo,redo:r.redo,delete:r.pressDelete,copy:r.copy,paste:r.paste,front:r.bringToFront,fitAll:i.fitAll,zoomIn:()=>i.stepZoom(1.2),zoomOut:()=>i.stepZoom(1/1.2)}[t.value]())},viewport:i.viewport,viewportInteraction:i.surfaceInteraction,saveStatus:e,undo:r.hasUndo?g.enabled(r.undo):g.disabled(),redo:r.hasRedo?g.enabled(r.redo):g.disabled(),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:e=>{r.clickAt(i.toWorldPoint(e))},onSurfaceDoubleClick:e=>{r.doubleClickAt(i.toWorldPoint(e))},onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}if(e===`Escape`){r.pressEscape();return}r.pressDelete()},connectionTool:{status:s,errorMessage:r.connectionError.some?r.connectionError.value.message:void 0,onToggle:r.toggleConnectionMode},children:[(0,O.jsx)(w,{document:r.document,interaction:{session:r.connectionSession,onSelect:r.selectConnection,onEdit:r.editConnection,onDraftChange:r.changeConnectionDraft,onCommitEdit:r.commitConnectionEdit}}),r.stickies.map(e=>(0,O.jsx)(l,{sticky:e,chrome:o.of(n.chromeOf(r.session,e.id),{onDraftChange:r.changeDraft,onCommit:r.commitEdit}),connectionEndpoint:S.isSource(r.connectionSession,e.id)?`source`:void 0,onActivate:a?void 0:()=>{r.select(e.id)},onKeyActivate:a?()=>{r.selectConnectionEndpoint(e.id)}:void 0,manipulation:a?void 0:{onDragStart:t=>{r.beginDrag(e.id,i.toWorldClientPoint(t))},onResizeStart:(e,t)=>{r.beginResize(e,i.toWorldClientPoint(t))},onPointerMove:e=>{r.movePointer(i.toWorldClientPoint(e))},onPointerCommit:r.commitManipulation,onPointerCancel:r.cancelManipulation}},e.id))]})}var O,k=e((()=>{E(),m(),x(),s(),h(),c(),v(),C(),O=t()})),A,j,M,N,P,F,I,L,R,z,B,V;e((()=>{a(),k(),A=t(),{userEvent:j}=__STORYBOOK_MODULE_TEST__,M={component:D,parameters:{layout:`fullscreen`},decorators:[e=>(0,A.jsx)(`div`,{className:`canvas-view-story`,children:(0,A.jsx)(e,{})})]},N={...i.empty(),stickies:[f.create(r.create(`stk_existing000`),u.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},P={...N,stickies:[...N.stickies,f.create(r.create(`stk_command0000`),u.command,`通知する`,{x:280,y:24},{width:160,height:100})]},F=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await j.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},I={args:{saveStatus:`saved`}},L={args:{saveStatus:`saving`,initialDocument:N},play:async({canvas:e})=>{await F(e,{x:40,y:40})}},R={args:{saveStatus:`saved`,initialDocument:N},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await j.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},z={args:{saveStatus:`saved`,initialDocument:P},play:async({canvas:e})=>{await j.click(e.getByRole(`button`,{name:`接続`})),await F(e,{x:48,y:48}),await F(e,{x:304,y:48})}},B={args:{saveStatus:`failed`,initialDocument:{...i.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await j.click(e.getByRole(`button`,{name:`External System`})),await F(e,{x:48,y:48})}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved"
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}},V=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{L as AllProps,z as CreatingConnection,I as Default,B as EdgeCases,R as Editing,V as __namedExportsOrder,M as default};