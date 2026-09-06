import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-CobTF_lW.js";import{n as r,t as i}from"./tabs-BIepK38u.js";import{t as a}from"./jsx-runtime-DXFqSddf.js";var o,s,c,l=t((()=>{r(),o={from(e){return{newCanvas:`enabled`,newModel:`enabled`,open:`enabled`,closeTab:s(e),undo:s(e),redo:s(e),generateFromCanvas:c(e)}}},s=e=>e.status===`empty`?`disabled`:`enabled`,c=e=>e.status===`empty`?`disabled`:i.activeTab(e).documentType===`canvas`?`enabled`:`disabled`}));function u({menuState:e,onCommand:t}){let n=(0,m.useRef)(null),[r,i]=(0,m.useState)({status:`closed`}),a=()=>{i({status:`closed`})};_(r.status===`open`,n,a);let o=e=>{if(r.status===`open`&&r.menuId===e){i({status:`closed`});return}i({status:`open`,menuId:e})},s=n=>{e[n]!==`disabled`&&(t(n),a())};return(0,h.jsx)(`div`,{ref:n,className:`menu-bar`,role:`menubar`,"aria-label":`アプリケーションメニュー`,children:g.map(t=>(0,h.jsx)(d,{definition:t,menuState:e,isOpen:v(r,t.id),onToggle:o,onCommand:s},t.id))})}function d({definition:e,menuState:t,isOpen:n,onToggle:r,onCommand:i}){return(0,h.jsxs)(`div`,{className:`menu-bar__group`,children:[(0,h.jsx)(`button`,{type:`button`,className:y(n),role:`menuitem`,"aria-haspopup":`true`,"aria-expanded":n,onClick:()=>{r(e.id)},children:e.label}),(0,h.jsx)(f,{definition:e,menuState:t,isOpen:n,onCommand:i})]})}function f({definition:e,menuState:t,isOpen:n,onCommand:r}){return n?(0,h.jsx)(`div`,{className:`menu-bar__menu`,role:`menu`,"aria-label":e.label,children:e.items.map(e=>(0,h.jsx)(p,{commandId:e.commandId,label:e.label,availability:t[e.commandId],onCommand:r},e.commandId))}):null}function p({commandId:e,label:t,availability:n,onCommand:r}){let i=n===`disabled`;return(0,h.jsx)(`button`,{type:`button`,className:b(n),role:`menuitem`,"aria-disabled":i,onClick:()=>{r(e)},children:t})}var m,h,g,_,v,y,b,x=t((()=>{m=e(n(),1),h=a(),g=[{id:`file`,label:`ファイル`,items:[{commandId:`newCanvas`,label:`新規キャンバス`},{commandId:`newModel`,label:`新規ドメインモデル`},{commandId:`open`,label:`開く`},{commandId:`closeTab`,label:`タブを閉じる`}]},{id:`edit`,label:`編集`,items:[{commandId:`undo`,label:`元に戻す`},{commandId:`redo`,label:`やり直す`}]},{id:`generate`,label:`生成`,items:[{commandId:`generateFromCanvas`,label:`キャンバスからドメインモデルを生成`}]}],_=(e,t,n)=>{(0,m.useEffect)(()=>{if(!e)return;let r=e=>{let r=e.target;r instanceof Node&&t.current?.contains(r)!==!0&&n()};return document.addEventListener(`pointerdown`,r),()=>{document.removeEventListener(`pointerdown`,r)}},[e,n,t]),(0,m.useEffect)(()=>{if(!e)return;let t=e=>{e.key===`Escape`&&(e.preventDefault(),n())};return document.addEventListener(`keydown`,t),()=>{document.removeEventListener(`keydown`,t)}},[e,n])},v=(e,t)=>e.status===`open`&&e.menuId===t,y=e=>[`menu-bar__menu-button`,...e?[`menu-bar__menu-button--open`]:[]].join(` `),b=e=>[`menu-bar__item`,...e===`disabled`?[`menu-bar__item--disabled`]:[]].join(` `)})),S,C,w,T,E,D,O,k,A,j,M,N,P,F;t((()=>{l(),r(),x(),S=a(),{fn:C,userEvent:w}=__STORYBOOK_MODULE_TEST__,T={component:u,args:{onCommand:C()},argTypes:{onCommand:{control:!1},menuState:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,S.jsx)(`div`,{className:`menu-bar-story`,children:(0,S.jsx)(e,{})})]},E=(e,...t)=>[e,...t].reduce((e,t)=>i.reducer(e,{type:`openTab`,path:t.path,documentType:t.documentType}),i.create()),D=(e,t)=>t.reduce(i.reducer,e),O=async({canvas:e})=>{await w.click(e.getByRole(`menuitem`,{name:`生成`}))},k={args:{menuState:o.from(E({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`}))}},A={args:{menuState:o.from(i.create())},play:O},j={args:{menuState:o.from(E({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}))},play:O},M={args:{menuState:o.from(D(E({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`},{path:`/Users/demo/shop/order.dmodel`,documentType:`model`}),[{type:`activateTab`,path:`/Users/demo/shop/order.dmodel`}]))},play:O},N={args:{menuState:o.from(E({path:`/Users/demo/shop/order.dcanvas`,documentType:`canvas`}))},play:async({canvas:e})=>{await w.click(e.getByRole(`menuitem`,{name:`ファイル`}))}},P={args:{menuState:o.from(i.create())},play:async({canvas:e})=>{await w.click(e.getByRole(`menuitem`,{name:`ファイル`}))}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    menuState: MenuState.from(openTabs({
      path: "/Users/demo/shop/order.dcanvas",
      documentType: "canvas"
    }))
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  args: {
    menuState: MenuState.from(TabsState.create())
  },
  play: openGenerateMenu
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
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
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
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
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
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
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
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
}`,...P.parameters?.docs?.source}}},F=[`Default`,`Empty`,`CanvasActive`,`ModelActive`,`AllProps`,`EdgeCases`]}))();export{N as AllProps,j as CanvasActive,k as Default,P as EdgeCases,A as Empty,M as ModelActive,F as __namedExportsOrder,T as default};