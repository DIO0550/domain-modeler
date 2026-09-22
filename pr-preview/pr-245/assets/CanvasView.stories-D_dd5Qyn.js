import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{S as n,d as r,l as i,r as a,t as o,u as s,x as c}from"./sticky-DBQhz_S-.js";import{n as l,t as u}from"./canvas-view-1N6F0bD0.js";var d,f,p,m,h,g,_,v,y,b,x,S,C,w;e((()=>{r(),s(),a(),l(),d=t(),{userEvent:f}=__STORYBOOK_MODULE_TEST__,p={component:u,parameters:{layout:`fullscreen`},decorators:[e=>(0,d.jsx)(`div`,{className:`canvas-view-story`,children:(0,d.jsx)(e,{})})]},m={event:`注文が確定した`,command:`注文を確定する`,actor:`購買担当`,aggregate:`注文`,policy:`在庫が足りなければ保留する`,readModel:`注文一覧`,externalSystem:`決済サービス`,hotspot:`在庫引当のタイミングは？`},h=i.all().map((e,t)=>{let r=t%4,i=Math.floor(t/4);return(0,d.jsx)(o,{sticky:c.create(n.create(`stk_${e.type}`),e.type,m[e.type],{x:24+r*190,y:24+i*168},e.defaultSize)},e.type)}),g={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saved`}},_={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saved`},render:e=>(0,d.jsx)(u,{...e,children:h})},v={args:{viewport:{x:0,y:0,zoom:1.5},saveStatus:`saving`},play:async({canvas:e})=>{await f.click(e.getByRole(`button`,{name:`Command`}))}},y={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saving`}},b={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`failed`}},x={args:{viewport:{x:0,y:0,zoom:.1},saveStatus:`saved`}},S={args:{viewport:{x:0,y:0,zoom:4},saveStatus:`saved`}},C={args:{viewport:{x:0,y:0,zoom:.1},saveStatus:`failed`},play:async({canvas:e})=>{await f.click(e.getByRole(`button`,{name:`External System`}))}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    saveStatus: "saved"
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    saveStatus: "saved"
  },
  render: args => <CanvasView {...args}>{allStickies}</CanvasView>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1.5
    },
    saveStatus: "saving"
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "Command"
    }));
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    saveStatus: "saving"
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 1
    },
    saveStatus: "failed"
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 0.1
    },
    saveStatus: "saved"
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 4
    },
    saveStatus: "saved"
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    viewport: {
      x: 0,
      y: 0,
      zoom: 0.1
    },
    saveStatus: "failed"
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("button", {
      name: "External System"
    }));
  }
}`,...C.parameters?.docs?.source}}},w=[`Default`,`AllTypes`,`AllProps`,`Saving`,`Failed`,`ZoomMin`,`ZoomMax`,`EdgeCases`]}))();export{v as AllProps,_ as AllTypes,g as Default,C as EdgeCases,b as Failed,y as Saving,S as ZoomMax,x as ZoomMin,w as __namedExportsOrder,p as default};