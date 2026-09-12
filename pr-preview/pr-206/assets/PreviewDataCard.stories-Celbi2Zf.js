import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{S as n,_ as r,b as i,g as a,h as o,t as s,v as c,x as l,y as u}from"./src-Bbzburo7.js";import{n as d,t as f}from"./preview-data-card-FQj1edcj.js";var p,m,h,g,_,v,y,b,x,S,C,w,T,E;e((()=>{s(),d(),p=t(),{fn:m}=__STORYBOOK_MODULE_TEST__,h=n.onLine(1,1,40),g=o.create({name:`注文ID`,nameRange:h,typeExpr:a.alias(u.create({name:`string`,isPrimitive:!0,modifiers:[],range:h}),h),range:h}),_=o.create({name:`注文`,nameRange:h,typeExpr:a.choice([u.create({name:`未検証の注文`,isPrimitive:!1,modifiers:[],range:h}),u.create({name:`検証済みの注文`,isPrimitive:!1,modifiers:[],range:h})],h),range:h}),v=o.create({name:`検証済みの注文`,nameRange:h,typeExpr:a.record([u.create({name:`注文ID`,isPrimitive:!1,modifiers:[],range:h}),u.create({name:`顧客情報`,isPrimitive:!1,modifiers:[],range:h}),u.create({name:`注文明細`,isPrimitive:!1,modifiers:[i.list],range:h})],h),range:h}),y=o.create({name:`注文数量`,nameRange:h,typeExpr:a.value({primitive:l.int,primitiveRange:h,constraint:r.numeric(c.both(1,100),h),range:h}),range:h}),b=o.create({name:`検証済みの注文`,nameRange:h,typeExpr:a.record([u.create({name:`注文ID`,isPrimitive:!1,modifiers:[],range:h}),u.create({name:`顧客情報`,isPrimitive:!1,modifiers:[i.option],range:h}),u.create({name:`注文明細`,isPrimitive:!1,modifiers:[i.list,i.option],range:h})],h),range:h}),x=o.create({name:`下限数量`,nameRange:h,typeExpr:a.value({primitive:l.int,primitiveRange:h,constraint:r.numeric(c.minOnly(1),h),range:h}),range:h}),S={component:f,args:{onTypeRefClick:m(),onUndefinedBadgeClick:m()},argTypes:{decl:{control:!1},undefinedTypeNames:{control:!1},onTypeRefClick:{control:!1},onUndefinedBadgeClick:{control:!1}},decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story`,children:(0,p.jsx)(e,{})})]},C={args:{decl:g}},w={decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story preview-data-card-story--gallery`,children:(0,p.jsx)(e,{})})],render:()=>(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(f,{decl:_}),(0,p.jsx)(f,{decl:v}),(0,p.jsx)(f,{decl:g}),(0,p.jsx)(f,{decl:y})]})},T={decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story preview-data-card-story--gallery`,children:(0,p.jsx)(e,{})})],render:()=>(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(f,{decl:b,undefinedTypeNames:new Set([`顧客情報`,`注文明細`])}),(0,p.jsx)(f,{decl:x}),(0,p.jsx)(f,{decl:_,undefinedTypeNames:new Set([`未検証の注文`,`検証済みの注文`])})]})},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    decl: aliasCard
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-data-card-story preview-data-card-story--gallery">
        <Story />
      </div>],
  render: () => <>
      <PreviewDataCard decl={choiceCard} />
      <PreviewDataCard decl={recordCard} />
      <PreviewDataCard decl={aliasCard} />
      <PreviewDataCard decl={valueCard} />
    </>
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-data-card-story preview-data-card-story--gallery">
        <Story />
      </div>],
  render: () => <>
      <PreviewDataCard decl={undefinedRecordCard} undefinedTypeNames={new Set(["顧客情報", "注文明細"])} />
      <PreviewDataCard decl={openRangeCard} />
      <PreviewDataCard decl={choiceCard} undefinedTypeNames={new Set(["未検証の注文", "検証済みの注文"])} />
    </>
}`,...T.parameters?.docs?.source}}},E=[`Default`,`AllProps`,`EdgeCases`]}))();export{w as AllProps,C as Default,T as EdgeCases,E as __namedExportsOrder,S as default};