import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{a as n,b as r,f as i,l as a,n as o,o as s,r as c,t as l,v as u,y as d}from"./sticky-Cv8Bu_6e.js";import{n as f,t as p}from"./connection-session-B7jXWY4v.js";import{a as m,i as h,n as g,o as _,r as v,t as y}from"./canvas-view-CgtjLMW3.js";import{n as b,t as x}from"./connection-layer-QGph3hRB.js";function S({saveStatus:e,initialDocument:t}){let r=m(t),i=_(r.document.viewport,r.document.stickies,r.changeViewport),a=p.isCreating(r.connectionSession),s=r.connectionSession.status===`selectingSource`||r.connectionSession.status===`selectingTarget`?r.connectionSession.status:`inactive`;return(0,C.jsxs)(y,{viewport:i.viewport,viewportInteraction:i.surfaceInteraction,saveStatus:e,undo:r.hasUndo?g.enabled(r.undo):g.disabled(),redo:r.hasRedo?g.enabled(r.redo):g.disabled(),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:e=>{r.clickAt(i.toWorldPoint(e))},onSurfaceDoubleClick:e=>{r.doubleClickAt(i.toWorldPoint(e))},onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}if(e===`Escape`){r.pressEscape();return}r.pressDelete()},connectionTool:{status:s,errorMessage:r.connectionError.some?r.connectionError.value.message:void 0,onToggle:r.toggleConnectionMode},children:[(0,C.jsx)(x,{document:r.document,interaction:{session:r.connectionSession,onSelect:r.selectConnection,onEdit:r.editConnection,onDraftChange:r.changeConnectionDraft,onCommitEdit:r.commitConnectionEdit}}),r.stickies.map(e=>(0,C.jsx)(l,{sticky:e,chrome:o.of(n.chromeOf(r.session,e.id),{onDraftChange:r.changeDraft,onCommit:r.commitEdit}),connectionEndpoint:p.isSource(r.connectionSession,e.id)?`source`:void 0,onActivate:a?void 0:()=>{r.select(e.id)},onKeyActivate:a?()=>{r.selectConnectionEndpoint(e.id)}:void 0,manipulation:a?void 0:{onDragStart:t=>{r.beginDrag(e.id,i.toWorldClientPoint(t))},onResizeStart:(e,t)=>{r.beginResize(e,i.toWorldClientPoint(t))},onPointerMove:e=>{r.movePointer(i.toWorldClientPoint(e))},onPointerCommit:r.commitManipulation,onPointerCancel:r.cancelManipulation}},e.id))]})}var C,w=e((()=>{f(),s(),h(),c(),v(),b(),C=t()})),T,E,D,O,k,A,j,M,N,P,F,I;e((()=>{a(),w(),T=t(),{userEvent:E}=__STORYBOOK_MODULE_TEST__,D={component:S,parameters:{layout:`fullscreen`},decorators:[e=>(0,T.jsx)(`div`,{className:`canvas-view-story`,children:(0,T.jsx)(e,{})})]},O={...i.empty(),stickies:[d.create(r.create(`stk_existing000`),u.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},k={...O,stickies:[...O.stickies,d.create(r.create(`stk_command0000`),u.command,`通知する`,{x:280,y:24},{width:160,height:100})]},A=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await E.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},j={args:{saveStatus:`saved`}},M={args:{saveStatus:`saving`,initialDocument:O},play:async({canvas:e})=>{await A(e,{x:40,y:40})}},N={args:{saveStatus:`saved`,initialDocument:O},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await E.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},P={args:{saveStatus:`saved`,initialDocument:k},play:async({canvas:e})=>{await E.click(e.getByRole(`button`,{name:`接続`})),await A(e,{x:48,y:48}),await A(e,{x:304,y:48})}},F={args:{saveStatus:`failed`,initialDocument:{...i.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await E.click(e.getByRole(`button`,{name:`External System`})),await A(e,{x:48,y:48})}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved"
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
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
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
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
}`,...F.parameters?.docs?.source}}},I=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{M as AllProps,P as CreatingConnection,j as Default,F as EdgeCases,N as Editing,I as __namedExportsOrder,D as default};