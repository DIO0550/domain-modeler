import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-CzOgQVi8.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{a as i,c as a,i as o,n as s,o as c,r as l,s as u,t as d}from"./sticky-z9HpVDdj.js";var f,p,m=t((()=>{f={saved:`保存済み`,saving:`保存中`,failed:`保存に失敗`},p={create(e){return{status:e,label:f[e]}}}})),h,g=t((()=>{h={toPercent(e){return`${Math.round(e*100)}%`}}}));function _({zoom:e,saveStatus:t,undo:n,redo:r,children:i}){let[a,o]=(0,T.useState)(c.event),s=l.all(),u=p.create(t),d=h.toPercent(e);return(0,E.jsxs)(`div`,{className:`canvas-view`,children:[(0,E.jsxs)(v,{children:[(0,E.jsx)(y,{appearances:s,selectedType:a,onSelectType:o}),(0,E.jsx)(b,{undo:n,redo:r})]}),(0,E.jsx)(C,{children:i}),(0,E.jsx)(w,{saveIndicator:u,zoomLabel:d})]})}function v({children:e}){return(0,E.jsx)(`div`,{className:`canvas-toolbar`,role:`group`,"aria-label":`キャンバスツール`,children:e})}function y({appearances:e,selectedType:t,onSelectType:n}){return(0,E.jsx)(`div`,{className:`canvas-palette`,role:`group`,"aria-label":`付箋種別`,children:e.map(e=>(0,E.jsx)(x,{appearance:e,selected:e.type===t,onSelect:n},e.type))})}function b({undo:e,redo:t}){return(0,E.jsxs)(`div`,{className:`canvas-history`,role:`group`,"aria-label":`履歴`,children:[(0,E.jsx)(S,{label:`元に戻す`,button:e}),(0,E.jsx)(S,{label:`やり直す`,button:t})]})}function x({appearance:e,selected:t,onSelect:n}){return(0,E.jsxs)(`button`,{type:`button`,className:D(t),"aria-pressed":t,"aria-label":e.caption,onClick:()=>{n(e.type)},children:[(0,E.jsx)(`span`,{className:`canvas-palette__swatch`,"data-sticky-type":e.type,"aria-hidden":`true`}),(0,E.jsx)(`span`,{className:`canvas-palette__caption`,children:e.caption})]})}function S({label:e,button:t}){let n=t.availability===`disabled`;return(0,E.jsx)(`button`,{type:`button`,className:O(t.availability),"aria-disabled":n,onClick:()=>{t.availability!==`disabled`&&t.onClick()},children:e})}function C({children:e}){return(0,E.jsx)(`div`,{className:`canvas-surface`,role:`region`,"aria-label":`キャンバス`,children:e})}function w({saveIndicator:e,zoomLabel:t}){return(0,E.jsxs)(`div`,{className:`canvas-status`,children:[(0,E.jsx)(`span`,{className:`canvas-status__save`,"data-save-status":e.status,role:`status`,children:e.label}),(0,E.jsx)(`span`,{className:`canvas-status__zoom`,"aria-label":`ズーム ${t}`,children:t})]})}var T,E,D,O,k=t((()=>{T=e(n(),1),i(),o(),m(),g(),E=r(),D=e=>[`canvas-palette__button`,...e?[`canvas-palette__button--selected`]:[]].join(` `),O=e=>[`canvas-history__button`,...e===`disabled`?[`canvas-history__button--disabled`]:[]].join(` `)})),A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K;t((()=>{i(),o(),s(),k(),A=r(),{fn:j,userEvent:M}=__STORYBOOK_MODULE_TEST__,N={availability:`disabled`},P={component:_,argTypes:{undo:{control:!1},redo:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,A.jsx)(`div`,{className:`canvas-view-story`,children:(0,A.jsx)(e,{})})]},F={event:`注文が確定した`,command:`注文を確定する`,actor:`購買担当`,aggregate:`注文`,policy:`在庫が足りなければ保留する`,readModel:`注文一覧`,externalSystem:`決済サービス`,hotspot:`在庫引当のタイミングは？`},I=l.all().map((e,t)=>{let n=t%4,r=Math.floor(t/4);return(0,A.jsx)(d,{sticky:u.create(a.create(`stk_${e.type}`),e.type,F[e.type],{x:24+n*190,y:24+r*168},e.defaultSize)},e.type)}),L={args:{zoom:1,saveStatus:`saved`,undo:N,redo:N}},R={args:{zoom:1,saveStatus:`saved`,undo:N,redo:N},render:e=>(0,A.jsx)(_,{...e,children:I})},z={args:{zoom:1.5,saveStatus:`saving`,undo:{availability:`enabled`,onClick:j()},redo:{availability:`enabled`,onClick:j()}},play:async({canvas:e})=>{await M.click(e.getByRole(`button`,{name:`Command`}))}},B={args:{zoom:1,saveStatus:`saving`,undo:N,redo:N}},V={args:{zoom:1,saveStatus:`failed`,undo:N,redo:N}},H={args:{zoom:1,saveStatus:`saved`,undo:{availability:`enabled`,onClick:j()},redo:{availability:`enabled`,onClick:j()}}},U={args:{zoom:.1,saveStatus:`saved`,undo:N,redo:N}},W={args:{zoom:4,saveStatus:`saved`,undo:N,redo:N}},G={args:{zoom:.1,saveStatus:`failed`,undo:{availability:`enabled`,onClick:j()},redo:{availability:`disabled`}},play:async({canvas:e})=>{await M.click(e.getByRole(`button`,{name:`External System`}))}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  },
  render: args => <CanvasView {...args}>{allStickies}</CanvasView>
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saving",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "failed",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
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
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 0.1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 4,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
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
}`,...G.parameters?.docs?.source}}},K=[`Default`,`AllTypes`,`AllProps`,`Saving`,`Failed`,`HistoryEnabled`,`ZoomMin`,`ZoomMax`,`EdgeCases`]}))();export{z as AllProps,R as AllTypes,L as Default,G as EdgeCases,V as Failed,H as HistoryEnabled,B as Saving,W as ZoomMax,U as ZoomMin,K as __namedExportsOrder,P as default};