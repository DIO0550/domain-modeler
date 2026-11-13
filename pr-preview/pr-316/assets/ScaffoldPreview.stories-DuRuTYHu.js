import{n as e}from"./rolldown-runtime-sJBDdmOt.js";import{n as t}from"./iframe-BWSOLnN3.js";import{t as n}from"./jsx-runtime-MKhVqBIO.js";function r({text:e,onConfirm:t,onCancel:n}){let r=(0,i.useId)(),o=(0,i.useId)(),s=(0,i.useId)();return(0,a.jsxs)(`section`,{className:`scaffold-preview`,"aria-labelledby":r,children:[(0,a.jsxs)(`header`,{className:`scaffold-preview__header`,children:[(0,a.jsx)(`h2`,{id:r,children:`生成内容の確認`}),(0,a.jsx)(`p`,{id:o,children:`このモデルは叩き台です。TODO と未定義の警告を確認し、保存後にモデルエディターで編集してください。`})]}),(0,a.jsx)(`label`,{htmlFor:s,children:`生成される .dmodel（読み取り専用）`}),(0,a.jsx)(`textarea`,{id:s,className:`scaffold-preview__text`,"aria-describedby":o,value:e,readOnly:!0,spellCheck:!1,wrap:`off`}),(0,a.jsxs)(`footer`,{className:`scaffold-preview__footer`,children:[(0,a.jsx)(`p`,{children:`確定すると保存先を選択します。`}),(0,a.jsxs)(`div`,{className:`scaffold-preview__actions`,children:[(0,a.jsx)(`button`,{type:`button`,onClick:n,children:`キャンセル`}),(0,a.jsx)(`button`,{type:`button`,className:`scaffold-preview__confirm`,onClick:t,children:`確定`})]})]})]})}var i,a;function o(){return(o=e((()=>{i=t(),a=n()})))()}function s({text:e}){let[t,n]=(0,c.useState)(`preview`);return t===`preview`?(0,l.jsx)(r,{text:e,onConfirm:()=>n(`confirmed`),onCancel:()=>n(`cancelled`)}):(0,l.jsxs)(`div`,{children:[(0,l.jsx)(`p`,{role:`status`,children:t===`confirmed`?`確定しました`:`キャンセルしました`}),(0,l.jsx)(`button`,{type:`button`,onClick:()=>n(`preview`),children:`確認画面を開く`})]})}var c,l,u,d,f,p,m,h;function g(){return(g=e((()=>{c=t(),o(),l=n(),u=`// 注文キャンバス から生成 (2026-09-14)
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
`,d={component:r,parameters:{layout:`fullscreen`},decorators:[e=>(0,l.jsx)(`div`,{style:{height:`100vh`},children:(0,l.jsx)(e,{})})],render:({text:e})=>(0,l.jsx)(s,{text:e})},f={args:{text:u}},p={args:{text:`${u}\n${Array.from({length:200},(e,t)=>`data 項目${t} = string // TODO ${`詳細化`.repeat(40)}`).join(`
`)}\n// 最終行\n`}},m={args:{text:``}},h=[`Default`,`LongText`,`Empty`]})))()}g();export{f as Default,m as Empty,p as LongText,h as __namedExportsOrder,d as default};