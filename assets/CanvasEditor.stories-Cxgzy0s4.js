import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-Ztqtl2zN.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{C as i,S as a,b as o,c as s,d as c,f as l,l as u,n as d,r as f,s as p,t as m,u as h,x as g,y as _}from"./sticky-DMdCjTlP.js";import{a as v,c as y,i as b,n as x,o as S,r as C,s as w,t as T}from"./canvas-view-BWL28PWh.js";import{n as E,t as D}from"./connection-session-BHu-bVa7.js";import{n as O,t as ee}from"./connection-layer-BLgbhptP.js";var k,A,te=t((()=>{c(),k={undo:`undo`,redo:`redo`,delete:`delete`,copy:`copy`,paste:`paste`,front:`front`,fitAll:`fitAll`,zoomIn:`zoomIn`,zoomOut:`zoomOut`},A={create(e){if(e.isComposing||e.keyCode===229||e.altKey)return i.none();if(!e.ctrlKey&&!e.metaKey)return!e.shiftKey&&(e.key===`Delete`||e.key===`Backspace`)?i.some(k.delete):i.none();switch(e.code){case`Digit0`:return i.some(k.fitAll);case`Equal`:return i.some(k.zoomIn);case`Minus`:return i.some(k.zoomOut);default:break}let t=e.key.toLowerCase();if(t===`z`)return i.some(e.shiftKey?k.redo:k.undo);if(e.shiftKey&&(t===`]`||t===`}`||e.code===`BracketRight`))return i.some(k.front);if(t===`+`||t===`=`)return i.some(k.zoomIn);if(t===`0`)return i.some(k.fitAll);if(t===`-`)return i.some(k.zoomOut);if(e.shiftKey)return i.none();switch(t){case`c`:return i.some(k.copy);case`v`:return i.some(k.paste);default:return i.none()}}}}));function ne({sticky:e,onEditStart:t,onChange:n,onCommit:r}){return(0,j.jsxs)(`aside`,{className:`canvas-inspector`,"aria-label":`プロパティ`,children:[(0,j.jsx)(`h2`,{children:`プロパティ`}),e===void 0?(0,j.jsxs)(`div`,{className:`canvas-inspector__empty`,children:[(0,j.jsxs)(`svg`,{width:`28`,height:`28`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`1.2`,"aria-hidden":`true`,children:[(0,j.jsx)(`rect`,{x:`4`,y:`4`,width:`16`,height:`16`,rx:`3`}),(0,j.jsx)(`path`,{d:`M8 9h8M8 13h5`})]}),(0,j.jsx)(`p`,{children:`付箋を選択して編集`})]}):(0,j.jsxs)(j.Fragment,{children:[(0,j.jsxs)(`div`,{className:`canvas-inspector__type`,children:[(0,j.jsx)(`span`,{className:`canvas-palette__swatch`,"data-sticky-type":e.type}),(0,j.jsx)(`span`,{children:u.of(e.type).caption})]}),(0,j.jsxs)(`label`,{className:`canvas-inspector__field`,children:[(0,j.jsx)(`span`,{children:`本文`}),(0,j.jsx)(`textarea`,{"aria-label":`プロパティの本文`,value:e.text,placeholder:`本文を入力`,onFocus:t,onChange:e=>n(e.target.value),onBlur:r},e.id)]}),(0,j.jsxs)(`section`,{className:`canvas-inspector__geometry`,"aria-label":`レイアウト`,children:[(0,j.jsx)(`h3`,{children:`レイアウト`}),(0,j.jsxs)(`dl`,{children:[(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`dt`,{children:`X`}),(0,j.jsx)(`dd`,{children:Math.round(e.position.x)})]}),(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`dt`,{children:`Y`}),(0,j.jsx)(`dd`,{children:Math.round(e.position.y)})]}),(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`dt`,{children:`W`}),(0,j.jsx)(`dd`,{children:Math.round(e.size.width)})]}),(0,j.jsxs)(`div`,{children:[(0,j.jsx)(`dt`,{children:`H`}),(0,j.jsx)(`dd`,{children:Math.round(e.size.height)})]})]})]})]})]})}var j,M=t((()=>{h(),j=r()}));function N({onStart:e,onMove:t,onFinish:n,onCancel:r}){let i=(0,P.useRef)(null),a=()=>{i.current!==null&&(i.current=null,r())},o=(0,P.useEffectEvent)(a);(0,P.useEffect)(()=>()=>o(),[]);let s=e=>{e.stopPropagation(),i.current===e.pointerId&&a()};return Object.values(_).map(r=>(0,F.jsx)(`button`,{type:`button`,className:`sticky__connection-handle`,"data-connection-anchor":r,"aria-label":`${I[r]}辺から接続`,title:`${I[r]}辺からドラッグして接続`,onPointerDown:t=>{t.stopPropagation(),!(t.button!==0||!t.isPrimary||i.current!==null)&&(t.preventDefault(),t.currentTarget.focus(),i.current=t.pointerId,t.currentTarget.setPointerCapture(t.pointerId),e(r))},onPointerMove:e=>{e.stopPropagation(),i.current===e.pointerId&&t({x:e.clientX,y:e.clientY})},onPointerUp:e=>{e.stopPropagation(),i.current===e.pointerId&&(i.current=null,n({x:e.clientX,y:e.clientY}),e.currentTarget.releasePointerCapture(e.pointerId))},onPointerCancel:s,onLostPointerCapture:s,onKeyDown:e=>{e.key===`Escape`&&(e.preventDefault(),e.stopPropagation(),a())},onClick:e=>e.stopPropagation(),onDoubleClick:e=>e.stopPropagation()},r))}var P,F,I,L=t((()=>{P=e(n(),1),c(),F=r(),I={top:`上`,right:`右`,bottom:`下`,left:`左`}}));function R({saveStatus:e,initialDocument:t,initialHistory:n,onDocumentChange:r,onHistoryChange:i,onDraftHistoryChange:a}){let[o,s]=(0,z.useState)(!1),[c,l]=(0,z.useState)(!1),u=(0,z.useRef)(!1),f=e=>{!u.current||e.detail===0||(e.preventDefault(),e.stopPropagation())},h=(0,z.useEffectEvent)(e=>{r?.(e)}),g=(0,z.useEffectEvent)(e=>{i?.(e)}),_=v(t,n,{onDraftHistoryChange:a,onHistoryChange:i}),y=(0,z.useEffectEvent)(e=>{a?.(e)});(0,z.useEffect)(()=>{_.session.status===`dragging`||_.session.status===`resizing`||(h(_.document),g(_.history))},[_.document,_.history,_.session.status]),(0,z.useEffect)(()=>{y(_.draftHistory)},[_.draftHistory]);let b=S(_.document.viewport,_.document.stickies,_.changeViewport),C=D.isCreating(_.connectionSession),E=_.connectionSession.status===`selectingSource`||_.connectionSession.status===`selectingTarget`?_.connectionSession.status:`inactive`,O=_.stickies.map((e,t)=>({sticky:e,stackIndex:t})).sort((e,t)=>e.sticky.id.localeCompare(t.sticky.id));return(0,B.jsxs)(T,{showToolbar:!1,inspector:(0,B.jsx)(ne,{sticky:_.stickies.find(e=>p.chromeOf(_.session,e.id).status!==`plain`),onEditStart:()=>{l(!0),_.pressEnter()},onChange:_.changeDraft,onCommit:()=>{_.commitEdit(),l(!1)}}),onPaletteDrop:({type:e,point:t})=>{_.selectType(e),_.placeAt(b.toWorldPoint(t)),s(!1)},placementTool:{active:o,onSelect:()=>{s(!1),_.pressEscape()}},gestureEvents:{onPointerDownCapture:e=>{u.current=!1,e.target instanceof Element&&e.target.closest(`.sticky, .connection-layer`)&&s(!1)},onClickCapture:f,onDoubleClickCapture:f},onKeyDown:e=>{if(o&&e.key===`Escape`){e.preventDefault(),e.stopPropagation(),s(!1),_.pressEscape();return}if(e.defaultPrevented||w.isTextEntry(e.target)||_.session.status===`editing`||_.session.status===`dragging`||_.session.status===`resizing`||_.connectionSession.status===`editing`)return;let t=A.create(e.nativeEvent);t.some&&(e.preventDefault(),{[k.undo]:_.undo,[k.redo]:_.redo,[k.delete]:_.pressDelete,[k.copy]:_.copy,[k.paste]:_.paste,[k.front]:_.bringToFront,[k.fitAll]:b.fitAll,[k.zoomIn]:()=>b.stepZoom(1.2),[k.zoomOut]:()=>b.stepZoom(1/1.2)}[t.value]())},viewport:b.viewport,viewportInteraction:b.surfaceInteraction,saveStatus:e,undo:_.hasUndo?x.enabled(_.undo):x.disabled(),redo:_.hasRedo?x.enabled(_.redo):x.disabled(),selectedType:_.selectedType,onSelectType:e=>{_.pressEscape(),_.selectType(e),s(!0)},onSurfaceClick:e=>{if(o){_.placeAt(b.toWorldPoint(e)),s(!1);return}_.selectAt(b.toWorldPoint(e))},onSurfaceDoubleClick:e=>{s(!1),_.doubleClickAt(b.toWorldPoint(e))},onSurfaceKeyDown:e=>{if(e===`Enter`){_.pressEnter();return}if(e===`Escape`){s(!1),_.pressEscape();return}_.pressDelete()},connectionTool:{status:E,errorMessage:_.connectionError.some?_.connectionError.value.message:void 0,onToggle:()=>{s(!1),_.toggleConnectionMode()}},children:[(0,B.jsx)(ee,{document:_.document,interaction:{session:_.connectionSession,onSelect:_.selectConnection,onEdit:_.editConnection,onDraftChange:_.changeConnectionDraft,onCommitEdit:_.commitConnectionEdit}}),(0,B.jsx)(`div`,{className:`canvas-stickies`,children:O.map(({sticky:e,stackIndex:t})=>{let n=D.targetOf(_.connectionSession,e.id);return(0,B.jsxs)(m,{sticky:e,stackIndex:t,chrome:d.of(c&&_.session.status===`editing`&&_.session.stickyId===e.id?{status:`selected`}:p.chromeOf(_.session,e.id),{onDraftChange:_.changeDraft,onCommit:_.commitEdit}),connectionEndpoint:D.isSource(_.connectionSession,e.id)?`source`:n.some?`target`:void 0,onActivate:C?void 0:()=>{s(!1),_.select(e.id)},onKeyActivate:C?()=>{_.selectConnectionEndpoint(e.id)}:void 0,manipulation:C?void 0:{onDragStart:t=>{s(!1),_.beginDrag(e.id,b.toWorldClientPoint(t))},onResizeStart:(e,t)=>{s(!1),_.beginResize(e,b.toWorldClientPoint(t))},onPointerMove:e=>{_.movePointer(b.toWorldClientPoint(e))},onPointerCommit:_.commitManipulation,onPointerCancel:_.cancelManipulation},children:[p.chromeOf(_.session,e.id).status===`selected`?(0,B.jsx)(N,{onStart:t=>{s(!1),u.current=!0,_.beginConnectionDrag({stickyId:e.id,anchor:t})},onMove:e=>_.moveConnectionDrag(b.toWorldClientPoint(e)),onFinish:e=>_.finishConnectionDrag(b.toWorldClientPoint(e)),onCancel:_.cancelConnectionDrag}):null,n.some?(0,B.jsx)(`span`,{className:`sticky__connection-handle sticky__connection-target`,"data-connection-anchor":n.value.anchor,"aria-hidden":`true`}):null]},e.id)})})]})}var z,B,V=t((()=>{z=e(n(),1),te(),y(),E(),s(),b(),f(),C(),M(),L(),O(),B=r()})),H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{c(),V(),H=r(),{userEvent:U}=__STORYBOOK_MODULE_TEST__,W={component:R,parameters:{layout:`fullscreen`},decorators:[e=>(0,H.jsx)(`div`,{className:`canvas-view-story`,children:(0,H.jsx)(e,{})})]},G={...l.empty(),stickies:[g.create(a.create(`stk_existing000`),o.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},K={...G,stickies:[...G.stickies,g.create(a.create(`stk_command0000`),o.command,`通知する`,{x:280,y:24},{width:160,height:100})]},q=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await U.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},J={args:{saveStatus:`saved`}},Y={args:{saveStatus:`saving`,initialDocument:G},play:async({canvas:e})=>{await q(e,{x:40,y:40})}},X={args:{saveStatus:`saved`,initialDocument:G},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await U.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},Z={args:{saveStatus:`saved`,initialDocument:K},play:async({canvas:e})=>{await U.click(e.getByRole(`button`,{name:`接続`})),await q(e,{x:48,y:48}),await q(e,{x:304,y:48})}},Q={args:{saveStatus:`failed`,initialDocument:{...l.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await U.click(e.getByRole(`button`,{name:`External System`})),await q(e,{x:48,y:48})}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved"
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
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
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
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
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{Y as AllProps,Z as CreatingConnection,J as Default,Q as EdgeCases,X as Editing,$ as __namedExportsOrder,W as default};