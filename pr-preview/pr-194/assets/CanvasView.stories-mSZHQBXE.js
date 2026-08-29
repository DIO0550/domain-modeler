import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{a as n,d as r,i,n as a,r as o,t as s,u as c}from"./sticky-BVC0buL4.js";import{n as l,t as u}from"./canvas-view-h3jRnDF9.js";var d,f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D;e((()=>{n(),i(),a(),l(),d=t(),{fn:f,userEvent:p}=__STORYBOOK_MODULE_TEST__,m={availability:`disabled`},h={component:u,argTypes:{undo:{control:!1},redo:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,d.jsx)(`div`,{className:`canvas-view-story`,children:(0,d.jsx)(e,{})})]},g={event:`注文が確定した`,command:`注文を確定する`,actor:`購買担当`,aggregate:`注文`,policy:`在庫が足りなければ保留する`,readModel:`注文一覧`,externalSystem:`決済サービス`,hotspot:`在庫引当のタイミングは？`},_=o.all().map((e,t)=>{let n=t%4,i=Math.floor(t/4);return(0,d.jsx)(s,{sticky:c.create(r.create(`stk_${e.type}`),e.type,g[e.type],{x:24+n*190,y:24+i*168},e.defaultSize)},e.type)}),v={args:{zoom:1,saveStatus:`saved`,undo:m,redo:m}},y={args:{zoom:1,saveStatus:`saved`,undo:m,redo:m},render:e=>(0,d.jsx)(u,{...e,children:_})},b={args:{zoom:1.5,saveStatus:`saving`,undo:{availability:`enabled`,onClick:f()},redo:{availability:`enabled`,onClick:f()}},play:async({canvas:e})=>{await p.click(e.getByRole(`button`,{name:`Command`}))}},x={args:{zoom:1,saveStatus:`saving`,undo:m,redo:m}},S={args:{zoom:1,saveStatus:`failed`,undo:m,redo:m}},C={args:{zoom:1,saveStatus:`saved`,undo:{availability:`enabled`,onClick:f()},redo:{availability:`enabled`,onClick:f()}}},w={args:{zoom:.1,saveStatus:`saved`,undo:m,redo:m}},T={args:{zoom:4,saveStatus:`saved`,undo:m,redo:m}},E={args:{zoom:.1,saveStatus:`failed`,undo:{availability:`enabled`,onClick:f()},redo:{availability:`disabled`}},play:async({canvas:e})=>{await p.click(e.getByRole(`button`,{name:`External System`}))}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  },
  render: args => <CanvasView {...args}>{allStickies}</CanvasView>
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1.5,
    saveStatus: "saving",
    undo: {
      availability: "enabled",
      onClick: fn()
    },
    redo: {
      availability: "enabled",
      onClick: fn()
    }
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "Command"
    }));
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saving",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "failed",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: {
      availability: "enabled",
      onClick: fn()
    },
    redo: {
      availability: "enabled",
      onClick: fn()
    }
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 0.1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 4,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 0.1,
    saveStatus: "failed",
    undo: {
      availability: "enabled",
      onClick: fn()
    },
    redo: {
      availability: "disabled"
    }
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "External System"
    }));
  }
}`,...E.parameters?.docs?.source}}},D=[`Default`,`AllTypes`,`AllProps`,`Saving`,`Failed`,`HistoryEnabled`,`ZoomMin`,`ZoomMax`,`EdgeCases`]}))();export{b as AllProps,y as AllTypes,v as Default,E as EdgeCases,S as Failed,C as HistoryEnabled,x as Saving,T as ZoomMax,w as ZoomMin,D as __namedExportsOrder,h as default};