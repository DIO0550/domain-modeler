import{n as e}from"./chunk-BneVvdWh.js";import{i as t,n,r,t as i}from"./tabs-B6nccKQI.js";import{t as a}from"./jsx-runtime-DXFqSddf.js";import{r as o}from"./sticky-BNlaW-ul.js";import{n as s}from"./canvas-view-BR-C8z17.js";import{i as c,n as l,r as u}from"./canvas-editor-Cy9beYzp.js";import{n as d}from"./connection-layer-Dpg2N8N-.js";import{n as f,t as p}from"./ArrayEx-DeF81wZi.js";var m=e((()=>{s(),l(),d(),c(),o()}));function h({tabsState:e,onActivate:t,historyControls:n}){let r=i.tabViews(e),a=n=>{if(e.status!==`active`||n.key!==`ArrowRight`&&n.key!==`ArrowLeft`)return;n.preventDefault();let i=n.key===`ArrowRight`?1:-1,a=r.findIndex(e=>e.activation===`active`),o=p.atWrapped(r,a+i);o!==void 0&&t(o.tab.path)};return(0,x.jsxs)(`div`,{className:`tab-bar`,children:[(0,x.jsx)(`div`,{className:`tab-bar__tabs`,role:`tablist`,"aria-label":`開いている文書`,onKeyDown:a,children:r.map(e=>(0,x.jsx)(g,{view:e,onActivate:t},e.tab.path))}),(0,x.jsx)(u,{value:n})]})}function g({view:e,onActivate:t}){let{tab:n,caption:i,activation:a}=e,o=a===`active`;return(0,x.jsxs)(`button`,{type:`button`,role:`tab`,className:w(a,n),"aria-selected":o,"aria-label":T(n,i),title:r(n.path),tabIndex:0,onClick:()=>{t(n.path)},children:[(0,x.jsx)(b,{documentType:n.documentType}),(0,x.jsx)(`span`,{className:`tab-bar__file-name`,children:i.fileName}),(0,x.jsx)(_,{caption:i}),(0,x.jsx)(v,{fileState:n.fileState}),(0,x.jsx)(y,{backgroundChangeState:n.backgroundChangeState})]})}function _({caption:e}){return e.parentDirectorySupplement.status===`visible`?(0,x.jsx)(`span`,{className:`tab-bar__parent`,children:e.parentDirectorySupplement.directory}):null}function v({fileState:e}){return e.status===`missing`?(0,x.jsxs)(`svg`,{className:`tab-bar__warning`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,x.jsx)(`path`,{d:`M8 1.5 14.5 13h-13L8 1.5Z`,fill:`currentColor`}),(0,x.jsx)(`rect`,{x:`7.25`,y:`6`,width:`1.5`,height:`4`,fill:`#fff`}),(0,x.jsx)(`rect`,{x:`7.25`,y:`11`,width:`1.5`,height:`1.5`,fill:`#fff`})]}):null}function y({backgroundChangeState:e}){return e.status===`changed`?(0,x.jsx)(`span`,{className:`tab-bar__change-mark`,"aria-hidden":`true`}):null}function b({documentType:e}){return e===`canvas`?(0,x.jsxs)(`svg`,{className:`tab-bar__type-icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,x.jsx)(`rect`,{x:`2.5`,y:`3.5`,width:`11`,height:`9`,rx:`1.5`,fill:`currentColor`,opacity:`0.85`}),(0,x.jsx)(`path`,{d:`M5 7.5h6M5 10h4`,stroke:`#fff`,strokeWidth:`1.2`,strokeLinecap:`round`})]}):(0,x.jsxs)(`svg`,{className:`tab-bar__type-icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,x.jsx)(`path`,{d:`M4 2.5h5.5L12.5 6v7.5H4v-11Z`,fill:`currentColor`,opacity:`0.85`}),(0,x.jsx)(`path`,{d:`M9.5 2.5V6H12.5`,fill:`#fff`,opacity:`0.35`}),(0,x.jsx)(`path`,{d:`M6 8.5h4M6 11h3`,stroke:`#fff`,strokeWidth:`1.2`,strokeLinecap:`round`})]})}var x,S,C,w,T,E=e((()=>{m(),t(),f(),n(),x=a(),S={Canvas:`キャンバス`,Model:`ドメインモデル`},C=e=>e===`canvas`?S.Canvas:S.Model,w=(e,t)=>{let n=e===`active`?[`tab-bar__item--active`]:[],r=t.fileState.status===`missing`?[`tab-bar__item--missing`]:[];return[`tab-bar__item`,...n,...r].join(` `)},T=(e,t)=>{let n=t.parentDirectorySupplement.status===`visible`?t.parentDirectorySupplement.directory:``,r=e.fileState.status===`missing`?`ファイル欠損`:``,i=e.backgroundChangeState.status===`changed`?`未読の変更`:``;return[C(e.documentType),t.fileName,n,r,i].filter(e=>e.length>0).join(` `)}})),D,O,k,A,j,M,N,P,F,I,L,R,z;e((()=>{n(),E(),D=a(),{fn:O}=__STORYBOOK_MODULE_TEST__,k={component:h,args:{onActivate:O()},argTypes:{onActivate:{control:!1},tabsState:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,D.jsx)(`div`,{className:`tab-bar-story`,children:(0,D.jsx)(e,{})})]},A=(e,...t)=>[e,...t].reduce((e,t)=>i.reducer(e,{type:`openTab`,path:t.path,documentType:t.documentType}),i.create()),j=(e,t)=>t.reduce(i.reducer,e),M={args:{tabsState:A({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`})}},N={args:{tabsState:A({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`})}},P={args:{tabsState:j(A({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markBackgroundChanged`,path:`/Users/demo/shop/order.dcanvas`}])}},F={args:{tabsState:j(A({path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/Users/demo/shop/order.dmodel`}])}},I={args:{tabsState:j(A({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/warehouse/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/Users/demo/shop/order.dmodel`},{type:`markBackgroundChanged`,path:`/Users/demo/warehouse/order.dcanvas`},{type:`activateTab`,path:`/Users/demo/shop/order.dcanvas`}])}},L={args:{tabsState:i.create()}},R={args:{tabsState:j(A({path:`/home/user/shop/docs/very-long-domain-model-name.dcanvas`,documentType:`canvas`},{path:`/home/user/warehouse/docs/very-long-domain-model-name.dcanvas`,documentType:`canvas`},{path:`/order.dmodel`,documentType:`model`},{path:`/tmp/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/home/user/warehouse/docs/very-long-domain-model-name.dcanvas`},{type:`markBackgroundChanged`,path:`/tmp/order.dmodel`},{type:`activateTab`,path:`/home/user/shop/docs/very-long-domain-model-name.dcanvas`}])}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    })
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    })
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: applyActions(openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    }), [{
      type: "markBackgroundChanged",
      path: "/Users/demo/shop/order.dcanvas"
    }])
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: applyActions(openTabs({
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    }), [{
      type: "markFileMissing",
      path: "/Users/demo/shop/order.dmodel"
    }])
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: applyActions(openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/warehouse/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    }), [{
      type: "markFileMissing",
      path: "/Users/demo/shop/order.dmodel"
    }, {
      type: "markBackgroundChanged",
      path: "/Users/demo/warehouse/order.dcanvas"
    }, {
      type: "activateTab",
      path: "/Users/demo/shop/order.dcanvas"
    }])
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: TabsState.create()
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: applyActions(openTabs({
      path: "/home/user/shop/docs/very-long-domain-model-name.dcanvas",
      documentType: "canvas"
    }, {
      path: "/home/user/warehouse/docs/very-long-domain-model-name.dcanvas",
      documentType: "canvas"
    }, {
      path: "/order.dmodel",
      documentType: "model"
    }, {
      path: "/tmp/order.dmodel",
      documentType: "model"
    }), [{
      type: "markFileMissing",
      path: "/home/user/warehouse/docs/very-long-domain-model-name.dcanvas"
    }, {
      type: "markBackgroundChanged",
      path: "/tmp/order.dmodel"
    }, {
      type: "activateTab",
      path: "/home/user/shop/docs/very-long-domain-model-name.dcanvas"
    }])
  }
}`,...R.parameters?.docs?.source}}},z=[`Default`,`Active`,`Background`,`Missing`,`AllProps`,`Empty`,`EdgeCases`]}))();export{N as Active,I as AllProps,P as Background,M as Default,R as EdgeCases,L as Empty,F as Missing,z as __namedExportsOrder,k as default};