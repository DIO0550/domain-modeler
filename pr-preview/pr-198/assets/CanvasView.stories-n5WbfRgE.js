import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{c as n,l as r,r as i,s as a,t as o,v as s,y as c}from"./sticky-BI2Y8npt.js";import{n as l,r as u,t as d}from"./canvas-view-BhX-oMRF.js";var f,p,m,h,g,_,v,y,b,x,S,C,w,T,E,D,O;e((()=>{r(),n(),i(),u(),f=t(),{fn:p,userEvent:m}=__STORYBOOK_MODULE_TEST__,h=l.disabled(),g={component:d,argTypes:{undo:{control:!1},redo:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,f.jsx)(`div`,{className:`canvas-view-story`,children:(0,f.jsx)(e,{})})]},_={event:`注文が確定した`,command:`注文を確定する`,actor:`購買担当`,aggregate:`注文`,policy:`在庫が足りなければ保留する`,readModel:`注文一覧`,externalSystem:`決済サービス`,hotspot:`在庫引当のタイミングは？`},v=a.all().map((e,t)=>{let n=t%4,r=Math.floor(t/4);return(0,f.jsx)(o,{sticky:s.create(c.create(`stk_${e.type}`),e.type,_[e.type],{x:24+n*190,y:24+r*168},e.defaultSize)},e.type)}),y={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saved`,undo:h,redo:h}},b={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saved`,undo:h,redo:h},render:e=>(0,f.jsx)(d,{...e,children:v})},x={args:{viewport:{x:0,y:0,zoom:1.5},saveStatus:`saving`,undo:{availability:`enabled`,onClick:p()},redo:{availability:`enabled`,onClick:p()}},play:async({canvas:e})=>{await m.click(e.getByRole(`button`,{name:`Command`}))}},S={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saving`,undo:h,redo:h}},C={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`failed`,undo:h,redo:h}},w={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saved`,undo:{availability:`enabled`,onClick:p()},redo:{availability:`enabled`,onClick:p()}}},T={args:{viewport:{x:0,y:0,zoom:.1},saveStatus:`saved`,undo:h,redo:h}},E={args:{viewport:{x:0,y:0,zoom:4},saveStatus:`saved`,undo:h,redo:h}},D={args:{viewport:{x:0,y:0,zoom:.1},saveStatus:`failed`,undo:l.enabled(p()),redo:l.disabled()},play:async({canvas:e})=>{await m.click(e.getByRole(`button`,{name:`External System`}))}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  },
  render: args => <CanvasView {...args}>{allStickies}</CanvasView>
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1.5
    },
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
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    saveStatus: "saving",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    saveStatus: "failed",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
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
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 0.1
    },
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 4
    },
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 0.1
    },
    saveStatus: "failed",
    undo: HistoryButton.enabled(fn()),
    redo: HistoryButton.disabled()
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "External System"
    }));
  }
}`,...D.parameters?.docs?.source}}},O=[`Default`,`AllTypes`,`AllProps`,`Saving`,`Failed`,`HistoryEnabled`,`ZoomMin`,`ZoomMax`,`EdgeCases`]}))();export{x as AllProps,b as AllTypes,y as Default,D as EdgeCases,C as Failed,w as HistoryEnabled,S as Saving,E as ZoomMax,T as ZoomMin,O as __namedExportsOrder,g as default};