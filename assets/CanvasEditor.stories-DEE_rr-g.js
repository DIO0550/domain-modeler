import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-CWuRIOjM.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{_ as i,a,b as o,d as s,f as c,i as l,l as u,n as d,o as f,r as p,t as m,u as h,v as g,y as _}from"./sticky-tU1jaT9b.js";import{i as v,n as y,r as b,t as x}from"./connection-layer-BYJqRdvQ.js";import{n as S,r as C,t as w}from"./canvas-view-QmsotWmc.js";var T,E,D,O=t((()=>{u(),f(),v(),T={create(e){return{board:l.create(e),session:{status:`idle`},error:o.none()}},withBoard(e,t){return{...e,board:t,session:{status:`idle`},error:o.none()}},toggleMode(e){return b.isCreating(e.session)?{...e,session:{status:`idle`},error:o.none()}:{board:l.deselect(e.board),session:{status:`selectingSource`},error:o.none()}},clickAt(e,t){if(!b.isCreating(e.session))return T.withBoard(e,l.clickAt(e.board,t));let n=c.stickyAt(e.board.workingDocument,t);return n.some?T.selectEndpoint(e,n.value.id):e},selectEndpoint(e,t){if(e.session.status===`selectingSource`)return{...e,session:{status:`selectingTarget`,sourceId:t},error:o.none()};if(e.session.status!==`selectingTarget`)return e;let n=c.addConnection(e.board.workingDocument,e.session.sourceId,t);if(!n.ok)return{...e,error:o.some(n.error)};let r=n.value.connections[n.value.connections.length-1];return r===void 0?e:{board:E(e.board,n.value),session:{status:`selected`,connectionId:r.id},error:o.none()}},select(e,t){return c.connectionById(e.board.workingDocument,t).some?{board:l.deselect(e.board),session:{status:`selected`,connectionId:t},error:o.none()}:e},edit(e,t){let n=c.connectionById(e.board.workingDocument,t);return n.some?{board:l.deselect(e.board),session:{status:`editing`,connectionId:t,draftLabel:n.value.label,originalLabel:n.value.label},error:o.none()}:e},changeDraft(e,t){return e.session.status===`editing`?{...e,session:{...e.session,draftLabel:t}}:e},commitEdit(e){if(e.session.status!==`editing`)return e;let t={...e,session:{status:`selected`,connectionId:e.session.connectionId}};if(e.session.draftLabel===e.session.originalLabel)return t;let n=c.updateConnectionLabel(e.board.workingDocument,e.session.connectionId,e.session.draftLabel);return{...t,board:E(e.board,n)}},pressEnter(e){return e.session.status===`selected`?T.edit(e,e.session.connectionId):e.session.status===`idle`?{...e,board:l.pressEnter(e.board)}:e},pressEscape(e){return e.session.status===`editing`?T.commitEdit(e):e.session.status===`idle`?{...e,board:l.pressEscape(e.board)}:{...e,session:{status:`idle`},error:o.none()}},pressDelete(e){if(e.session.status!==`selected`)return e;let t=c.connectionById(e.board.workingDocument,e.session.connectionId);if(!t.some)return{...e,session:{status:`idle`}};let n=c.removeConnection(e.board.workingDocument,t.value.id);return{board:E(e.board,n),session:{status:`idle`},error:o.none()}},undo(e){let t=T.commitEdit(e),n=l.undo(t.board);return D({...t,board:n})},redo(e){let t=T.commitEdit(e),n=l.redo(t.board);return D({...t,board:n})}},E=(e,t)=>{if(t===e.workingDocument)return e;let n=h.execute(e.history,s.create({previous:e.history.current,next:t}));return{...e,history:n,workingDocument:n.current,session:{status:`idle`}}},D=e=>e.session.status===`selectingTarget`?c.stickyById(e.board.workingDocument,e.session.sourceId).some?e:{...e,session:{status:`idle`},error:o.none()}:e.session.status!==`selected`&&e.session.status!==`editing`||c.connectionById(e.board.workingDocument,e.session.connectionId).some?e:{...e,session:{status:`idle`}}}));function k(e){let[t,n]=(0,A.useState)(()=>T.create(e)),r=t.board,i=e=>{n(t=>T.withBoard(t,e(t.board)))};return{document:r.workingDocument,selectedType:r.selectedType,session:r.session,stickies:r.workingDocument.stickies,connections:r.workingDocument.connections,connectionSession:t.session,connectionError:t.error,hasUndo:l.hasUndo(r),hasRedo:l.hasRedo(r),selectType:e=>{i(t=>l.selectType(t,e))},select:e=>{i(t=>l.select(t,e))},clickAt:e=>{n(t=>T.clickAt(t,e))},doubleClickAt:e=>{n(t=>b.isCreating(t.session)?t:T.withBoard(t,l.doubleClickAt(t.board,e)))},changeDraft:e=>{i(t=>l.changeDraft(t,e))},commitEdit:()=>{i(l.commitEdit)},beginDrag:(e,t)=>{i(n=>l.beginDrag(n,e,t))},beginResize:(e,t)=>{i(n=>l.beginResize(n,e,t))},movePointer:e=>{i(t=>l.movePointer(t,e))},commitManipulation:()=>{i(l.commitManipulation)},cancelManipulation:()=>{i(l.cancelManipulation)},pressEnter:()=>{n(T.pressEnter)},pressEscape:()=>{n(T.pressEscape)},undo:()=>{n(T.undo)},redo:()=>{n(T.redo)},toggleConnectionMode:()=>{n(T.toggleMode)},selectConnectionEndpoint:e=>{n(t=>T.selectEndpoint(t,e))},selectConnection:e=>{n(t=>T.select(t,e))},editConnection:e=>{n(t=>T.edit(t,e))},changeConnectionDraft:e=>{n(t=>T.changeDraft(t,e))},commitConnectionEdit:()=>{n(T.commitEdit)},pressDelete:()=>{n(T.pressDelete)}}}var A,j=t((()=>{A=e(n(),1),O(),v(),f()}));function M({zoom:e,saveStatus:t,initialDocument:n}){let r=k(n),i=b.isCreating(r.connectionSession),o=r.connectionSession.status===`selectingSource`||r.connectionSession.status===`selectingTarget`?r.connectionSession.status:`inactive`;return(0,N.jsxs)(w,{zoom:e,saveStatus:t,undo:r.hasUndo?S.enabled(r.undo):S.disabled(),redo:r.hasRedo?S.enabled(r.redo):S.disabled(),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:r.clickAt,onSurfaceDoubleClick:r.doubleClickAt,onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}if(e===`Escape`){r.pressEscape();return}r.pressDelete()},connectionTool:{status:o,errorMessage:r.connectionError.some?r.connectionError.value.message:void 0,onToggle:r.toggleConnectionMode},children:[(0,N.jsx)(x,{document:r.document,interaction:{session:r.connectionSession,onSelect:r.selectConnection,onEdit:r.editConnection,onDraftChange:r.changeConnectionDraft,onCommitEdit:r.commitConnectionEdit}}),r.stickies.map(e=>(0,N.jsx)(m,{sticky:e,chrome:d.of(a.chromeOf(r.session,e.id),{onDraftChange:r.changeDraft,onCommit:r.commitEdit}),connectionEndpoint:b.isSource(r.connectionSession,e.id)?`source`:void 0,onActivate:i?void 0:()=>{r.select(e.id)},onKeyActivate:i?()=>{r.selectConnectionEndpoint(e.id)}:void 0,manipulation:i?void 0:{onDragStart:t=>{r.beginDrag(e.id,t)},onResizeStart:r.beginResize,onPointerMove:r.movePointer,onPointerCommit:r.commitManipulation,onPointerCancel:r.cancelManipulation}},e.id))]})}var N,P=t((()=>{v(),f(),j(),p(),C(),y(),N=r()})),F,I,L,R,z,B,V,H,U,W,G,K;t((()=>{u(),P(),F=r(),{userEvent:I}=__STORYBOOK_MODULE_TEST__,L={component:M,parameters:{layout:`fullscreen`},decorators:[e=>(0,F.jsx)(`div`,{className:`canvas-view-story`,children:(0,F.jsx)(e,{})})]},R={...c.empty(),stickies:[g.create(_.create(`stk_existing000`),i.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},z={...R,stickies:[...R.stickies,g.create(_.create(`stk_command0000`),i.command,`通知する`,{x:280,y:24},{width:160,height:100})]},B=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await I.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},V={args:{zoom:1,saveStatus:`saved`}},H={args:{zoom:1,saveStatus:`saving`,initialDocument:R},play:async({canvas:e})=>{await B(e,{x:40,y:40})}},U={args:{zoom:1,saveStatus:`saved`,initialDocument:R},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await I.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},W={args:{zoom:1,saveStatus:`saved`,initialDocument:z},play:async({canvas:e})=>{await I.click(e.getByRole(`button`,{name:`接続`})),await B(e,{x:48,y:48}),await B(e,{x:304,y:48})}},G={args:{zoom:.1,saveStatus:`failed`},play:async({canvas:e})=>{await I.click(e.getByRole(`button`,{name:`External System`})),await B(e,{x:48,y:48})}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved"
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
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
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
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
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
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
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
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
}`,...G.parameters?.docs?.source}}},K=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{H as AllProps,W as CreatingConnection,V as Default,G as EdgeCases,U as Editing,K as __namedExportsOrder,L as default};