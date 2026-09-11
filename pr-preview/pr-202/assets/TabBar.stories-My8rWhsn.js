import{n as e}from"./chunk-BneVvdWh.js";import{n as t,t as n}from"./tabs-BIepK38u.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";var i,a=e((()=>{i={atWrapped(e,t){if(e.length!==0)return e[(t%e.length+e.length)%e.length]}}}));function o({tabsState:e,onActivate:t}){let r=n.tabViews(e),a=n=>{if(e.status!==`active`||n.key!==`ArrowRight`&&n.key!==`ArrowLeft`)return;n.preventDefault();let a=n.key===`ArrowRight`?1:-1,o=r.findIndex(e=>e.activation===`active`),s=i.atWrapped(r,o+a);s!==void 0&&t(s.tab.path)};return(0,f.jsx)(`div`,{className:`tab-bar`,role:`tablist`,"aria-label":`開いている文書`,onKeyDown:a,children:r.map(e=>(0,f.jsx)(s,{view:e,onActivate:t},e.tab.path))})}function s({view:e,onActivate:t}){let{tab:n,caption:r,activation:i}=e,a=i===`active`;return(0,f.jsxs)(`button`,{type:`button`,role:`tab`,className:h(i,n),"aria-selected":a,"aria-label":g(n,r),title:n.path,tabIndex:0,onClick:()=>{t(n.path)},children:[(0,f.jsx)(d,{documentType:n.documentType}),(0,f.jsx)(`span`,{className:`tab-bar__file-name`,children:r.fileName}),(0,f.jsx)(c,{caption:r}),(0,f.jsx)(l,{fileState:n.fileState}),(0,f.jsx)(u,{backgroundChangeState:n.backgroundChangeState})]})}function c({caption:e}){return e.parentDirectorySupplement.status===`visible`?(0,f.jsx)(`span`,{className:`tab-bar__parent`,children:e.parentDirectorySupplement.directory}):null}function l({fileState:e}){return e.status===`missing`?(0,f.jsxs)(`svg`,{className:`tab-bar__warning`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,f.jsx)(`path`,{d:`M8 1.5 14.5 13h-13L8 1.5Z`,fill:`currentColor`}),(0,f.jsx)(`rect`,{x:`7.25`,y:`6`,width:`1.5`,height:`4`,fill:`#fff`}),(0,f.jsx)(`rect`,{x:`7.25`,y:`11`,width:`1.5`,height:`1.5`,fill:`#fff`})]}):null}function u({backgroundChangeState:e}){return e.status===`changed`?(0,f.jsx)(`span`,{className:`tab-bar__change-mark`,"aria-hidden":`true`}):null}function d({documentType:e}){return e===`canvas`?(0,f.jsxs)(`svg`,{className:`tab-bar__type-icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,f.jsx)(`rect`,{x:`2.5`,y:`3.5`,width:`11`,height:`9`,rx:`1.5`,fill:`currentColor`,opacity:`0.85`}),(0,f.jsx)(`path`,{d:`M5 7.5h6M5 10h4`,stroke:`#fff`,strokeWidth:`1.2`,strokeLinecap:`round`})]}):(0,f.jsxs)(`svg`,{className:`tab-bar__type-icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,f.jsx)(`path`,{d:`M4 2.5h5.5L12.5 6v7.5H4v-11Z`,fill:`currentColor`,opacity:`0.85`}),(0,f.jsx)(`path`,{d:`M9.5 2.5V6H12.5`,fill:`#fff`,opacity:`0.35`}),(0,f.jsx)(`path`,{d:`M6 8.5h4M6 11h3`,stroke:`#fff`,strokeWidth:`1.2`,strokeLinecap:`round`})]})}var f,p,m,h,g,_=e((()=>{a(),t(),f=r(),p={Canvas:`キャンバス`,Model:`ドメインモデル`},m=e=>e===`canvas`?p.Canvas:p.Model,h=(e,t)=>{let n=e===`active`?[`tab-bar__item--active`]:[],r=t.fileState.status===`missing`?[`tab-bar__item--missing`]:[];return[`tab-bar__item`,...n,...r].join(` `)},g=(e,t)=>{let n=t.parentDirectorySupplement.status===`visible`?t.parentDirectorySupplement.directory:``,r=e.fileState.status===`missing`?`ファイル欠損`:``,i=e.backgroundChangeState.status===`changed`?`未読の変更`:``;return[m(e.documentType),t.fileName,n,r,i].filter(e=>e.length>0).join(` `)}})),v,y,b,x,S,C,w,T,E,D,O,k,A;e((()=>{t(),_(),v=r(),{fn:y}=__STORYBOOK_MODULE_TEST__,b={component:o,args:{onActivate:y()},argTypes:{onActivate:{control:!1},tabsState:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,v.jsx)(`div`,{className:`tab-bar-story`,children:(0,v.jsx)(e,{})})]},x=(e,...t)=>[e,...t].reduce((e,t)=>n.reducer(e,{type:`openTab`,path:t.path,documentType:t.documentType}),n.create()),S=(e,t)=>t.reduce(n.reducer,e),C={args:{tabsState:x({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`})}},w={args:{tabsState:x({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`})}},T={args:{tabsState:S(x({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markBackgroundChanged`,path:`/Users/demo/shop/order.dcanvas`}])}},E={args:{tabsState:S(x({path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/Users/demo/shop/order.dmodel`}])}},D={args:{tabsState:S(x({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/warehouse/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/Users/demo/shop/order.dmodel`},{type:`markBackgroundChanged`,path:`/Users/demo/warehouse/order.dcanvas`},{type:`activateTab`,path:`/Users/demo/shop/order.dcanvas`}])}},O={args:{tabsState:n.create()}},k={args:{tabsState:S(x({path:`/home/user/shop/docs/very-long-domain-model-name.dcanvas`,documentType:`canvas`},{path:`/home/user/warehouse/docs/very-long-domain-model-name.dcanvas`,documentType:`canvas`},{path:`/order.dmodel`,documentType:`model`},{path:`/tmp/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/home/user/warehouse/docs/very-long-domain-model-name.dcanvas`},{type:`markBackgroundChanged`,path:`/tmp/order.dmodel`},{type:`activateTab`,path:`/home/user/shop/docs/very-long-domain-model-name.dcanvas`}])}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    })
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    })
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
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
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: applyActions(openTabs({
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    }), [{
      type: "markFileMissing",
      path: "/Users/demo/shop/order.dmodel"
    }])
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: TabsState.create()
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source}}},A=[`Default`,`Active`,`Background`,`Missing`,`AllProps`,`Empty`,`EdgeCases`]}))();export{w as Active,D as AllProps,T as Background,C as Default,k as EdgeCases,O as Empty,E as Missing,A as __namedExportsOrder,b as default};