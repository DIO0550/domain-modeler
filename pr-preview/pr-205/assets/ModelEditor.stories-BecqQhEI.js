import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-wj38z86U.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{n as i,t as a}from"./model-editor-Bz9FMZ5I.js";function o({value:e}){let[t,n]=(0,s.useState)(e);return(0,c.jsx)(`div`,{style:{height:`calc(100vh - 32px)`,minHeight:240},children:(0,c.jsx)(a,{value:t,onChange:n})})}var s,c,l,u,d,f,p,m,h;t((()=>{s=e(n(),1),i(),c=r(),l={component:a,title:`Model/ModelEditor`,render:e=>(0,c.jsx)(o,{value:e.value}),argTypes:{onChange:{control:!1}}},u={args:{value:`// 注文モデル
data OrderId = string

data Order =
  id: OrderId
  quantity: int
`}},d={args:{value:``}},f={args:{value:`data 数量 = int constrained 10..1
data 注文ID = string
`}},p={args:{value:`data 注文 = 未検証の注文 OR 検証済みの注文
`}},m={args:{value:Array.from({length:150},(e,t)=>`data Item${t+1} = string // ${`長い行 `.repeat(30)}`).join(`
`)}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    value: "// 注文モデル\\ndata OrderId = string\\n\\ndata Order =\\n  id: OrderId\\n  quantity: int\\n"
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    value: ""
  }
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    value: "data 数量 = int constrained 10..1\\ndata 注文ID = string\\n"
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    value: "data 注文 = 未検証の注文 OR 検証済みの注文\\n"
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    value: Array.from({
      length: 150
    }, (_, index) => \`data Item\${index + 1} = string // \${"長い行 ".repeat(30)}\`).join("\\n")
  }
}`,...m.parameters?.docs?.source}}},h=[`Default`,`Empty`,`ParseError`,`UndefinedReference`,`LongDocument`]}))();export{u as Default,d as Empty,m as LongDocument,f as ParseError,p as UndefinedReference,h as __namedExportsOrder,l as default};