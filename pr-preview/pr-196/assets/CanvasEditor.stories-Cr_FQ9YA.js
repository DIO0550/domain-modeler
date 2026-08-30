import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-CjtWKqsK.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{a as i,g as a,h as o,i as s,l as c,m as l,n as u,o as d,r as f,t as p,u as m}from"./sticky-D60KsqWK.js";import{n as h,r as g,t as _}from"./canvas-view-CPnv8vVl.js";import{n as v,t as y}from"./connection-layer-h7vpfHcn.js";function b(e){let[t,n]=(0,x.useState)(()=>s.create(e));return{document:t.workingDocument,selectedType:t.selectedType,session:t.session,stickies:t.workingDocument.stickies,hasUndo:s.hasUndo(t),hasRedo:s.hasRedo(t),selectType:e=>{n(t=>s.selectType(t,e))},select:e=>{n(t=>s.select(t,e))},clickAt:e=>{n(t=>s.clickAt(t,e))},doubleClickAt:e=>{n(t=>s.doubleClickAt(t,e))},changeDraft:e=>{n(t=>s.changeDraft(t,e))},commitEdit:()=>{n(s.commitEdit)},beginDrag:(e,t)=>{n(n=>s.beginDrag(n,e,t))},beginResize:(e,t)=>{n(n=>s.beginResize(n,e,t))},movePointer:e=>{n(t=>s.movePointer(t,e))},commitManipulation:()=>{n(s.commitManipulation)},cancelManipulation:()=>{n(s.cancelManipulation)},pressEnter:()=>{n(s.pressEnter)},pressEscape:()=>{n(s.pressEscape)},undo:()=>{n(s.undo)},redo:()=>{n(s.redo)}}}var x,S=t((()=>{x=e(n(),1),d()}));function C({zoom:e,saveStatus:t,initialDocument:n}){let r=b(n);return(0,w.jsxs)(_,{zoom:e,saveStatus:t,undo:r.hasUndo?h.enabled(r.undo):h.disabled(),redo:r.hasRedo?h.enabled(r.redo):h.disabled(),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:r.clickAt,onSurfaceDoubleClick:r.doubleClickAt,onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}r.pressEscape()},children:[(0,w.jsx)(y,{document:r.document}),r.stickies.map(e=>(0,w.jsx)(p,{sticky:e,chrome:u.of(i.chromeOf(r.session,e.id),{onDraftChange:r.changeDraft,onCommit:r.commitEdit}),onActivate:()=>{r.select(e.id)},manipulation:{onDragStart:t=>{r.beginDrag(e.id,t)},onResizeStart:r.beginResize,onPointerMove:r.movePointer,onPointerCommit:r.commitManipulation,onPointerCancel:r.cancelManipulation}},e.id))]})}var w,T=t((()=>{d(),S(),f(),g(),v(),w=r()})),E,D,O,k,A,j,M,N,P,F;t((()=>{c(),T(),E=r(),{userEvent:D}=__STORYBOOK_MODULE_TEST__,O={component:C,parameters:{layout:`fullscreen`},decorators:[e=>(0,E.jsx)(`div`,{className:`canvas-view-story`,children:(0,E.jsx)(e,{})})]},k={...m.empty(),stickies:[o.create(a.create(`stk_existing000`),l.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},A=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await D.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},j={args:{zoom:1,saveStatus:`saved`}},M={args:{zoom:1,saveStatus:`saving`,initialDocument:k},play:async({canvas:e})=>{await A(e,{x:40,y:40})}},N={args:{zoom:1,saveStatus:`saved`,initialDocument:k},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await D.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},P={args:{zoom:.1,saveStatus:`failed`},play:async({canvas:e})=>{await D.click(e.getByRole(`button`,{name:`External System`})),await A(e,{x:48,y:48})}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved"
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
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
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source}}},F=[`Default`,`AllProps`,`Editing`,`EdgeCases`]}))();export{M as AllProps,j as Default,P as EdgeCases,N as Editing,F as __namedExportsOrder,O as default};