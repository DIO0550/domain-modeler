import{n as e,t}from"./chunk-BneVvdWh.js";var n,r,i,a,o,s,c,l,u,d,f,p=e((()=>{n={create(){return{status:`empty`,tabs:[]}},reducer(e,t){if(t.type===`openTab`){if(e.tabs.find(e=>e.path===t.path)!==void 0)return{status:`active`,tabs:e.tabs.map(e=>e.path===t.path?{...e,backgroundChangeState:{status:`unchanged`}}:e),activePath:t.path};let n={path:t.path,documentType:t.documentType,fileState:{status:`available`},backgroundChangeState:{status:`unchanged`}};return{status:`active`,tabs:[...e.tabs,n],activePath:t.path}}return e.status===`empty`?{status:`empty`,tabs:[]}:t.type===`activateTab`?e.tabs.some(e=>e.path===t.path)?{status:`active`,tabs:e.tabs.map(e=>e.path===t.path?{...e,backgroundChangeState:{status:`unchanged`}}:e),activePath:t.path}:{...e,tabs:[...e.tabs]}:{status:`active`,tabs:e.tabs.map(n=>n.path===t.path?t.type===`markFileMissing`?{...n,fileState:{status:`missing`}}:t.type===`clearFileMissing`?{...n,fileState:{status:`available`}}:e.activePath===t.path?n:{...n,backgroundChangeState:{status:`changed`}}:n),activePath:e.activePath}},captions(e){return n.tabViews(e).map(e=>e.caption)},tabViews(e){return e.tabs.map(t=>({tab:t,caption:{path:t.path,fileName:a(t.path),parentDirectorySupplement:l(t,e.tabs)},activation:e.status===`active`&&e.activePath===t.path?`active`:`background`}))},activeTab(e){let t=e.tabs.find(t=>t.path===e.activePath);return t===void 0?e.tabs[0]:t}},r=`\\`,i=`/`,a=e=>{let t=s(e),n=t[t.length-1];return n===void 0?e:n},o=e=>{let t=s(e);return t.length<=1?[]:t.slice(0,-1)},s=e=>e.split(c(e)).filter(e=>e.length>0),c=e=>e.includes(r)&&!e.includes(i)?r:i,l=(e,t)=>{let n=a(e.path),r=t.filter(e=>a(e.path)===n);if(r.length<=1)return{status:`hidden`};let i=u(r,r.reduce((e,t)=>Math.max(e,o(t.path).length),0)),s=o(e.path),l=s.slice(Math.max(0,s.length-i));return l.length===0?{status:`hidden`}:{status:`visible`,directory:l.join(c(e.path))}},u=(e,t)=>{let n=Array.from({length:t},(e,t)=>t+1).find(t=>d(e,t));return n===void 0?t:n},d=(e,t)=>{let n=e.map(e=>f(e.path,t));return new Set(n).size===n.length},f=(e,t)=>{let n=o(e);return n.slice(Math.max(0,n.length-t)).join(c(e))}})),m,h=e((()=>{m={atWrapped(e,t){if(e.length!==0)return e[(t%e.length+e.length)%e.length]}}})),g=t((e=>{var t=Symbol.for(`react.transitional.element`);function n(e,n,r){var i=null;if(r!==void 0&&(i=``+r),n.key!==void 0&&(i=``+n.key),`key`in n)for(var a in r={},n)a!==`key`&&(r[a]=n[a]);else r=n;return n=r.ref,{$$typeof:t,type:e,key:i,ref:n===void 0?null:n,props:r}}e.jsx=n,e.jsxs=n})),_=t(((e,t)=>{t.exports=g()}));function v({tabsState:e,onActivate:t}){let r=n.tabViews(e),i=n=>{if(e.status!==`active`||n.key!==`ArrowRight`&&n.key!==`ArrowLeft`)return;n.preventDefault();let i=n.key===`ArrowRight`?1:-1,a=r.findIndex(e=>e.activation===`active`),o=m.atWrapped(r,a+i);o!==void 0&&t(o.tab.path)};return(0,w.jsx)(`div`,{className:`tab-bar`,role:`tablist`,"aria-label":`開いている文書`,onKeyDown:i,children:r.map(e=>(0,w.jsx)(y,{view:e,onActivate:t},e.tab.path))})}function y({view:e,onActivate:t}){let{tab:n,caption:r,activation:i}=e,a=i===`active`;return(0,w.jsxs)(`button`,{type:`button`,role:`tab`,className:D(i,n),"aria-selected":a,"aria-label":O(n,r),title:n.path,tabIndex:0,onClick:()=>{t(n.path)},children:[(0,w.jsx)(C,{documentType:n.documentType}),(0,w.jsx)(`span`,{className:`tab-bar__file-name`,children:r.fileName}),(0,w.jsx)(b,{caption:r}),(0,w.jsx)(x,{fileState:n.fileState}),(0,w.jsx)(S,{backgroundChangeState:n.backgroundChangeState})]})}function b({caption:e}){return e.parentDirectorySupplement.status===`visible`?(0,w.jsx)(`span`,{className:`tab-bar__parent`,children:e.parentDirectorySupplement.directory}):null}function x({fileState:e}){return e.status===`missing`?(0,w.jsxs)(`svg`,{className:`tab-bar__warning`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,w.jsx)(`path`,{d:`M8 1.5 14.5 13h-13L8 1.5Z`,fill:`currentColor`}),(0,w.jsx)(`rect`,{x:`7.25`,y:`6`,width:`1.5`,height:`4`,fill:`#fff`}),(0,w.jsx)(`rect`,{x:`7.25`,y:`11`,width:`1.5`,height:`1.5`,fill:`#fff`})]}):null}function S({backgroundChangeState:e}){return e.status===`changed`?(0,w.jsx)(`span`,{className:`tab-bar__change-mark`,"aria-hidden":`true`}):null}function C({documentType:e}){return e===`canvas`?(0,w.jsxs)(`svg`,{className:`tab-bar__type-icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,w.jsx)(`rect`,{x:`2.5`,y:`3.5`,width:`11`,height:`9`,rx:`1.5`,fill:`currentColor`,opacity:`0.85`}),(0,w.jsx)(`path`,{d:`M5 7.5h6M5 10h4`,stroke:`#fff`,strokeWidth:`1.2`,strokeLinecap:`round`})]}):(0,w.jsxs)(`svg`,{className:`tab-bar__type-icon`,viewBox:`0 0 16 16`,width:`14`,height:`14`,"aria-hidden":`true`,children:[(0,w.jsx)(`path`,{d:`M4 2.5h5.5L12.5 6v7.5H4v-11Z`,fill:`currentColor`,opacity:`0.85`}),(0,w.jsx)(`path`,{d:`M9.5 2.5V6H12.5`,fill:`#fff`,opacity:`0.35`}),(0,w.jsx)(`path`,{d:`M6 8.5h4M6 11h3`,stroke:`#fff`,strokeWidth:`1.2`,strokeLinecap:`round`})]})}var w,T,E,D,O,k=e((()=>{h(),p(),w=_(),T={Canvas:`キャンバス`,Model:`ドメインモデル`},E=e=>e===`canvas`?T.Canvas:T.Model,D=(e,t)=>{let n=e===`active`?[`tab-bar__item--active`]:[],r=t.fileState.status===`missing`?[`tab-bar__item--missing`]:[];return[`tab-bar__item`,...n,...r].join(` `)},O=(e,t)=>{let n=t.parentDirectorySupplement.status===`visible`?t.parentDirectorySupplement.directory:``,r=e.fileState.status===`missing`?`ファイル欠損`:``,i=e.backgroundChangeState.status===`changed`?`未読の変更`:``;return[E(e.documentType),t.fileName,n,r,i].filter(e=>e.length>0).join(` `)}})),A,j,M,N,P,F,I,L,R,z,B,V,H;e((()=>{p(),k(),A=_(),{fn:j}=__STORYBOOK_MODULE_TEST__,M={component:v,args:{onActivate:j()},argTypes:{onActivate:{control:!1},tabsState:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,A.jsx)(`div`,{className:`tab-bar-story`,children:(0,A.jsx)(e,{})})]},N=(e,...t)=>[e,...t].reduce((e,t)=>n.reducer(e,{type:`openTab`,path:t.path,documentType:t.documentType}),n.create()),P=(e,t)=>t.reduce(n.reducer,e),F={args:{tabsState:N({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`})}},I={args:{tabsState:N({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`})}},L={args:{tabsState:P(N({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markBackgroundChanged`,path:`/Users/demo/shop/order.dcanvas`}])}},R={args:{tabsState:P(N({path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/Users/demo/shop/order.dmodel`}])}},z={args:{tabsState:P(N({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/warehouse/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/Users/demo/shop/order.dmodel`},{type:`markBackgroundChanged`,path:`/Users/demo/warehouse/order.dcanvas`},{type:`activateTab`,path:`/Users/demo/shop/order.dcanvas`}])}},B={args:{tabsState:n.create()}},V={args:{tabsState:P(N({path:`/home/user/shop/docs/very-long-domain-model-name.dcanvas`,documentType:`canvas`},{path:`/home/user/warehouse/docs/very-long-domain-model-name.dcanvas`,documentType:`canvas`},{path:`/order.dmodel`,documentType:`model`},{path:`/tmp/order.dmodel`,documentType:`model`}),[{type:`markFileMissing`,path:`/home/user/warehouse/docs/very-long-domain-model-name.dcanvas`},{type:`markBackgroundChanged`,path:`/tmp/order.dmodel`},{type:`activateTab`,path:`/home/user/shop/docs/very-long-domain-model-name.dcanvas`}])}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    })
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    })
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
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
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: applyActions(openTabs({
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    }), [{
      type: "markFileMissing",
      path: "/Users/demo/shop/order.dmodel"
    }])
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
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
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  args: {
    tabsState: TabsState.create()
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
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
}`,...V.parameters?.docs?.source}}},H=[`Default`,`Active`,`Background`,`Missing`,`AllProps`,`Empty`,`EdgeCases`]}))();export{I as Active,z as AllProps,L as Background,F as Default,V as EdgeCases,B as Empty,R as Missing,H as __namedExportsOrder,M as default};