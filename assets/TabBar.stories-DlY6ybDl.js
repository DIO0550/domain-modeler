import{n as e}from"./chunk-BneVvdWh.js";import{i as t,n,r,t as i}from"./tabs-DE3EDpFQ.js";import{t as a}from"./jsx-runtime-DXFqSddf.js";import{n as o,t as s}from"./ArrayEx-Bbpoyik5.js";function c({tabsState:e,onActivate:t}){let n=i.tabViews(e),r=r=>{if(e.status!==`active`||r.key!==`ArrowRight`&&r.key!==`ArrowLeft`)return;r.preventDefault();let i=r.key===`ArrowRight`?1:-1,a=n.findIndex(e=>e.activation===`active`),o=s.atWrapped(n,a+i);o!==void 0&&t(o.tab.path)};return(0,m.jsx)(`div`,{className:`tab-bar`,role:`tablist`,"aria-label":`開いている文書`,onKeyDown:r,children:n.map(e=>(0,m.jsx)(l,{view:e,onActivate:t},e.tab.path))})}function l({view:e,onActivate:t}){let{tab:n,caption:i,activation:a}=e,o=a===`active`;return(0,m.jsxs)(`button`,{type:`button`,role:`tab`,className:_(a,n),"aria-selected":o,"aria-label":v(n,i),title:r(n.path),tabIndex:0,onClick:()=>{t(n.path)},children:[(0,m.jsx)(p,{documentType:n.documentType}),(0,m.jsx)(`span`,{className:`tab-bar__file-name`,children:i.fileName}),(0,m.jsx)(u,{caption:i}),(0,m.jsx)(d,{fileState:n.fileState}),(0,m.jsx)(f,{backgroundChangeState:n.backgroundChangeState})]})}function u({caption:e}){return e.parentDirectorySupplement.status===`visible`?(0,m.jsx)(`span`,{className:`tab-bar__parent`,children:e.parentDirectorySupplement.directory}):null}function d({fileState:e}){return e.status===`missing`?(0,m.jsxs)(`svg`,{className:`tab-bar__warning`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,m.jsx)(`path`,{d:`M8 1.5 14.5 13h-13L8 1.5Z`,fill:`currentColor`}),(0,m.jsx)(`rect`,{x:`7.25`,y:`6`,width:`1.5`,height:`4`,fill:`#fff`}),(0,m.jsx)(`rect`,{x:`7.25`,y:`11`,width:`1.5`,height:`1.5`,fill:`#fff`})]}):null}function f({backgroundChangeState:e}){return e.status===`changed`?(0,m.jsx)(`span`,{className:`tab-bar__change-mark`,"aria-hidden":`true`}):null}function p({documentType:e}){return e===`canvas`?(0,m.jsxs)(`svg`,{className:`tab-bar__type-icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,m.jsx)(`rect`,{x:`2.5`,y:`3.5`,width:`11`,height:`9`,rx:`1.5`,fill:`currentColor`,opacity:`0.85`}),(0,m.jsx)(`path`,{d:`M5 7.5h6M5 10h4`,stroke:`#fff`,strokeWidth:`1.2`,strokeLinecap:`round`})]}):(0,m.jsxs)(`svg`,{className:`tab-bar__type-icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,m.jsx)(`path`,{d:`M4 2.5h5.5L12.5 6v7.5H4v-11Z`,fill:`currentColor`,opacity:`0.85`}),(0,m.jsx)(`path`,{d:`M9.5 2.5V6H12.5`,fill:`#fff`,opacity:`0.35`}),(0,m.jsx)(`path`,{d:`M6 8.5h4M6 11h3`,stroke:`#fff`,strokeWidth:`1.2`,strokeLinecap:`round`})]})}var m,h,g,_,v,y=e((()=>{t(),o(),n(),m=a(),h={Canvas:`キャンバス`,Model:`ドメインモデル`},g=e=>e===`canvas`?h.Canvas:h.Model,_=(e,t)=>{let n=e===`active`?[`tab-bar__item--active`]:[],r=t.fileState.status===`missing`?[`tab-bar__item--missing`]:[];return[`tab-bar__item`,...n,...r].join(` `)},v=(e,t)=>{let n=t.parentDirectorySupplement.status===`visible`?t.parentDirectorySupplement.directory:``,r=e.fileState.status===`missing`?`ファイル欠損`:``,i=e.backgroundChangeState.status===`changed`?`未読の変更`:``;return[g(e.documentType),t.fileName,n,r,i].filter(e=>e.length>0).join(` `)}})),b,x,S,C,w,T,E,D,O,k,A,j,M;e((()=>{n(),y(),b=a(),{fn:x}=__STORYBOOK_MODULE_TEST__,S={component:c,args:{onActivate:x()},argTypes:{onActivate:{control:!1},tabsState:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,b.jsx)(`div`,{className:`tab-bar-story`,children:(0,b.jsx)(e,{})})]},C=(e,...t)=>[e,...t].reduce((e,t)=>i.reducer(e,{type:`openTab`,path:t.path,documentType:t.documentType}),i.create()),w=(e,t)=>t.reduce(i.reducer,e),T={args:{tabsState:C({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`})}},E={args:{tabsState:C({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`})}},D={args:{tabsState:w(C({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markBackgroundChanged`,path:`/Users/demo/shop/order.dcanvas`}])}},O={args:{tabsState:w(C({path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/Users/demo/shop/order.dmodel`}])}},k={args:{tabsState:w(C({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/warehouse/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/Users/demo/shop/order.dmodel`},{type:`markBackgroundChanged`,path:`/Users/demo/warehouse/order.dcanvas`},{type:`activateTab`,path:`/Users/demo/shop/order.dcanvas`}])}},A={args:{tabsState:i.create()}},j={args:{tabsState:w(C({path:`/home/user/shop/docs/very-long-domain-model-name.dcanvas`,documentType:`canvas`},{path:`/home/user/warehouse/docs/very-long-domain-model-name.dcanvas`,documentType:`canvas`},{path:`/order.dmodel`,documentType:`model`},{path:`/tmp/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/home/user/warehouse/docs/very-long-domain-model-name.dcanvas`},{type:`markBackgroundChanged`,path:`/tmp/order.dmodel`},{type:`activateTab`,path:`/home/user/shop/docs/very-long-domain-model-name.dcanvas`}])}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    })
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    })
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
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
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: applyActions(openTabs({
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    }), [{
      type: "markFileMissing",
      path: "/Users/demo/shop/order.dmodel"
    }])
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
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
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: TabsState.create()
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source}}},M=[`Default`,`Active`,`Background`,`Missing`,`AllProps`,`Empty`,`EdgeCases`]}))();export{E as Active,k as AllProps,D as Background,T as Default,j as EdgeCases,A as Empty,O as Missing,M as __namedExportsOrder,S as default};