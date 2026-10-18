import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{m as n,p as r,t as i}from"./src-B2MgXYIe.js";import{l as a,r as o,t as s,u as c}from"./sticky-CwM77GaN.js";import{n as l,t as u}from"./canvas-view-S3B-HBwv.js";var d,f,p,m,h,g,_,v,y,b,x,S,C,w;e((()=>{i(),c(),o(),l(),d=t(),{userEvent:f}=__STORYBOOK_MODULE_TEST__,p={component:u,parameters:{layout:`fullscreen`},decorators:[e=>(0,d.jsx)(`div`,{className:`canvas-view-story`,children:(0,d.jsx)(e,{})})]},m={event:`注文が確定した`,command:`注文を確定する`,actor:`購買担当`,aggregate:`注文`,policy:`在庫が足りなければ保留する`,readModel:`注文一覧`,externalSystem:`決済サービス`,hotspot:`在庫引当のタイミングは？`},h=a.all().map((e,t)=>{let i=t%4,a=Math.floor(t/4);return(0,d.jsx)(s,{sticky:r.create(n.create(`stk_${e.type}`),e.type,m[e.type],{x:24+i*190,y:24+a*168},e.defaultSize)},e.type)}),g={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saved`}},_={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saved`},render:e=>(0,d.jsx)(u,{...e,children:h})},v={args:{viewport:{x:0,y:0,zoom:1.5},saveStatus:`saving`},play:async({canvas:e})=>{await f.click(e.getByRole(`button`,{name:`Command`}))}},y={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`saving`}},b={args:{viewport:{x:0,y:0,zoom:1},saveStatus:`failed`}},x={args:{viewport:{x:0,y:0,zoom:.1},saveStatus:`saved`}},S={args:{viewport:{x:0,y:0,zoom:4},saveStatus:`saved`}},C={args:{viewport:{x:0,y:0,zoom:.1},saveStatus:`failed`},play:async({canvas:e})=>{await f.click(e.getByRole(`button`,{name:`External System`}))}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
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