import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{S as n,b as r,d as i,f as a,x as o}from"./sticky-DHnz9Xm5.js";import{n as s,t as c}from"./canvas-editor-DYqtljyO.js";var l,u,d,f,p,m,h,g,_,v,y,b;e((()=>{i(),s(),l=t(),{userEvent:u}=__STORYBOOK_MODULE_TEST__,d={component:c,parameters:{layout:`fullscreen`},decorators:[e=>(0,l.jsx)(`div`,{className:`canvas-view-story`,children:(0,l.jsx)(e,{})})]},f={...a.empty(),stickies:[o.create(n.create(`stk_existing000`),r.event,`注文が確定した`,{x:24,y:24},{width:160,height:100})]},p={...f,stickies:[...f.stickies,o.create(n.create(`stk_command0000`),r.command,`通知する`,{x:280,y:24},{width:160,height:100})]},m=async(e,t)=>{let n=e.getByRole(`region`,{name:`キャンバス`}),r=n.getBoundingClientRect();await u.pointer({keys:`[MouseLeft]`,target:n,coords:{clientX:r.left+t.x,clientY:r.top+t.y}})},h={args:{saveStatus:`saved`}},g={args:{saveStatus:`saving`,initialDocument:f},play:async({canvas:e})=>{await m(e,{x:40,y:40})}},_={args:{saveStatus:`saved`,initialDocument:f},play:async({canvas:e})=>{let t=e.getByRole(`region`,{name:`キャンバス`}),n=t.getBoundingClientRect();await u.pointer({keys:`[MouseLeft][MouseLeft]`,target:t,coords:{clientX:n.left+40,clientY:n.top+40}})}},v={args:{saveStatus:`saved`,initialDocument:p},play:async({canvas:e})=>{await u.click(e.getByRole(`button`,{name:`接続`})),await m(e,{x:48,y:48}),await m(e,{x:304,y:48})}},y={args:{saveStatus:`failed`,initialDocument:{...a.empty(),viewport:{x:0,y:0,zoom:.1}}},play:async({canvas:e})=>{await u.click(e.getByRole(`button`,{name:`External System`})),await m(e,{x:48,y:48})}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    saveStatus: "saved"
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
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
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
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
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b=[`Default`,`AllProps`,`Editing`,`CreatingConnection`,`EdgeCases`]}))();export{g as AllProps,v as CreatingConnection,h as Default,y as EdgeCases,_ as Editing,b as __namedExportsOrder,d as default};