import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-DaiC2cug.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{a as i,c as a,d as o,f as s,i as c,l,n as u,o as d,r as f,s as p,t as m,u as h}from"./sticky-Qg9MCrtG.js";import{n as g,r as _,t as v}from"./canvas-view-DETnGQof.js";var y,b,x,S,C,w,T=t((()=>{d(),i(),y={chromeOf(e,t){return e.status===`idle`||e.stickyId!==t?{status:`plain`}:e.status===`selected`?{status:`selected`}:{status:`editing`,draftText:e.draftText}}},b={create(e=l.empty()){return{history:p.create(e),workingDocument:e,selectedType:h.event,session:{status:`idle`}}},selectType(e,t){return{...e,selectedType:t}},clickAt(e,t){let n=b.commitEdit(e),r=l.stickyAt(n.workingDocument,t);return r.some?{...n,session:{status:`selected`,stickyId:r.value.id}}:x(n,t)},select(e,t){let n=b.commitEdit(e);return l.stickyById(n.workingDocument,t).some?{...n,session:{status:`selected`,stickyId:t}}:n},doubleClickAt(e,t){let n=b.commitEdit(e),r=l.stickyAt(n.workingDocument,t);return r.some?S(n,r.value):n},changeDraft(e,t){return e.session.status===`editing`?{...e,workingDocument:l.updateStickyText(e.workingDocument,e.session.stickyId,t),session:{...e.session,draftText:t}}:e},commitEdit(e){if(e.session.status!==`editing`)return e;let t={...e,session:{status:`selected`,stickyId:e.session.stickyId}};if(e.session.draftText===e.session.originalText)return{...t,workingDocument:e.history.current};let n=p.execute(e.history,a.create({previous:e.history.current,next:e.workingDocument}));return{...t,history:n,workingDocument:n.current}},pressEnter(e){if(e.session.status!==`selected`)return e;let t=l.stickyById(e.workingDocument,e.session.stickyId);return t.some?S(e,t.value):{...e,session:{status:`idle`}}},pressEscape(e){return e.session.status===`editing`?b.commitEdit(e):e.session.status===`selected`?{...e,session:{status:`idle`}}:e},undo(e){let t=b.commitEdit(e),n=p.undo(t.history);return n.some?C(t,n.value):t},redo(e){let t=b.commitEdit(e),n=p.redo(t.history);return n.some?C(t,n.value):t},hasUndo(e){return p.undo(e.history).some},hasRedo(e){return p.redo(e.history).some}},x=(e,t)=>{let n=c.of(e.selectedType),r=l.addSticky(e.workingDocument,e.selectedType,``,t,n.defaultSize);if(!r.ok)return e;let i=r.value.stickies[r.value.stickies.length-1];if(i===void 0)return e;let o=p.execute(e.history,a.create({previous:e.history.current,next:r.value}));return{history:o,workingDocument:o.current,selectedType:e.selectedType,session:{status:`editing`,stickyId:i.id,draftText:``,originalText:``}}},S=(e,t)=>({...e,session:{status:`editing`,stickyId:t.id,draftText:t.text,originalText:t.text}}),C=(e,t)=>({...e,history:t,workingDocument:t.current,session:w(e.session,t.current)}),w=(e,t)=>e.status===`idle`?e:l.stickyById(t,e.stickyId).some?e.status===`editing`?{status:`selected`,stickyId:e.stickyId}:e:{status:`idle`}}));function E(e){let[t,n]=(0,D.useState)(()=>b.create(e));return{selectedType:t.selectedType,session:t.session,stickies:t.workingDocument.stickies,hasUndo:b.hasUndo(t),hasRedo:b.hasRedo(t),selectType:e=>{n(t=>b.selectType(t,e))},select:e=>{n(t=>b.select(t,e))},clickAt:e=>{n(t=>b.clickAt(t,e))},doubleClickAt:e=>{n(t=>b.doubleClickAt(t,e))},changeDraft:e=>{n(t=>b.changeDraft(t,e))},commitEdit:()=>{n(b.commitEdit)},pressEnter:()=>{n(b.pressEnter)},pressEscape:()=>{n(b.pressEscape)},undo:()=>{n(b.undo)},redo:()=>{n(b.redo)}}}var D,O=t((()=>{D=e(n(),1),T()}));function k({zoom:e,saveStatus:t,initialDocument:n}){let r=E(n);return(0,A.jsx)(v,{zoom:e,saveStatus:t,undo:r.hasUndo?g.enabled(r.undo):g.disabled(),redo:r.hasRedo?g.enabled(r.redo):g.disabled(),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:r.clickAt,onSurfaceDoubleClick:r.doubleClickAt,onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}r.pressEscape()},children:r.stickies.map(e=>(0,A.jsx)(m,{sticky:e,chrome:u.of(y.chromeOf(r.session,e.id),{onDraftChange:r.changeDraft,onCommit:r.commitEdit}),onActivate:()=>{r.select(e.id)}},e.id))})}var A,j=t((()=>{T(),O(),f(),_(),A=r()})),M,N,P,F,I,L,R,z,B,V;t((()=>{d(),j(),M=r(),{userEvent:N}=__STORYBOOK_MODULE_TEST__,P={component:k,parameters:{layout:`fullscreen`},decorators:[e=>(0,M.jsx)(`div`,{className:`canvas-view-story`,children:(0,M.jsx)(e,{})})]},F={...l.empty(),stickies:[o.create(s.create(`stk_existing000`),h.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},I=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await N.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},L={args:{zoom:1,saveStatus:`saved`}},R={args:{zoom:1,saveStatus:`saving`,initialDocument:F},play:async({canvas:e})=>{await I(e,{x:40,y:40})}},z={args:{zoom:1,saveStatus:`saved`,initialDocument:F},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await N.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},B={args:{zoom:.1,saveStatus:`failed`},play:async({canvas:e})=>{await N.click(e.getByRole(`button`,{name:`External System`})),await I(e,{x:48,y:48})}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved"
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
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
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}},V=[`Default`,`AllProps`,`Editing`,`EdgeCases`]}))();export{R as AllProps,L as Default,B as EdgeCases,z as Editing,V as __namedExportsOrder,P as default};