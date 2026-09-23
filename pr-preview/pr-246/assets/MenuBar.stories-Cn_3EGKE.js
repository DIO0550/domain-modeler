import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-BzP0lCpF.js";import{n as r,t as i}from"./tabs-B6nccKQI.js";import{t as a}from"./jsx-runtime-DXFqSddf.js";var o,s,c,l=t((()=>{r(),o={from(e){return{newCanvas:`enabled`,newModel:`enabled`,open:`enabled`,save:s(e),closeTab:s(e),undo:s(e),redo:s(e),generateFromCanvas:c(e)}}},s=e=>e.status===`empty`?`disabled`:`enabled`,c=e=>e.status===`empty`?`disabled`:i.activeTab(e).documentType===`canvas`?`enabled`:`disabled`}));function u({menuState:e,onCommand:t}){let n=(0,h.useRef)(null),[r,i]=(0,h.useState)({status:`closed`}),a=()=>{i({status:`closed`})};m(e,t),v(r.status===`open`,n,a);let o=e=>{if(r.status===`open`&&r.menuId===e){i({status:`closed`});return}i({status:`open`,menuId:e})},s=n=>{e[n]!==`disabled`&&(t(n),a())};return(0,g.jsx)(`div`,{ref:n,className:`menu-bar`,role:`menubar`,"aria-label":`アプリケーションメニュー`,children:_.map(t=>(0,g.jsx)(d,{definition:t,menuState:e,isOpen:y(r,t.id),onToggle:o,onCommand:s},t.id))})}function d({definition:e,menuState:t,isOpen:n,onToggle:r,onCommand:i}){return(0,g.jsxs)(`div`,{className:`menu-bar__group`,children:[(0,g.jsx)(`button`,{type:`button`,className:b(n),role:`menuitem`,"aria-haspopup":`true`,"aria-expanded":n,onClick:()=>{r(e.id)},children:e.label}),(0,g.jsx)(f,{definition:e,menuState:t,isOpen:n,onCommand:i})]})}function f({definition:e,menuState:t,isOpen:n,onCommand:r}){return n?(0,g.jsx)(`div`,{className:`menu-bar__menu`,role:`menu`,"aria-label":e.label,children:e.items.map(e=>(0,g.jsx)(p,{commandId:e.commandId,label:e.label,availability:t[e.commandId],onCommand:r},e.commandId))}):null}function p({commandId:e,label:t,availability:n,onCommand:r}){let i=n===`disabled`;return(0,g.jsx)(`button`,{type:`button`,className:x(n),role:`menuitem`,"aria-disabled":i,onClick:()=>{r(e)},children:t})}function m(e,t){(0,h.useEffect)(()=>{let n=n=>{!(n.metaKey||n.ctrlKey)||n.altKey||n.shiftKey||n.key.toLowerCase()!==`s`||(n.preventDefault(),e.save===`enabled`&&!n.repeat&&t(`save`))};return document.addEventListener(`keydown`,n),()=>document.removeEventListener(`keydown`,n)},[e,t])}var h,g,_,v,y,b,x,S=t((()=>{h=e(n(),1),g=a(),_=[{id:`file`,label:`ファイル`,items:[{commandId:`newCanvas`,label:`新規キャンバス`},{commandId:`newModel`,label:`新規ドメインモデル`},{commandId:`open`,label:`開く`},{commandId:`save`,label:`保存`},{commandId:`closeTab`,label:`タブを閉じる`}]},{id:`edit`,label:`編集`,items:[{commandId:`undo`,label:`元に戻す`},{commandId:`redo`,label:`やり直す`}]},{id:`generate`,label:`生成`,items:[{commandId:`generateFromCanvas`,label:`キャンバスからドメインモデルを生成`}]}],v=(e,t,n)=>{(0,h.useEffect)(()=>{if(!e)return;let r=e=>{let r=e.target;r instanceof Node&&t.current?.contains(r)!==!0&&n()};return document.addEventListener(`pointerdown`,r),()=>{document.removeEventListener(`pointerdown`,r)}},[e,n,t]),(0,h.useEffect)(()=>{if(!e)return;let t=e=>{e.key===`Escape`&&(e.preventDefault(),n())};return document.addEventListener(`keydown`,t),()=>{document.removeEventListener(`keydown`,t)}},[e,n])},y=(e,t)=>e.status===`open`&&e.menuId===t,b=e=>[`menu-bar__menu-button`,...e?[`menu-bar__menu-button--open`]:[]].join(` `),x=e=>[`menu-bar__item`,...e===`disabled`?[`menu-bar__item--disabled`]:[]].join(` `)})),C,w,T,E,D,O,k,A,j,M,N,P,F,I;t((()=>{l(),r(),S(),C=a(),{fn:w,userEvent:T}=__STORYBOOK_MODULE_TEST__,E={component:u,args:{onCommand:w()},argTypes:{onCommand:{control:!1},menuState:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,C.jsx)(`div`,{className:`menu-bar-story`,children:(0,C.jsx)(e,{})})]},D=(e,...t)=>[e,...t].reduce((e,t)=>i.reducer(e,{type:`openTab`,path:t.path,documentType:t.documentType}),i.create()),O=(e,t)=>t.reduce(i.reducer,e),k=async({canvas:e})=>{await T.click(e.getByRole(`menuitem`,{name:`生成`}))},A={args:{menuState:o.from(D({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`}))}},j={args:{menuState:o.from(i.create())},play:k},M={args:{menuState:o.from(D({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}))},play:k},N={args:{menuState:o.from(O(D({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`activateTab`,path:`/Users/demo/shop/order.dmodel`}]))},play:k},P={args:{menuState:o.from(D({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`}))},play:async({canvas:e})=>{await T.click(e.getByRole(`menuitem`,{name:`ファイル`}))}},F={args:{menuState:o.from(i.create())},play:async({canvas:e})=>{await T.click(e.getByRole(`menuitem`,{name:`ファイル`}))}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    menuState: MenuState.from(openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }))
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  args: {
    menuState: MenuState.from(TabsState.create())
  },
  play: openGenerateMenu
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  args: {
    menuState: MenuState.from(openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    }))
  },
  play: openGenerateMenu
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  args: {
    menuState: MenuState.from(applyActions(openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }, {
      path: "/Users/demo/shop/order.dmodel",
      documentType: "model"
    }), [{
      type: "activateTab",
      path: "/Users/demo/shop/order.dmodel"
    }]))
  },
  play: openGenerateMenu
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  args: {
    menuState: MenuState.from(openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }))
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("menuitem", {
      name: "ファイル"
    }));
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  args: {
    menuState: MenuState.from(TabsState.create())
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByRole("menuitem", {
      name: "ファイル"
    }));
  }
}`,...F.parameters?.docs?.source}}},I=[`Default`,`Empty`,`CanvasActive`,`ModelActive`,`AllProps`,`EdgeCases`]}))();export{P as AllProps,M as CanvasActive,A as Default,F as EdgeCases,j as Empty,N as ModelActive,I as __namedExportsOrder,E as default};