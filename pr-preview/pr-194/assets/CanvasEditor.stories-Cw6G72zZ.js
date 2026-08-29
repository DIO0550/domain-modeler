import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-C1x-2IA6.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{a as i,c as a,d as o,i as s,l as c,n as l,o as u,r as d,s as f,t as p,u as m}from"./sticky-DaYaDGUP.js";import{n as h,t as g}from"./canvas-view-BGioEMM0.js";var _,v,y,b,x,S=t((()=>{i(),s(),_={create(e=a.empty()){return{history:u.create(e),workingDocument:e,selectedType:c.event,session:{status:`idle`}}},selectType(e,t){return{...e,selectedType:t}},clickAt(e,t){let n=_.commitEdit(e),r=a.stickyAt(n.workingDocument,t);return r.some?{...n,session:{status:`selected`,stickyId:r.value.id}}:v(n,t)},select(e,t){let n=_.commitEdit(e);return a.stickyById(n.workingDocument,t).some?{...n,session:{status:`selected`,stickyId:t}}:n},doubleClickAt(e,t){let n=_.commitEdit(e),r=a.stickyAt(n.workingDocument,t);return r.some?y(n,r.value):n},changeDraft(e,t){return e.session.status===`editing`?{...e,workingDocument:a.updateStickyText(e.workingDocument,e.session.stickyId,t),session:{...e.session,draftText:t}}:e},commitEdit(e){if(e.session.status!==`editing`)return e;let t={...e,session:{status:`selected`,stickyId:e.session.stickyId}};if(e.session.draftText===e.session.originalText)return{...t,workingDocument:e.history.current};let n=u.execute(e.history,f.create({previous:e.history.current,next:e.workingDocument}));return{...t,history:n,workingDocument:n.current}},pressEnter(e){if(e.session.status!==`selected`)return e;let t=a.stickyById(e.workingDocument,e.session.stickyId);return t.some?y(e,t.value):{...e,session:{status:`idle`}}},pressEscape(e){return e.session.status===`editing`?_.commitEdit(e):e.session.status===`selected`?{...e,session:{status:`idle`}}:e},undo(e){let t=_.commitEdit(e),n=u.undo(t.history);return n.some?b(t,n.value):t},redo(e){let t=_.commitEdit(e),n=u.redo(t.history);return n.some?b(t,n.value):t},hasUndo(e){return u.undo(e.history).some},hasRedo(e){return u.redo(e.history).some}},v=(e,t)=>{let n=d.of(e.selectedType),r=a.addSticky(e.workingDocument,e.selectedType,``,t,n.defaultSize);if(!r.ok)return e;let i=r.value.stickies[r.value.stickies.length-1];if(i===void 0)return e;let o=u.execute(e.history,f.create({previous:e.history.current,next:r.value}));return{history:o,workingDocument:o.current,selectedType:e.selectedType,session:{status:`editing`,stickyId:i.id,draftText:``,originalText:``}}},y=(e,t)=>({...e,session:{status:`editing`,stickyId:t.id,draftText:t.text,originalText:t.text}}),b=(e,t)=>({...e,history:t,workingDocument:t.current,session:x(e.session,t.current)}),x=(e,t)=>e.status===`idle`?e:a.stickyById(t,e.stickyId).some?e.status===`editing`?{status:`selected`,stickyId:e.stickyId}:e:{status:`idle`}}));function C(e){let[t,n]=(0,w.useState)(()=>_.create(e));return{selectedType:t.selectedType,session:t.session,stickies:t.workingDocument.stickies,hasUndo:_.hasUndo(t),hasRedo:_.hasRedo(t),selectType:e=>{n(t=>_.selectType(t,e))},select:e=>{n(t=>_.select(t,e))},clickAt:e=>{n(t=>_.clickAt(t,e))},doubleClickAt:e=>{n(t=>_.doubleClickAt(t,e))},changeDraft:e=>{n(t=>_.changeDraft(t,e))},commitEdit:()=>{n(_.commitEdit)},pressEnter:()=>{n(_.pressEnter)},pressEscape:()=>{n(_.pressEscape)},undo:()=>{n(_.undo)},redo:()=>{n(_.redo)}}}var w,T=t((()=>{w=e(n(),1),S()}));function E({zoom:e,saveStatus:t,initialDocument:n}){let r=C(n);return(0,D.jsx)(g,{zoom:e,saveStatus:t,undo:O(r.hasUndo,r.undo),redo:O(r.hasRedo,r.redo),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:r.clickAt,onSurfaceDoubleClick:r.doubleClickAt,onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}r.pressEscape()},children:r.stickies.map(e=>(0,D.jsx)(p,{sticky:e,chrome:k(r.session,e.id,{onDraftChange:r.changeDraft,onCommit:r.commitEdit}),onActivate:()=>{r.select(e.id)}},e.id))})}var D,O,k,A=t((()=>{T(),l(),h(),D=r(),O=(e,t)=>e?{availability:`enabled`,onClick:t}:{availability:`disabled`},k=(e,t,n)=>e.status===`idle`||e.stickyId!==t?{status:`plain`}:e.status===`selected`?{status:`selected`}:{status:`editing`,draftText:e.draftText,onDraftChange:n.onDraftChange,onCommit:n.onCommit}})),j,M,N,P,F,I,L,R,z,B;t((()=>{i(),A(),j=r(),{userEvent:M}=__STORYBOOK_MODULE_TEST__,N={component:E,parameters:{layout:`fullscreen`},decorators:[e=>(0,j.jsx)(`div`,{className:`canvas-view-story`,children:(0,j.jsx)(e,{})})]},P={...a.empty(),stickies:[m.create(o.create(`stk_existing000`),c.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},F=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await M.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},I={args:{zoom:1,saveStatus:`saved`}},L={args:{zoom:1,saveStatus:`saving`,initialDocument:P},play:async({canvas:e})=>{await F(e,{x:40,y:40})}},R={args:{zoom:1,saveStatus:`saved`,initialDocument:P},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await M.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},z={args:{zoom:.1,saveStatus:`failed`},play:async({canvas:e})=>{await M.click(e.getByRole(`button`,{name:`External System`})),await F(e,{x:48,y:48})}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved"
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},B=[`Default`,`AllProps`,`Editing`,`EdgeCases`]}))();export{L as AllProps,I as Default,z as EdgeCases,R as Editing,B as __namedExportsOrder,N as default};