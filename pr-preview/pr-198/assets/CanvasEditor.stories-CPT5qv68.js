import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-CNWnPvi3.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{_ as i,a,b as o,d as s,f as c,i as l,l as u,n as d,o as f,r as p,t as m,u as h,v as g,x as _,y as v}from"./sticky-BI2Y8npt.js";import{i as y,n as b,r as x,t as S}from"./connection-layer-BDGq_brL.js";import{n as C,r as w,t as T}from"./canvas-view-BhX-oMRF.js";var E,D,O,k=t((()=>{u(),f(),y(),E={create(e){return{board:l.create(e),session:{status:`idle`},error:_.none()}},withBoard(e,t){return{...e,board:t,session:{status:`idle`},error:_.none()}},toggleMode(e){return x.isCreating(e.session)?{...e,session:{status:`idle`},error:_.none()}:{board:l.deselect(e.board),session:{status:`selectingSource`},error:_.none()}},clickAt(e,t){if(!x.isCreating(e.session))return E.withBoard(e,l.clickAt(e.board,t));let n=c.stickyAt(e.board.workingDocument,t);return n.some?E.selectEndpoint(e,n.value.id):e},selectEndpoint(e,t){if(e.session.status===`selectingSource`)return{...e,session:{status:`selectingTarget`,sourceId:t},error:_.none()};if(e.session.status!==`selectingTarget`)return e;let n=c.addConnection(e.board.workingDocument,e.session.sourceId,t);if(!n.ok)return{...e,error:_.some(n.error)};let r=n.value.connections[n.value.connections.length-1];return r===void 0?e:{board:D(e.board,n.value),session:{status:`selected`,connectionId:r.id},error:_.none()}},select(e,t){return c.connectionById(e.board.workingDocument,t).some?{board:l.deselect(e.board),session:{status:`selected`,connectionId:t},error:_.none()}:e},edit(e,t){let n=c.connectionById(e.board.workingDocument,t);return n.some?{board:l.deselect(e.board),session:{status:`editing`,connectionId:t,draftLabel:n.value.label,originalLabel:n.value.label},error:_.none()}:e},changeDraft(e,t){return e.session.status===`editing`?{...e,session:{...e.session,draftLabel:t}}:e},commitEdit(e){if(e.session.status!==`editing`)return e;let t={...e,session:{status:`selected`,connectionId:e.session.connectionId}};if(e.session.draftLabel===e.session.originalLabel)return t;let n=c.updateConnectionLabel(e.board.workingDocument,e.session.connectionId,e.session.draftLabel);return{...t,board:D(e.board,n)}},pressEnter(e){return e.session.status===`selected`?E.edit(e,e.session.connectionId):e.session.status===`idle`?{...e,board:l.pressEnter(e.board)}:e},pressEscape(e){return e.session.status===`editing`?E.commitEdit(e):e.session.status===`idle`?{...e,board:l.pressEscape(e.board)}:{...e,session:{status:`idle`},error:_.none()}},pressDelete(e){if(e.session.status!==`selected`)return e;let t=c.connectionById(e.board.workingDocument,e.session.connectionId);if(!t.some)return{...e,session:{status:`idle`}};let n=c.removeConnection(e.board.workingDocument,t.value.id);return{board:D(e.board,n),session:{status:`idle`},error:_.none()}},undo(e){let t=E.commitEdit(e),n=l.undo(t.board);return O({...t,board:n})},redo(e){let t=E.commitEdit(e),n=l.redo(t.board);return O({...t,board:n})}},D=(e,t)=>{if(t===e.workingDocument)return e;let n=h.execute(e.history,s.create({previous:e.history.current,next:t}));return{...e,history:n,workingDocument:n.current,session:{status:`idle`}}},O=e=>e.session.status===`selectingTarget`?c.stickyById(e.board.workingDocument,e.session.sourceId).some?e:{...e,session:{status:`idle`},error:_.none()}:e.session.status!==`selected`&&e.session.status!==`editing`||c.connectionById(e.board.workingDocument,e.session.connectionId).some?e:{...e,session:{status:`idle`}}}));function A(e,t){let[n,r]=(0,j.useState)(!1),i=(0,j.useRef)(!1),a=(0,j.useRef)({status:`idle`}),s=(0,j.useRef)(!1),c=(0,j.useCallback)(e=>{t(t=>o.pan(t,e))},[t]),l=(0,j.useCallback)((e,n)=>{t(t=>o.zoomAt(t,e,n))},[t]),u=(0,j.useCallback)(()=>{t(()=>o.default())},[t]),d=(0,j.useCallback)(e=>{a.current.status!==`panning`||a.current.pointerId!==e||(a.current={status:`idle`},r(!1))},[]),f=(0,j.useCallback)((e,n)=>{if(N(e.target))return;e.preventDefault();let r=M(e,n);if(e.ctrlKey||e.metaKey){let i=n.getBoundingClientRect(),a={x:e.clientX-i.left,y:e.clientY-i.top},s=Math.exp(-r.y*.002);t(e=>o.zoomAt(e,e.zoom*s,a));return}c({x:-r.x,y:-r.y})},[t,c]);return(0,j.useEffect)(()=>{let e=e=>{if((e.ctrlKey||e.metaKey)&&e.key===`0`){e.preventDefault(),u();return}e.code!==`Space`||N(e.target)||(e.preventDefault(),i.current=!0)},t=e=>{e.code===`Space`&&(i.current=!1)},n=()=>{i.current=!1};return window.addEventListener(`keydown`,e),window.addEventListener(`keyup`,t),window.addEventListener(`blur`,n),()=>{window.removeEventListener(`keydown`,e),window.removeEventListener(`keyup`,t),window.removeEventListener(`blur`,n)}},[u]),{viewport:e,toWorldPoint:t=>o.screenToWorld(e,t),panBy:c,zoomAt:l,reset:u,surfaceInteraction:{isPanning:n,onPointerDown:e=>{let t=e.button===1,n=e.button===0&&i.current;!t&&!n||(e.preventDefault(),e.stopPropagation(),e.currentTarget.setPointerCapture(e.pointerId),a.current={status:`panning`,pointerId:e.pointerId,point:{x:e.clientX,y:e.clientY}},s.current=n,r(!0))},onPointerMove:e=>{let t=a.current;if(t.status!==`panning`||t.pointerId!==e.pointerId)return;let n={x:e.clientX,y:e.clientY};c({x:n.x-t.point.x,y:n.y-t.point.y}),a.current={...t,point:n}},onPointerUp:e=>{d(e.pointerId)},onPointerCancel:e=>{s.current=!1,d(e.pointerId)},onClickCapture:e=>{s.current&&(s.current=!1,e.preventDefault(),e.stopPropagation())},onWheel:f}}}var j,M,N,P=t((()=>{j=e(n(),1),u(),M=(e,t)=>e.deltaMode===1?{x:e.deltaX*16,y:e.deltaY*16}:e.deltaMode===2?{x:e.deltaX*t.clientWidth,y:e.deltaY*t.clientHeight}:{x:e.deltaX,y:e.deltaY},N=e=>e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement}));function F(e){let[t,n]=(0,I.useState)(()=>E.create(e)),r=t.board,i=e=>{n(t=>E.withBoard(t,e(t.board)))};return{document:r.workingDocument,selectedType:r.selectedType,session:r.session,stickies:r.workingDocument.stickies,connections:r.workingDocument.connections,connectionSession:t.session,connectionError:t.error,hasUndo:l.hasUndo(r),hasRedo:l.hasRedo(r),selectType:e=>{i(t=>l.selectType(t,e))},select:e=>{i(t=>l.select(t,e))},clickAt:e=>{n(t=>E.clickAt(t,e))},doubleClickAt:e=>{n(t=>x.isCreating(t.session)?t:E.withBoard(t,l.doubleClickAt(t.board,e)))},changeDraft:e=>{i(t=>l.changeDraft(t,e))},commitEdit:()=>{i(l.commitEdit)},beginDrag:(e,t)=>{i(n=>l.beginDrag(n,e,t))},beginResize:(e,t)=>{i(n=>l.beginResize(n,e,t))},movePointer:e=>{i(t=>l.movePointer(t,e))},commitManipulation:()=>{i(l.commitManipulation)},cancelManipulation:()=>{i(l.cancelManipulation)},pressEnter:()=>{n(E.pressEnter)},pressEscape:()=>{n(E.pressEscape)},undo:()=>{n(E.undo)},redo:()=>{n(E.redo)},toggleConnectionMode:()=>{n(E.toggleMode)},selectConnectionEndpoint:e=>{n(t=>E.selectEndpoint(t,e))},selectConnection:e=>{n(t=>E.select(t,e))},editConnection:e=>{n(t=>E.edit(t,e))},changeConnectionDraft:e=>{n(t=>E.changeDraft(t,e))},commitConnectionEdit:()=>{n(E.commitEdit)},pressDelete:()=>{n(E.pressDelete)},changeViewport:e=>{n(t=>({...t,board:l.changeViewport(t.board,e(t.board.workingDocument.viewport))}))}}}var I,L=t((()=>{I=e(n(),1),k(),y(),f(),P()}));function R({saveStatus:e,initialDocument:t}){let n=F(t),r=A(n.document.viewport,n.changeViewport),i=x.isCreating(n.connectionSession),o=n.connectionSession.status===`selectingSource`||n.connectionSession.status===`selectingTarget`?n.connectionSession.status:`inactive`;return(0,z.jsxs)(T,{viewport:r.viewport,viewportInteraction:r.surfaceInteraction,saveStatus:e,undo:n.hasUndo?C.enabled(n.undo):C.disabled(),redo:n.hasRedo?C.enabled(n.redo):C.disabled(),selectedType:n.selectedType,onSelectType:n.selectType,onSurfaceClick:e=>{n.clickAt(r.toWorldPoint(e))},onSurfaceDoubleClick:e=>{n.doubleClickAt(r.toWorldPoint(e))},onSurfaceKeyDown:e=>{if(e===`Enter`){n.pressEnter();return}if(e===`Escape`){n.pressEscape();return}n.pressDelete()},connectionTool:{status:o,errorMessage:n.connectionError.some?n.connectionError.value.message:void 0,onToggle:n.toggleConnectionMode},children:[(0,z.jsx)(S,{document:n.document,interaction:{session:n.connectionSession,onSelect:n.selectConnection,onEdit:n.editConnection,onDraftChange:n.changeConnectionDraft,onCommitEdit:n.commitConnectionEdit}}),n.stickies.map(e=>(0,z.jsx)(m,{sticky:e,chrome:d.of(a.chromeOf(n.session,e.id),{onDraftChange:n.changeDraft,onCommit:n.commitEdit}),connectionEndpoint:x.isSource(n.connectionSession,e.id)?`source`:void 0,onActivate:i?void 0:()=>{n.select(e.id)},onKeyActivate:i?()=>{n.selectConnectionEndpoint(e.id)}:void 0,manipulation:i?void 0:{onDragStart:t=>{n.beginDrag(e.id,r.toWorldPoint(t))},onResizeStart:(e,t)=>{n.beginResize(e,r.toWorldPoint(t))},onPointerMove:e=>{n.movePointer(r.toWorldPoint(e))},onPointerCommit:n.commitManipulation,onPointerCancel:n.cancelManipulation}},e.id))]})}var z,B=t((()=>{y(),f(),L(),p(),w(),b(),z=r()})),V,H,U,W,G,K,q,J,Y,X,Z,Q;t((()=>{u(),B(),V=r(),{userEvent:H}=__STORYBOOK_MODULE_TEST__,U={component:R,parameters:{layout:`fullscreen`},decorators:[e=>(0,V.jsx)(`div`,{className:`canvas-view-story`,children:(0,V.jsx)(e,{})})]},W={...c.empty(),stickies:[g.create(v.create(`stk_existing000`),i.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},G={...W,stickies:[...W.stickies,g.create(v.create(`stk_command0000`),i.command,`通知する`,{x:280,y:24},{width:160,height:100})]},K=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await H.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},q={args:{saveStatus:`saved`}},J={args:{saveStatus:`saving`,initialDocument:W},play:async({canvas:e})=>{await K(e,{x:40,y:40})}},Y={args:{saveStatus:`saved`,initialDocument:W},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await H.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},X={args:{saveStatus:`saved`,initialDocument:G},play:async({canvas:e})=>{await H.click(e.getByRole(`button`,{name:`接続`})),await K(e,{x:48,y:48}),await K(e,{x:304,y:48})}},Z={args:{saveStatus:`failed`,initialDocument:{...c.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await H.click(e.getByRole(`button`,{name:`External System`})),await K(e,{x:48,y:48})}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved"
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
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
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
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
}`,...Z.parameters?.docs?.source}}},Q=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{J as AllProps,X as CreatingConnection,q as Default,Z as EdgeCases,Y as Editing,Q as __namedExportsOrder,U as default};