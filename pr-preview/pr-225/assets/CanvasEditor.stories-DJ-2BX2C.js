import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-BMqhbQIg.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{C as i,S as a,b as o,c as s,d as c,f as l,l as u,n as d,r as f,s as p,t as m,u as h,x as g,y as _}from"./sticky-FXp9K3Ei.js";import{a as v,c as y,i as b,n as x,o as S,r as C,s as w,t as T}from"./canvas-view-dgU6ZDFe.js";import{n as E,t as D}from"./connection-session-5liMcoZ7.js";import{n as ee,t as te}from"./connection-layer-Co_M3v_r.js";var O,k,ne=t((()=>{c(),O={undo:`undo`,redo:`redo`,delete:`delete`,copy:`copy`,paste:`paste`,front:`front`,fitAll:`fitAll`,zoomIn:`zoomIn`,zoomOut:`zoomOut`},k={create(e){if(e.isComposing||e.keyCode===229||e.altKey)return i.none();if(!e.ctrlKey&&!e.metaKey)return!e.shiftKey&&(e.key===`Delete`||e.key===`Backspace`)?i.some(O.delete):i.none();switch(e.code){case`Digit0`:return i.some(O.fitAll);case`Equal`:return i.some(O.zoomIn);case`Minus`:return i.some(O.zoomOut);default:break}let t=e.key.toLowerCase();if(t===`z`)return i.some(e.shiftKey?O.redo:O.undo);if(e.shiftKey&&(t===`]`||t===`}`||e.code===`BracketRight`))return i.some(O.front);if(t===`+`||t===`=`)return i.some(O.zoomIn);if(t===`0`)return i.some(O.fitAll);if(t===`-`)return i.some(O.zoomOut);if(e.shiftKey)return i.none();switch(t){case`c`:return i.some(O.copy);case`v`:return i.some(O.paste);default:return i.none()}}}}));function A({sticky:e,onEdit:t}){return(0,j.jsxs)(`aside`,{className:`canvas-inspector`,"aria-label":`プロパティ`,children:[(0,j.jsx)(`h2`,{children:`プロパティ`}),e===void 0?(0,j.jsx)(`p`,{children:`アイテムを選択すると詳細を表示します`}):(0,j.jsxs)(j.Fragment,{children:[(0,j.jsx)(`h3`,{children:u.of(e.type).caption}),(0,j.jsx)(`p`,{className:`canvas-inspector__text`,children:e.text||`本文なし`}),(0,j.jsx)(`button`,{type:`button`,className:`canvas-history__button`,onClick:t,children:`本文を編集`}),(0,j.jsxs)(`dl`,{children:[(0,j.jsx)(`dt`,{children:`位置`}),(0,j.jsxs)(`dd`,{children:[Math.round(e.position.x),`, `,Math.round(e.position.y)]}),(0,j.jsx)(`dt`,{children:`サイズ`}),(0,j.jsxs)(`dd`,{children:[Math.round(e.size.width),` × `,Math.round(e.size.height)]})]})]})]})}var j,M=t((()=>{h(),j=r()}));function N({onStart:e,onMove:t,onFinish:n,onCancel:r}){let i=(0,P.useRef)(null),a=()=>{i.current!==null&&(i.current=null,r())},o=(0,P.useEffectEvent)(a);(0,P.useEffect)(()=>()=>o(),[]);let s=e=>{e.stopPropagation(),i.current===e.pointerId&&a()};return Object.values(_).map(r=>(0,F.jsx)(`button`,{type:`button`,className:`sticky__connection-handle`,"data-connection-anchor":r,"aria-label":`${I[r]}辺から接続`,title:`${I[r]}辺からドラッグして接続`,onPointerDown:t=>{t.stopPropagation(),!(t.button!==0||!t.isPrimary||i.current!==null)&&(t.preventDefault(),t.currentTarget.focus(),i.current=t.pointerId,t.currentTarget.setPointerCapture(t.pointerId),e(r))},onPointerMove:e=>{e.stopPropagation(),i.current===e.pointerId&&t({x:e.clientX,y:e.clientY})},onPointerUp:e=>{e.stopPropagation(),i.current===e.pointerId&&(i.current=null,n({x:e.clientX,y:e.clientY}),e.currentTarget.releasePointerCapture(e.pointerId))},onPointerCancel:s,onLostPointerCapture:s,onKeyDown:e=>{e.key===`Escape`&&(e.preventDefault(),e.stopPropagation(),a())},onClick:e=>e.stopPropagation(),onDoubleClick:e=>e.stopPropagation()},r))}var P,F,I,L=t((()=>{P=e(n(),1),c(),F=r(),I={top:`上`,right:`右`,bottom:`下`,left:`左`}}));function R({saveStatus:e,initialDocument:t,initialHistory:n,onDocumentChange:r,onHistoryChange:i,onDraftHistoryChange:a}){let[o,s]=(0,z.useState)(!1),c=(0,z.useRef)(!1),l=e=>{!c.current||e.detail===0||(e.preventDefault(),e.stopPropagation())},u=(0,z.useEffectEvent)(e=>{r?.(e)}),f=(0,z.useEffectEvent)(e=>{i?.(e)}),h=v(t,n,{onDraftHistoryChange:a,onHistoryChange:i}),g=(0,z.useEffectEvent)(e=>{a?.(e)});(0,z.useEffect)(()=>{h.session.status===`dragging`||h.session.status===`resizing`||(u(h.document),f(h.history))},[h.document,h.history,h.session.status]),(0,z.useEffect)(()=>{g(h.draftHistory)},[h.draftHistory]);let _=S(h.document.viewport,h.document.stickies,h.changeViewport),y=D.isCreating(h.connectionSession),b=h.connectionSession.status===`selectingSource`||h.connectionSession.status===`selectingTarget`?h.connectionSession.status:`inactive`,C=h.stickies.map((e,t)=>({sticky:e,stackIndex:t})).sort((e,t)=>e.sticky.id.localeCompare(t.sticky.id));return(0,B.jsxs)(T,{inspector:(0,B.jsx)(A,{sticky:h.stickies.find(e=>p.chromeOf(h.session,e.id).status!==`plain`),onEdit:h.pressEnter}),onPaletteDrop:({type:e,point:t})=>{h.selectType(e),h.placeAt(_.toWorldPoint(t)),s(!1)},placementTool:{active:o,onSelect:()=>{s(!1),h.pressEscape()}},gestureEvents:{onPointerDownCapture:e=>{c.current=!1,e.target instanceof Element&&e.target.closest(`.sticky, .connection-layer`)&&s(!1)},onClickCapture:l,onDoubleClickCapture:l},onKeyDown:e=>{if(o&&e.key===`Escape`){e.preventDefault(),e.stopPropagation(),s(!1),h.pressEscape();return}if(e.defaultPrevented||w.isTextEntry(e.target)||h.session.status===`editing`||h.session.status===`dragging`||h.session.status===`resizing`||h.connectionSession.status===`editing`)return;let t=k.create(e.nativeEvent);t.some&&(e.preventDefault(),{[O.undo]:h.undo,[O.redo]:h.redo,[O.delete]:h.pressDelete,[O.copy]:h.copy,[O.paste]:h.paste,[O.front]:h.bringToFront,[O.fitAll]:_.fitAll,[O.zoomIn]:()=>_.stepZoom(1.2),[O.zoomOut]:()=>_.stepZoom(1/1.2)}[t.value]())},viewport:_.viewport,viewportInteraction:_.surfaceInteraction,saveStatus:e,undo:h.hasUndo?x.enabled(h.undo):x.disabled(),redo:h.hasRedo?x.enabled(h.redo):x.disabled(),selectedType:h.selectedType,onSelectType:e=>{h.pressEscape(),h.selectType(e),s(!0)},onSurfaceClick:e=>{if(o){h.placeAt(_.toWorldPoint(e)),s(!1);return}h.selectAt(_.toWorldPoint(e))},onSurfaceDoubleClick:e=>{s(!1),h.doubleClickAt(_.toWorldPoint(e))},onSurfaceKeyDown:e=>{if(e===`Enter`){h.pressEnter();return}if(e===`Escape`){s(!1),h.pressEscape();return}h.pressDelete()},connectionTool:{status:b,errorMessage:h.connectionError.some?h.connectionError.value.message:void 0,onToggle:()=>{s(!1),h.toggleConnectionMode()}},children:[(0,B.jsx)(te,{document:h.document,interaction:{session:h.connectionSession,onSelect:h.selectConnection,onEdit:h.editConnection,onDraftChange:h.changeConnectionDraft,onCommitEdit:h.commitConnectionEdit}}),(0,B.jsx)(`div`,{className:`canvas-stickies`,children:C.map(({sticky:e,stackIndex:t})=>{let n=D.targetOf(h.connectionSession,e.id);return(0,B.jsxs)(m,{sticky:e,stackIndex:t,chrome:d.of(p.chromeOf(h.session,e.id),{onDraftChange:h.changeDraft,onCommit:h.commitEdit}),connectionEndpoint:D.isSource(h.connectionSession,e.id)?`source`:n.some?`target`:void 0,onActivate:y?void 0:()=>{s(!1),h.select(e.id)},onKeyActivate:y?()=>{h.selectConnectionEndpoint(e.id)}:void 0,manipulation:y?void 0:{onDragStart:t=>{s(!1),h.beginDrag(e.id,_.toWorldClientPoint(t))},onResizeStart:(e,t)=>{s(!1),h.beginResize(e,_.toWorldClientPoint(t))},onPointerMove:e=>{h.movePointer(_.toWorldClientPoint(e))},onPointerCommit:h.commitManipulation,onPointerCancel:h.cancelManipulation},children:[p.chromeOf(h.session,e.id).status===`selected`?(0,B.jsx)(N,{onStart:t=>{s(!1),c.current=!0,h.beginConnectionDrag({stickyId:e.id,anchor:t})},onMove:e=>h.moveConnectionDrag(_.toWorldClientPoint(e)),onFinish:e=>h.finishConnectionDrag(_.toWorldClientPoint(e)),onCancel:h.cancelConnectionDrag}):null,n.some?(0,B.jsx)(`span`,{className:`sticky__connection-handle sticky__connection-target`,"data-connection-anchor":n.value.anchor,"aria-hidden":`true`}):null]},e.id)})})]})}var z,B,V=t((()=>{z=e(n(),1),ne(),y(),E(),s(),b(),f(),C(),M(),L(),ee(),B=r()})),H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{c(),V(),H=r(),{userEvent:U}=__STORYBOOK_MODULE_TEST__,W={component:R,parameters:{layout:`fullscreen`},decorators:[e=>(0,H.jsx)(`div`,{className:`canvas-view-story`,children:(0,H.jsx)(e,{})})]},G={...l.empty(),stickies:[g.create(a.create(`stk_existing000`),o.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},K={...G,stickies:[...G.stickies,g.create(a.create(`stk_command0000`),o.command,`通知する`,{x:280,y:24},{width:160,height:100})]},q=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await U.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},J={args:{saveStatus:`saved`}},Y={args:{saveStatus:`saving`,initialDocument:G},play:async({canvas:e})=>{await q(e,{x:40,y:40})}},X={args:{saveStatus:`saved`,initialDocument:G},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await U.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},Z={args:{saveStatus:`saved`,initialDocument:K},play:async({canvas:e})=>{await U.click(e.getByRole(`button`,{name:`接続`})),await q(e,{x:48,y:48}),await q(e,{x:304,y:48})}},Q={args:{saveStatus:`failed`,initialDocument:{...l.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await U.click(e.getByRole(`button`,{name:`External System`})),await q(e,{x:48,y:48})}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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