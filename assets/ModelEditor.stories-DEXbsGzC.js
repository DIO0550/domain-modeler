import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t}from"./iframe-L9XTDX8b.js";import{t as n}from"./jsx-runtime-MKhVqBIO.js";import{r,t as i}from"./model-editor-DPATTaCW.js";function a({value:e}){let[t,n]=(0,o.useState)(e);return(0,s.jsx)(`div`,{className:`model-editor-story`,children:(0,s.jsx)(i,{value:t,onChange:n})})}var o,s,c,l,u,d,f,p,m;function h(){return(h=e((()=>{o=t(),r(),s=n(),c={component:i,title:`Model/ModelEditor`,render:e=>(0,s.jsx)(a,{value:e.value}),argTypes:{onChange:{control:!1}}},l={args:{value:`// 注文モデル
data OrderId = string
data Quantity = int

data Order =
  OrderId
  AND Quantity
`}},u={args:{value:``}},d={args:{value:`data 数量 = int constrained 10..1
data 注文ID = string
`}},f={args:{value:`data 注文 = 未検証の注文 OR 検証済みの注文
`}},p={args:{value:Array.from({length:150},(e,t)=>`data Item${t+1} = string // ${`長い行 `.repeat(30)}`).join(`
`)}},m=[`Default`,`Empty`,`ParseError`,`UndefinedReference`,`LongDocument`]})))()}h();export{l as Default,u as Empty,p as LongDocument,d as ParseError,f as UndefinedReference,m as __namedExportsOrder,c as default};