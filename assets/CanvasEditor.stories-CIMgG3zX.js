import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-FfQcQ67_.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{a as i,d as a,f as o,i as s,l as c,n as l,o as u,p as d,r as f,t as p,u as m}from"./sticky-jYLJqDyr.js";import{n as h,r as g,t as _}from"./canvas-view-DVKFR2Zb.js";function v(e){let[t,n]=(0,y.useState)(()=>s.create(e));return{selectedType:t.selectedType,session:t.session,stickies:t.workingDocument.stickies,hasUndo:s.hasUndo(t),hasRedo:s.hasRedo(t),selectType:e=>{n(t=>s.selectType(t,e))},select:e=>{n(t=>s.select(t,e))},clickAt:e=>{n(t=>s.clickAt(t,e))},doubleClickAt:e=>{n(t=>s.doubleClickAt(t,e))},changeDraft:e=>{n(t=>s.changeDraft(t,e))},commitEdit:()=>{n(s.commitEdit)},beginDrag:(e,t)=>{n(n=>s.beginDrag(n,e,t))},beginResize:(e,t)=>{n(n=>s.beginResize(n,e,t))},movePointer:e=>{n(t=>s.movePointer(t,e))},commitManipulation:()=>{n(s.commitManipulation)},cancelManipulation:()=>{n(s.cancelManipulation)},pressEnter:()=>{n(s.pressEnter)},pressEscape:()=>{n(s.pressEscape)},undo:()=>{n(s.undo)},redo:()=>{n(s.redo)}}}var y,b=t((()=>{y=e(n(),1),u()}));function x({zoom:e,saveStatus:t,initialDocument:n}){let r=v(n);return(0,S.jsx)(_,{zoom:e,saveStatus:t,undo:r.hasUndo?h.enabled(r.undo):h.disabled(),redo:r.hasRedo?h.enabled(r.redo):h.disabled(),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:r.clickAt,onSurfaceDoubleClick:r.doubleClickAt,onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}r.pressEscape()},children:r.stickies.map(e=>(0,S.jsx)(p,{sticky:e,chrome:l.of(i.chromeOf(r.session,e.id),{onDraftChange:r.changeDraft,onCommit:r.commitEdit}),onActivate:()=>{r.select(e.id)},manipulation:{onDragStart:t=>{r.beginDrag(e.id,t)},onResizeStart:r.beginResize,onPointerMove:r.movePointer,onPointerCommit:r.commitManipulation,onPointerCancel:r.cancelManipulation}},e.id))})}var S,C=t((()=>{u(),b(),f(),g(),S=r()})),w,T,E,D,O,k,A,j,M,N;t((()=>{c(),C(),w=r(),{userEvent:T}=__STORYBOOK_MODULE_TEST__,E={component:x,parameters:{layout:`fullscreen`},decorators:[e=>(0,w.jsx)(`div`,{className:`canvas-view-story`,children:(0,w.jsx)(e,{})})]},D={...m.empty(),stickies:[o.create(d.create(`stk_existing000`),a.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},O=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await T.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},k={args:{zoom:1,saveStatus:`saved`}},A={args:{zoom:1,saveStatus:`saving`,initialDocument:D},play:async({canvas:e})=>{await O(e,{x:40,y:40})}},j={args:{zoom:1,saveStatus:`saved`,initialDocument:D},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await T.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},M={args:{zoom:.1,saveStatus:`failed`},play:async({canvas:e})=>{await T.click(e.getByRole(`button`,{name:`External System`})),await O(e,{x:48,y:48})}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved"
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
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
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},N=[`Default`,`AllProps`,`Editing`,`EdgeCases`]}))();export{A as AllProps,k as Default,M as EdgeCases,j as Editing,N as __namedExportsOrder,E as default};