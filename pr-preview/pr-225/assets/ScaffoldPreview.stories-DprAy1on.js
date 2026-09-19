import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-DGdha-Th.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";var i=t((()=>{}));function a({text:e,onConfirm:t,onCancel:n}){let r=(0,o.useId)(),i=(0,o.useId)(),a=(0,o.useId)();return(0,s.jsxs)(`section`,{className:`scaffold-preview`,"aria-labelledby":r,children:[(0,s.jsxs)(`header`,{className:`scaffold-preview__header`,children:[(0,s.jsx)(`h2`,{id:r,children:`生成内容の確認`}),(0,s.jsx)(`p`,{id:i,children:`このモデルは叩き台です。TODO と未定義の警告を確認し、保存後にモデルエディターで編集してください。`})]}),(0,s.jsx)(`label`,{htmlFor:a,children:`生成される .dmodel（読み取り専用）`}),(0,s.jsx)(`textarea`,{id:a,className:`scaffold-preview__text`,"aria-describedby":i,value:e,readOnly:!0,spellCheck:!1,wrap:`off`}),(0,s.jsxs)(`footer`,{className:`scaffold-preview__footer`,children:[(0,s.jsx)(`p`,{children:`確定すると保存先を選択します。`}),(0,s.jsxs)(`div`,{className:`scaffold-preview__actions`,children:[(0,s.jsx)(`button`,{type:`button`,onClick:n,children:`キャンセル`}),(0,s.jsx)(`button`,{type:`button`,className:`scaffold-preview__confirm`,onClick:t,children:`確定`})]})]})]})}var o,s,c=t((()=>{o=e(n(),1),i(),s=r()}));function l({text:e}){let[t,n]=(0,u.useState)(`preview`);return t===`preview`?(0,d.jsx)(a,{text:e,onConfirm:()=>n(`confirmed`),onCancel:()=>n(`cancelled`)}):(0,d.jsxs)(`div`,{children:[(0,d.jsx)(`p`,{role:`status`,children:t===`confirmed`?`確定しました`:`キャンセルしました`}),(0,d.jsx)(`button`,{type:`button`,onClick:()=>n(`preview`),children:`確認画面を開く`})]})}var u,d,f,p,m,h,g,_;t((()=>{u=e(n(),1),c(),d=r(),f=`// 注文キャンバス から生成 (2026-09-14)
// このファイルは叩き台です。TODO と未定義の警告を埋めて育ててください

// ---- data ----

data 注文が確定した = string // TODO 詳細化
data 注文するコマンド = string // TODO 詳細化

// ---- workflow ----

workflow 注文する {
  input: 注文するコマンド
  output: 注文が確定した
}

// ---- 未変換 ----

// actor: 顧客
`,p={component:a,parameters:{layout:`fullscreen`},decorators:[e=>(0,d.jsx)(`div`,{style:{height:`100vh`},children:(0,d.jsx)(e,{})})],render:({text:e})=>(0,d.jsx)(l,{text:e})},m={args:{text:f}},h={args:{text:`${f}\n${Array.from({length:200},(e,t)=>`data 項目${t} = string // TODO ${`詳細化`.repeat(40)}`).join(`
`)}\n// 最終行\n`}},g={args:{text:``}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    text
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:'{\n  args: {\n    text: `${text}\\n${Array.from({\n      length: 200\n    }, (_, index) => `data 項目${index} = string // TODO ${"詳細化".repeat(40)}`).join("\\n")}\\n// 最終行\\n`\n  }\n}',...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    text: ""
  }
}`,...g.parameters?.docs?.source}}},_=[`Default`,`LongText`,`Empty`]}))();export{m as Default,g as Empty,h as LongText,_ as __namedExportsOrder,p as default};