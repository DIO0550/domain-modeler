import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{_ as n,b as r,g as i,h as a,m as o,p as s,t as c,v as l,y as u}from"./src-Cn0NMhrP.js";import{n as d,t as f}from"./preview-data-card-tBFMG1gT.js";var p,m,h,g,_,v,y,b,x,S,C,w,T;e((()=>{c(),d(),p=t(),m=r.onLine(1,1,40),h=s.create({name:`注文ID`,nameRange:m,typeExpr:o.alias(n.create({name:`string`,isPrimitive:!0,modifiers:[],range:m}),m),range:m}),g=s.create({name:`注文`,nameRange:m,typeExpr:o.choice([n.create({name:`未検証の注文`,isPrimitive:!1,modifiers:[],range:m}),n.create({name:`検証済みの注文`,isPrimitive:!1,modifiers:[],range:m})],m),range:m}),_=s.create({name:`検証済みの注文`,nameRange:m,typeExpr:o.record([n.create({name:`注文ID`,isPrimitive:!1,modifiers:[],range:m}),n.create({name:`顧客情報`,isPrimitive:!1,modifiers:[],range:m}),n.create({name:`注文明細`,isPrimitive:!1,modifiers:[l.list],range:m})],m),range:m}),v=s.create({name:`注文数量`,nameRange:m,typeExpr:o.value({primitive:u.int,primitiveRange:m,constraint:a.numeric(i.both(1,100),m),range:m}),range:m}),y=s.create({name:`検証済みの注文`,nameRange:m,typeExpr:o.record([n.create({name:`注文ID`,isPrimitive:!1,modifiers:[],range:m}),n.create({name:`顧客情報`,isPrimitive:!1,modifiers:[l.option],range:m}),n.create({name:`注文明細`,isPrimitive:!1,modifiers:[l.list,l.option],range:m})],m),range:m}),b=s.create({name:`下限数量`,nameRange:m,typeExpr:o.value({primitive:u.int,primitiveRange:m,constraint:a.numeric(i.minOnly(1),m),range:m}),range:m}),x={component:f,argTypes:{decl:{control:!1},undefinedTypeNames:{control:!1}},decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story`,children:(0,p.jsx)(e,{})})]},S={args:{decl:h}},C={decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story preview-data-card-story--gallery`,children:(0,p.jsx)(e,{})})],render:()=>(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(f,{decl:g}),(0,p.jsx)(f,{decl:_}),(0,p.jsx)(f,{decl:h}),(0,p.jsx)(f,{decl:v})]})},w={decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story preview-data-card-story--gallery`,children:(0,p.jsx)(e,{})})],render:()=>(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(f,{decl:y,undefinedTypeNames:new Set([`顧客情報`,`注文明細`])}),(0,p.jsx)(f,{decl:b}),(0,p.jsx)(f,{decl:g,undefinedTypeNames:new Set([`未検証の注文`,`検証済みの注文`])})]})},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    decl: aliasCard
  }
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-data-card-story preview-data-card-story--gallery">
        <Story />
      </div>],
  render: () => <>
      <PreviewDataCard decl={choiceCard} />
      <PreviewDataCard decl={recordCard} />
      <PreviewDataCard decl={aliasCard} />
      <PreviewDataCard decl={valueCard} />
    </>
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-data-card-story preview-data-card-story--gallery">
        <Story />
      </div>],
  render: () => <>
      <PreviewDataCard decl={undefinedRecordCard} undefinedTypeNames={new Set(["顧客情報", "注文明細"])} />
      <PreviewDataCard decl={openRangeCard} />
      <PreviewDataCard decl={choiceCard} undefinedTypeNames={new Set(["未検証の注文", "検証済みの注文"])} />
    </>
}`,...w.parameters?.docs?.source}}},T=[`Default`,`AllProps`,`EdgeCases`]}))();export{C as AllProps,S as Default,w as EdgeCases,T as __namedExportsOrder,x as default};