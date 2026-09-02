import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-BZlQWqnS.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{_ as i,a,f as o,i as s,l as c,n as l,o as u,r as d,t as f,v as p,y as m}from"./sticky-7vhqmloR.js";import{a as h,i as g,n as _,r as v,t as y}from"./connection-layer-BYUoshqh.js";import{n as b,r as x,t as S}from"./canvas-view-CdOkpwVR.js";function C(e){let[t,n]=(0,w.useState)(()=>v.create(e)),r=t.board,i=e=>{n(t=>v.withBoard(t,e(t.board)))};return{document:r.workingDocument,selectedType:r.selectedType,session:r.session,stickies:r.workingDocument.stickies,connections:r.workingDocument.connections,connectionSession:t.session,connectionError:t.error,hasUndo:s.hasUndo(r),hasRedo:s.hasRedo(r),selectType:e=>{i(t=>s.selectType(t,e))},select:e=>{i(t=>s.select(t,e))},clickAt:e=>{n(t=>v.clickAt(t,e))},doubleClickAt:e=>{n(t=>g.isCreating(t.session)?t:v.withBoard(t,s.doubleClickAt(t.board,e)))},changeDraft:e=>{i(t=>s.changeDraft(t,e))},commitEdit:()=>{i(s.commitEdit)},beginDrag:(e,t)=>{i(n=>s.beginDrag(n,e,t))},beginResize:(e,t)=>{i(n=>s.beginResize(n,e,t))},movePointer:e=>{i(t=>s.movePointer(t,e))},commitManipulation:()=>{i(s.commitManipulation)},cancelManipulation:()=>{i(s.cancelManipulation)},pressEnter:()=>{n(v.pressEnter)},pressEscape:()=>{n(v.pressEscape)},undo:()=>{n(v.undo)},redo:()=>{n(v.redo)},toggleConnectionMode:()=>{n(v.toggleMode)},selectConnectionEndpoint:e=>{n(t=>v.selectEndpoint(t,e))},selectConnection:e=>{n(t=>v.select(t,e))},editConnection:e=>{n(t=>v.edit(t,e))},changeConnectionDraft:e=>{n(t=>v.changeDraft(t,e))},commitConnectionEdit:()=>{n(v.commitEdit)},pressDelete:()=>{n(v.pressDelete)}}}var w,T=t((()=>{w=e(n(),1),h(),u()}));function E({zoom:e,saveStatus:t,initialDocument:n}){let r=C(n),i=g.isCreating(r.connectionSession),o=r.connectionSession.status===`selectingSource`||r.connectionSession.status===`selectingTarget`?r.connectionSession.status:`inactive`;return(0,D.jsxs)(S,{zoom:e,saveStatus:t,undo:r.hasUndo?b.enabled(r.undo):b.disabled(),redo:r.hasRedo?b.enabled(r.redo):b.disabled(),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:r.clickAt,onSurfaceDoubleClick:r.doubleClickAt,onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}if(e===`Escape`){r.pressEscape();return}r.pressDelete()},connectionTool:{status:o,errorMessage:r.connectionError.some?r.connectionError.value.message:void 0,onToggle:r.toggleConnectionMode},children:[(0,D.jsx)(y,{document:r.document,interaction:{session:r.connectionSession,onSelect:r.selectConnection,onEdit:r.editConnection,onDraftChange:r.changeConnectionDraft,onCommitEdit:r.commitConnectionEdit}}),r.stickies.map(e=>(0,D.jsx)(f,{sticky:e,chrome:l.of(a.chromeOf(r.session,e.id),{onDraftChange:r.changeDraft,onCommit:r.commitEdit}),connectionEndpoint:g.isSource(r.connectionSession,e.id)?`source`:void 0,onActivate:i?void 0:()=>{r.select(e.id)},onKeyActivate:i?()=>{r.selectConnectionEndpoint(e.id)}:void 0,manipulation:i?void 0:{onDragStart:t=>{r.beginDrag(e.id,t)},onResizeStart:r.beginResize,onPointerMove:r.movePointer,onPointerCommit:r.commitManipulation,onPointerCancel:r.cancelManipulation}},e.id))]})}var D,O=t((()=>{h(),u(),T(),d(),x(),_(),D=r()})),k,A,j,M,N,P,F,I,L,R,z,B;t((()=>{c(),O(),k=r(),{userEvent:A}=__STORYBOOK_MODULE_TEST__,j={component:E,parameters:{layout:`fullscreen`},decorators:[e=>(0,k.jsx)(`div`,{className:`canvas-view-story`,children:(0,k.jsx)(e,{})})]},M={...o.empty(),stickies:[p.create(m.create(`stk_existing000`),i.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},N={...M,stickies:[...M.stickies,p.create(m.create(`stk_command0000`),i.command,`通知する`,{x:280,y:24},{width:160,height:100})]},P=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await A.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},F={args:{zoom:1,saveStatus:`saved`}},I={args:{zoom:1,saveStatus:`saving`,initialDocument:M},play:async({canvas:e})=>{await P(e,{x:40,y:40})}},L={args:{zoom:1,saveStatus:`saved`,initialDocument:M},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await A.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},R={args:{zoom:1,saveStatus:`saved`,initialDocument:N},play:async({canvas:e})=>{await A.click(e.getByRole(`button`,{name:`接続`})),await P(e,{x:48,y:48}),await P(e,{x:304,y:48})}},z={args:{zoom:.1,saveStatus:`failed`},play:async({canvas:e})=>{await A.click(e.getByRole(`button`,{name:`External System`})),await P(e,{x:48,y:48})}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved"
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
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
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
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
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
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
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 0.1,
    saveStatus: "failed"
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
}`,...z.parameters?.docs?.source}}},B=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{I as AllProps,R as CreatingConnection,F as Default,z as EdgeCases,L as Editing,B as __namedExportsOrder,j as default};