import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-Zg5yInzD.js";import{t as r}from"./jsx-runtime-CxNpwo3G.js";var i=t((()=>{})),a=t((()=>{})),o=t((()=>{})),s=t((()=>{})),c=t((()=>{})),l=t((()=>{})),u,ee=t((()=>{u={event:`event`,actor:`actor`,command:`command`,policy:`policy`,aggregate:`aggregate`,readModel:`readModel`,externalSystem:`externalSystem`,hotspot:`hotspot`}})),te=t((()=>{})),ne=t((()=>{new Set([[`actor`,`command`],[`command`,`aggregate`],[`aggregate`,`event`],[`event`,`policy`],[`policy`,`command`],[`event`,`readModel`],[`readModel`,`actor`],[`command`,`externalSystem`],[`externalSystem`,`event`]].map(([e,t])=>`${e}->${t}`))})),re=t((()=>{})),ie=t((()=>{})),ae=t((()=>{})),d=t((()=>{})),f=t((()=>{})),p=t((()=>{d(),f()})),m=t((()=>{})),h=t((()=>{})),g=t((()=>{p()})),_=t((()=>{i(),a(),o(),s(),c(),l(),ee(),te(),ne(),ie(),re(),ae(),p(),h(),g(),m()})),v,y,b,x,oe=t((()=>{_(),v={orange:`orange`,blue:`blue`,yellow:`yellow`,purple:`purple`,green:`green`,pink:`pink`,red:`red`},y=[u.event,u.command,u.actor,u.aggregate,u.policy,u.readModel,u.externalSystem,u.hotspot],b={event:{type:u.event,caption:`Domain Event`,colorFamily:v.orange,defaultSize:{width:160,height:100}},command:{type:u.command,caption:`Command`,colorFamily:v.blue,defaultSize:{width:160,height:100}},actor:{type:u.actor,caption:`Actor`,colorFamily:v.yellow,defaultSize:{width:120,height:80}},aggregate:{type:u.aggregate,caption:`Aggregate`,colorFamily:v.yellow,defaultSize:{width:200,height:140}},policy:{type:u.policy,caption:`Policy`,colorFamily:v.purple,defaultSize:{width:160,height:100}},readModel:{type:u.readModel,caption:`Read Model`,colorFamily:v.green,defaultSize:{width:160,height:100}},externalSystem:{type:u.externalSystem,caption:`External System`,colorFamily:v.pink,defaultSize:{width:160,height:100}},hotspot:{type:u.hotspot,caption:`Hotspot`,colorFamily:v.red,defaultSize:{width:140,height:100}}},x={of(e){return b[e]},all(){return y.map(e=>b[e])}}})),S,C,w=t((()=>{S={saved:`保存済み`,saving:`保存中`,failed:`保存に失敗`},C={create(e){return{status:e,label:S[e]}}}})),T,E=t((()=>{T={toPercent(e){return`${Math.round(e*100)}%`}}}));function D({zoom:e,saveStatus:t,undo:n,redo:r}){let[i,a]=(0,F.useState)(u.event),o=x.all(),s=C.create(t),c=T.toPercent(e);return(0,I.jsxs)(`div`,{className:`canvas-view`,children:[(0,I.jsxs)(O,{children:[(0,I.jsx)(k,{appearances:o,selectedType:i,onSelectType:a}),(0,I.jsx)(A,{undo:n,redo:r})]}),(0,I.jsx)(N,{}),(0,I.jsx)(P,{saveIndicator:s,zoomLabel:c})]})}function O({children:e}){return(0,I.jsx)(`div`,{className:`canvas-toolbar`,role:`group`,"aria-label":`キャンバスツール`,children:e})}function k({appearances:e,selectedType:t,onSelectType:n}){return(0,I.jsx)(`div`,{className:`canvas-palette`,role:`group`,"aria-label":`付箋種別`,children:e.map(e=>(0,I.jsx)(j,{appearance:e,selected:e.type===t,onSelect:n},e.type))})}function A({undo:e,redo:t}){return(0,I.jsxs)(`div`,{className:`canvas-history`,role:`group`,"aria-label":`履歴`,children:[(0,I.jsx)(M,{label:`元に戻す`,button:e}),(0,I.jsx)(M,{label:`やり直す`,button:t})]})}function j({appearance:e,selected:t,onSelect:n}){return(0,I.jsxs)(`button`,{type:`button`,className:L(t),"aria-pressed":t,"aria-label":e.caption,onClick:()=>{n(e.type)},children:[(0,I.jsx)(`span`,{className:`canvas-palette__swatch`,"data-sticky-type":e.type,"aria-hidden":`true`}),(0,I.jsx)(`span`,{className:`canvas-palette__caption`,children:e.caption})]})}function M({label:e,button:t}){let n=t.availability===`disabled`;return(0,I.jsx)(`button`,{type:`button`,className:R(t.availability),"aria-disabled":n,onClick:()=>{t.availability!==`disabled`&&t.onClick()},children:e})}function N(){return(0,I.jsx)(`div`,{className:`canvas-surface`,role:`region`,"aria-label":`キャンバス`})}function P({saveIndicator:e,zoomLabel:t}){return(0,I.jsxs)(`div`,{className:`canvas-status`,children:[(0,I.jsx)(`span`,{className:`canvas-status__save`,"data-save-status":e.status,role:`status`,children:e.label}),(0,I.jsx)(`span`,{className:`canvas-status__zoom`,"aria-label":`ズーム ${t}`,children:t})]})}var F,I,L,R,z=t((()=>{F=e(n(),1),_(),oe(),w(),E(),I=r(),L=e=>[`canvas-palette__button`,...e?[`canvas-palette__button--selected`]:[]].join(` `),R=e=>[`canvas-history__button`,...e===`disabled`?[`canvas-history__button--disabled`]:[]].join(` `)})),B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{z(),B=r(),{fn:V,userEvent:H}=__STORYBOOK_MODULE_TEST__,U={availability:`disabled`},W={component:D,argTypes:{undo:{control:!1},redo:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,B.jsx)(`div`,{className:`canvas-view-story`,children:(0,B.jsx)(e,{})})]},G={args:{zoom:1,saveStatus:`saved`,undo:U,redo:U}},K={args:{zoom:1.5,saveStatus:`saving`,undo:{availability:`enabled`,onClick:V()},redo:{availability:`enabled`,onClick:V()}},play:async({canvas:e})=>{await H.click(e.getByRole(`button`,{name:`Command`}))}},q={args:{zoom:1,saveStatus:`saving`,undo:U,redo:U}},J={args:{zoom:1,saveStatus:`failed`,undo:U,redo:U}},Y={args:{zoom:1,saveStatus:`saved`,undo:{availability:`enabled`,onClick:V()},redo:{availability:`enabled`,onClick:V()}}},X={args:{zoom:.1,saveStatus:`saved`,undo:U,redo:U}},Z={args:{zoom:4,saveStatus:`saved`,undo:U,redo:U}},Q={args:{zoom:.1,saveStatus:`failed`,undo:{availability:`enabled`,onClick:V()},redo:{availability:`disabled`}},play:async({canvas:e})=>{await H.click(e.getByRole(`button`,{name:`External System`}))}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
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
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "saving",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 1,
    saveStatus: "failed",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 0.1,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  args: {
    zoom: 4,
    saveStatus: "saved",
    undo: disabledHistory,
    redo: disabledHistory
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
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
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`AllProps`,`Saving`,`Failed`,`HistoryEnabled`,`ZoomMin`,`ZoomMax`,`EdgeCases`]}))();export{K as AllProps,G as Default,Q as EdgeCases,J as Failed,Y as HistoryEnabled,q as Saving,Z as ZoomMax,X as ZoomMin,$ as __namedExportsOrder,W as default};