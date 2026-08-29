import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-ffhv9kUB.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{a as i,c as a,d as o,f as s,i as c,l,n as u,o as d,r as f,s as p,t as m,u as h}from"./sticky-BVC0buL4.js";import{n as g,t as _}from"./canvas-view-h3jRnDF9.js";var v,y,b,x,S,C,w=t((()=>{i(),c(),v={create(e=a.empty()){return{history:d.create(e),workingDocument:e,selectedType:l.event,session:{status:`idle`}}},selectType(e,t){return{...e,selectedType:t}},clickAt(e,t){let n=v.commitEdit(e),r=a.stickyAt(n.workingDocument,t);return r.some?{...n,session:{status:`selected`,stickyId:r.value.id}}:y(n,t)},doubleClickAt(e,t){let n=v.commitEdit(e),r=a.stickyAt(n.workingDocument,t);return r.some?b(n,r.value):n},changeDraft(e,t){return e.session.status===`editing`?{...e,workingDocument:a.updateStickyText(e.workingDocument,e.session.stickyId,t),session:{...e.session,draftText:t}}:e},commitEdit(e){if(e.session.status!==`editing`)return e;let t={...e,session:{status:`selected`,stickyId:e.session.stickyId}};if(e.session.draftText===e.session.originalText)return{...t,workingDocument:e.history.current};let n=d.execute(e.history,p.create({previous:e.history.current,next:e.workingDocument}));return{...t,history:n,workingDocument:n.current}},pressEnter(e){if(e.session.status!==`selected`)return e;let t=C(e.workingDocument,e.session.stickyId);return t.some?b(e,t.value):{...e,session:{status:`idle`}}},pressEscape(e){return e.session.status===`editing`?v.commitEdit(e):e.session.status===`selected`?{...e,session:{status:`idle`}}:e},undo(e){let t=v.commitEdit(e),n=d.undo(t.history);return n.some?x(t,n.value):t},redo(e){let t=v.commitEdit(e),n=d.redo(t.history);return n.some?x(t,n.value):t},hasUndo(e){return d.undo(e.history).some},hasRedo(e){return d.redo(e.history).some}},y=(e,t)=>{let n=f.of(e.selectedType),r=a.addSticky(e.workingDocument,e.selectedType,``,t,n.defaultSize);if(!r.ok)return e;let i=r.value.stickies[r.value.stickies.length-1];if(i===void 0)return e;let o=d.execute(e.history,p.create({previous:e.history.current,next:r.value}));return{history:o,workingDocument:o.current,selectedType:e.selectedType,session:{status:`editing`,stickyId:i.id,draftText:``,originalText:``}}},b=(e,t)=>({...e,session:{status:`editing`,stickyId:t.id,draftText:t.text,originalText:t.text}}),x=(e,t)=>({...e,history:t,workingDocument:t.current,session:S(e.session,t.current)}),S=(e,t)=>e.status===`idle`?e:t.stickies.some(t=>t.id===e.stickyId)?e.status===`editing`?{status:`selected`,stickyId:e.stickyId}:e:{status:`idle`},C=(e,t)=>{let n=e.stickies.find(e=>e.id===t);return n===void 0?s.none():s.some(n)}}));function T(e){let[t,n]=(0,E.useState)(()=>v.create(e));return{selectedType:t.selectedType,session:t.session,stickies:t.workingDocument.stickies,hasUndo:v.hasUndo(t),hasRedo:v.hasRedo(t),selectType:e=>{n(t=>v.selectType(t,e))},clickAt:e=>{n(t=>v.clickAt(t,e))},doubleClickAt:e=>{n(t=>v.doubleClickAt(t,e))},changeDraft:e=>{n(t=>v.changeDraft(t,e))},commitEdit:()=>{n(v.commitEdit)},pressEnter:()=>{n(v.pressEnter)},pressEscape:()=>{n(v.pressEscape)},undo:()=>{n(v.undo)},redo:()=>{n(v.redo)}}}var E,D=t((()=>{E=e(n(),1),w()}));function O({zoom:e,saveStatus:t,initialDocument:n}){let r=T(n);return(0,k.jsx)(_,{zoom:e,saveStatus:t,undo:A(r.hasUndo,r.undo),redo:A(r.hasRedo,r.redo),selectedType:r.selectedType,onSelectType:r.selectType,onSurfaceClick:r.clickAt,onSurfaceDoubleClick:r.doubleClickAt,onSurfaceKeyDown:e=>{if(e===`Enter`){r.pressEnter();return}r.pressEscape()},children:r.stickies.map(e=>(0,k.jsx)(m,{sticky:e,chrome:j(r.session,e.id,{onDraftChange:r.changeDraft,onCommit:r.commitEdit})},e.id))})}var k,A,j,M=t((()=>{D(),u(),g(),k=r(),A=(e,t)=>e?{availability:`enabled`,onClick:t}:{availability:`disabled`},j=(e,t,n)=>e.status===`idle`||e.stickyId!==t?{status:`plain`}:e.status===`selected`?{status:`selected`}:{status:`editing`,draftText:e.draftText,onDraftChange:n.onDraftChange,onCommit:n.onCommit}})),N,P,F,I,L,R,z,B,V,H;t((()=>{i(),M(),N=r(),{userEvent:P}=__STORYBOOK_MODULE_TEST__,F={component:O,parameters:{layout:`fullscreen`},decorators:[e=>(0,N.jsx)(`div`,{className:`canvas-view-story`,children:(0,N.jsx)(e,{})})]},I={...a.empty(),stickies:[h.create(o.create(`stk_existing000`),l.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},L=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await P.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},R={args:{zoom:1,saveStatus:`saved`}},z={args:{zoom:1,saveStatus:`saving`,initialDocument:I},play:async({canvas:e})=>{await L(e,{x:40,y:40})}},B={args:{zoom:1,saveStatus:`saved`,initialDocument:I},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await P.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},V={args:{zoom:.1,saveStatus:`failed`},play:async({canvas:e})=>{await P.click(e.getByRole(`button`,{name:`External System`})),await L(e,{x:48,y:48})}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved"
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
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
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H=[`Default`,`AllProps`,`Editing`,`EdgeCases`]}))();export{z as AllProps,R as Default,V as EdgeCases,B as Editing,H as __namedExportsOrder,F as default};