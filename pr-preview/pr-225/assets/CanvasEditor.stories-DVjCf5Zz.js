import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-Y1u-_DWS.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{_ as i,a,b as o,g as s,l as c,n as l,o as u,r as d,t as f,u as p,v as m,y as h}from"./sticky-BXFCyHoa.js";import{a as g,c as _,i as v,n as y,o as b,r as x,s as S,t as C}from"./canvas-view-BZwzWeFG.js";import{n as w,t as T}from"./connection-session-DBB-dBs1.js";import{n as E,t as D}from"./connection-layer-CXJsnghS.js";var O,k,A=t((()=>{c(),O={undo:`undo`,redo:`redo`,delete:`delete`,copy:`copy`,paste:`paste`,front:`front`,fitAll:`fitAll`,zoomIn:`zoomIn`,zoomOut:`zoomOut`},k={create(e){if(e.isComposing||e.keyCode===229||e.altKey)return o.none();if(!e.ctrlKey&&!e.metaKey)return!e.shiftKey&&(e.key===`Delete`||e.key===`Backspace`)?o.some(O.delete):o.none();switch(e.code){case`Digit0`:return o.some(O.fitAll);case`Equal`:return o.some(O.zoomIn);case`Minus`:return o.some(O.zoomOut);default:break}let t=e.key.toLowerCase();if(t===`z`)return o.some(e.shiftKey?O.redo:O.undo);if(e.shiftKey&&(t===`]`||t===`}`||e.code===`BracketRight`))return o.some(O.front);if(t===`+`||t===`=`)return o.some(O.zoomIn);if(t===`0`)return o.some(O.fitAll);if(t===`-`)return o.some(O.zoomOut);if(e.shiftKey)return o.none();switch(t){case`c`:return o.some(O.copy);case`v`:return o.some(O.paste);default:return o.none()}}}}));function j({onStart:e,onMove:t,onFinish:n,onCancel:r}){let i=(0,M.useRef)(null),a=()=>{i.current!==null&&(i.current=null,r())},o=(0,M.useEffectEvent)(a);(0,M.useEffect)(()=>()=>o(),[]);let c=e=>{e.stopPropagation(),i.current===e.pointerId&&a()};return Object.values(s).map(r=>(0,N.jsx)(`button`,{type:`button`,className:`sticky__connection-handle`,"data-connection-anchor":r,"aria-label":`${P[r]}辺から接続`,title:`${P[r]}辺からドラッグして接続`,onPointerDown:t=>{t.stopPropagation(),!(t.button!==0||!t.isPrimary||i.current!==null)&&(t.preventDefault(),t.currentTarget.focus(),i.current=t.pointerId,t.currentTarget.setPointerCapture(t.pointerId),e(r))},onPointerMove:e=>{e.stopPropagation(),i.current===e.pointerId&&t({x:e.clientX,y:e.clientY})},onPointerUp:e=>{e.stopPropagation(),i.current===e.pointerId&&(i.current=null,n({x:e.clientX,y:e.clientY}),e.currentTarget.releasePointerCapture(e.pointerId))},onPointerCancel:c,onLostPointerCapture:c,onKeyDown:e=>{e.key===`Escape`&&(e.preventDefault(),e.stopPropagation(),a())},onClick:e=>e.stopPropagation(),onDoubleClick:e=>e.stopPropagation()},r))}var M,N,P,F=t((()=>{M=e(n(),1),c(),N=r(),P={top:`上`,right:`右`,bottom:`下`,left:`左`}}));function I({saveStatus:e,initialDocument:t,initialHistory:n,onDocumentChange:r,onHistoryChange:i,onDraftHistoryChange:o}){let[s,c]=(0,L.useState)(!1),u=(0,L.useRef)(!1),d=e=>{!u.current||e.detail===0||(e.preventDefault(),e.stopPropagation())},p=(0,L.useEffectEvent)(e=>{r?.(e)}),m=(0,L.useEffectEvent)(e=>{i?.(e)}),h=g(t,n,{onDraftHistoryChange:o,onHistoryChange:i}),_=(0,L.useEffectEvent)(e=>{o?.(e)});(0,L.useEffect)(()=>{h.session.status===`dragging`||h.session.status===`resizing`||(p(h.document),m(h.history))},[h.document,h.history,h.session.status]),(0,L.useEffect)(()=>{_(h.draftHistory)},[h.draftHistory]);let v=b(h.document.viewport,h.document.stickies,h.changeViewport),x=T.isCreating(h.connectionSession),w=h.connectionSession.status===`selectingSource`||h.connectionSession.status===`selectingTarget`?h.connectionSession.status:`inactive`;return(0,R.jsxs)(C,{placementTool:{active:s,onSelect:()=>{c(!1),h.pressEscape()}},gestureEvents:{onPointerDownCapture:()=>{u.current=!1},onClickCapture:d,onDoubleClickCapture:d},onKeyDown:e=>{if(s&&e.key===`Escape`){e.preventDefault(),e.stopPropagation(),c(!1),h.pressEscape();return}if(e.defaultPrevented||S.isTextEntry(e.target)||h.session.status===`editing`||h.session.status===`dragging`||h.session.status===`resizing`||h.connectionSession.status===`editing`)return;let t=k.create(e.nativeEvent);t.some&&(e.preventDefault(),{[O.undo]:h.undo,[O.redo]:h.redo,[O.delete]:h.pressDelete,[O.copy]:h.copy,[O.paste]:h.paste,[O.front]:h.bringToFront,[O.fitAll]:v.fitAll,[O.zoomIn]:()=>v.stepZoom(1.2),[O.zoomOut]:()=>v.stepZoom(1/1.2)}[t.value]())},viewport:v.viewport,viewportInteraction:v.surfaceInteraction,saveStatus:e,undo:h.hasUndo?y.enabled(h.undo):y.disabled(),redo:h.hasRedo?y.enabled(h.redo):y.disabled(),selectedType:h.selectedType,onSelectType:e=>{h.pressEscape(),h.selectType(e),c(!0)},onSurfaceClick:e=>{if(s){h.clickAt(v.toWorldPoint(e)),c(!1);return}h.selectAt(v.toWorldPoint(e))},onSurfaceDoubleClick:e=>{h.doubleClickAt(v.toWorldPoint(e))},onSurfaceKeyDown:e=>{if(e===`Enter`){h.pressEnter();return}if(e===`Escape`){c(!1),h.pressEscape();return}h.pressDelete()},connectionTool:{status:w,errorMessage:h.connectionError.some?h.connectionError.value.message:void 0,onToggle:()=>{c(!1),h.toggleConnectionMode()}},children:[(0,R.jsx)(D,{document:h.document,interaction:{session:h.connectionSession,onSelect:h.selectConnection,onEdit:h.editConnection,onDraftChange:h.changeConnectionDraft,onCommitEdit:h.commitConnectionEdit}}),h.stickies.map(e=>{let t=T.targetOf(h.connectionSession,e.id);return(0,R.jsxs)(f,{sticky:e,chrome:l.of(a.chromeOf(h.session,e.id),{onDraftChange:h.changeDraft,onCommit:h.commitEdit}),connectionEndpoint:T.isSource(h.connectionSession,e.id)?`source`:t.some?`target`:void 0,onActivate:x?void 0:()=>{h.select(e.id)},onKeyActivate:x?()=>{h.selectConnectionEndpoint(e.id)}:void 0,manipulation:x?void 0:{onDragStart:t=>{h.beginDrag(e.id,v.toWorldClientPoint(t))},onResizeStart:(e,t)=>{h.beginResize(e,v.toWorldClientPoint(t))},onPointerMove:e=>{h.movePointer(v.toWorldClientPoint(e))},onPointerCommit:h.commitManipulation,onPointerCancel:h.cancelManipulation},children:[a.chromeOf(h.session,e.id).status===`selected`?(0,R.jsx)(j,{onStart:t=>{c(!1),u.current=!0,h.beginConnectionDrag({stickyId:e.id,anchor:t})},onMove:e=>h.moveConnectionDrag(v.toWorldClientPoint(e)),onFinish:e=>h.finishConnectionDrag(v.toWorldClientPoint(e)),onCancel:h.cancelConnectionDrag}):null,t.some?(0,R.jsx)(`span`,{className:`sticky__connection-handle sticky__connection-target`,"data-connection-anchor":t.value.anchor,"aria-hidden":`true`}):null]},e.id)})]})}var L,R,z=t((()=>{L=e(n(),1),A(),_(),w(),u(),v(),d(),x(),F(),E(),R=r()})),B,V,H,U,W,G,K,q,J,Y,X,Z;t((()=>{c(),z(),B=r(),{userEvent:V}=__STORYBOOK_MODULE_TEST__,H={component:I,parameters:{layout:`fullscreen`},decorators:[e=>(0,B.jsx)(`div`,{className:`canvas-view-story`,children:(0,B.jsx)(e,{})})]},U={...p.empty(),stickies:[m.create(h.create(`stk_existing000`),i.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},W={...U,stickies:[...U.stickies,m.create(h.create(`stk_command0000`),i.command,`通知する`,{x:280,y:24},{width:160,height:100})]},G=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await V.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},K={args:{saveStatus:`saved`}},q={args:{saveStatus:`saving`,initialDocument:U},play:async({canvas:e})=>{await G(e,{x:40,y:40})}},J={args:{saveStatus:`saved`,initialDocument:U},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await V.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},Y={args:{saveStatus:`saved`,initialDocument:W},play:async({canvas:e})=>{await V.click(e.getByRole(`button`,{name:`接続`})),await G(e,{x:48,y:48}),await G(e,{x:304,y:48})}},X={args:{saveStatus:`failed`,initialDocument:{...p.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await V.click(e.getByRole(`button`,{name:`External System`})),await G(e,{x:48,y:48})}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved"
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
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
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
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
}`,...X.parameters?.docs?.source}}},Z=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{q as AllProps,Y as CreatingConnection,K as Default,X as EdgeCases,J as Editing,Z as __namedExportsOrder,H as default};