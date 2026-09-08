import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-C7Mfvmsc.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";function i(e){let t=(0,a.useRef)(null),n=(0,a.useRef)({start:0,end:0,direction:`none`}),r=(0,a.useRef)(!1),i=e=>{let t=e.currentTarget;n.current={start:t.selectionStart,end:t.selectionEnd,direction:t.selectionDirection}};return(0,a.useLayoutEffect)(()=>{let e=t.current;if(e===null||r.current)return;let i=n.current,a=i.end<=e.value.length?i:{start:0,end:0,direction:`none`};n.current=a,(e.selectionStart!==a.start||e.selectionEnd!==a.end||e.selectionDirection!==a.direction)&&e.setSelectionRange(a.start,a.end,a.direction)},[e]),{inputRef:t,rememberSelection:i,onCompositionStart:()=>{r.current=!0},onCompositionEnd:e=>{r.current=!1,i(e)}}}var a,o=t((()=>{a=e(n(),1)})),s=t((()=>{}));function c({value:e,onChange:t}){let n=(0,l.useRef)(null),r=i(e),a=e.split(/\r\n|\r|\n/);return(0,u.jsxs)(`div`,{className:`model-editor`,children:[(0,u.jsx)(`div`,{className:`model-editor__gutter`,ref:n,"aria-hidden":`true`,children:(0,u.jsx)(`div`,{className:`model-editor__line-numbers`,children:a.map((e,t)=>(0,u.jsx)(`div`,{children:t+1},t+1))})}),(0,u.jsx)(`textarea`,{ref:r.inputRef,className:`model-editor__input`,"aria-label":`ドメインモデルのテキスト`,value:e,wrap:`off`,spellCheck:!1,autoCapitalize:`off`,autoCorrect:`off`,onChange:e=>{r.rememberSelection(e),t(e.currentTarget.value)},onSelect:r.rememberSelection,onCompositionStart:r.onCompositionStart,onCompositionEnd:r.onCompositionEnd,onScroll:e=>{n.current!==null&&(n.current.scrollTop=e.currentTarget.scrollTop)}})]})}var l,u,d=t((()=>{l=e(n(),1),o(),s(),u=r()}));function f({value:e}){let[t,n]=(0,p.useState)(e);return(0,m.jsx)(`div`,{style:{height:`calc(100vh - 32px)`,minHeight:240},children:(0,m.jsx)(c,{value:t,onChange:n})})}var p,m,h,g,_,v,y;t((()=>{p=e(n(),1),d(),m=r(),h={component:c,title:`Model/ModelEditor`,render:e=>(0,m.jsx)(f,{value:e.value}),argTypes:{onChange:{control:!1}}},g={args:{value:`// 注文モデル
data OrderId = string

data Order =
  id: OrderId
  quantity: int
`}},_={args:{value:``}},v={args:{value:Array.from({length:150},(e,t)=>`data Item${t+1} = string // ${`長い行 `.repeat(30)}`).join(`
`)}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    value: "// 注文モデル\\ndata OrderId = string\\n\\ndata Order =\\n  id: OrderId\\n  quantity: int\\n"
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    value: ""
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    value: Array.from({
      length: 150
    }, (_, index) => \`data Item\${index + 1} = string // \${"長い行 ".repeat(30)}\`).join("\\n")
  }
}`,...v.parameters?.docs?.source}}},y=[`Default`,`Empty`,`LongDocument`]}))();export{g as Default,_ as Empty,v as LongDocument,y as __namedExportsOrder,h as default};