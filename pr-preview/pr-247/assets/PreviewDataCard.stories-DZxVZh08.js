import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{C as n,S as r,T as i,_ as a,b as o,t as s,v as c,x as l,y as u}from"./src-DdGMUKvA.js";import{n as d,t as f}from"./preview-data-card-Gkv4og7e.js";var p,m,h,g,_,v,y,b,x,S,C,w,T,E;e((()=>{s(),d(),p=t(),{fn:m}=__STORYBOOK_MODULE_TEST__,h=i.onLine(1,1,40),g=a.create({name:`注文ID`,nameRange:h,typeExpr:c.alias(l.create({name:`string`,isPrimitive:!0,modifiers:[],range:h}),h),range:h}),_=a.create({name:`注文`,nameRange:h,typeExpr:c.choice([l.create({name:`未検証の注文`,isPrimitive:!1,modifiers:[],range:h}),l.create({name:`検証済みの注文`,isPrimitive:!1,modifiers:[],range:h})],h),range:h}),v=a.create({name:`検証済みの注文`,nameRange:h,typeExpr:c.record([l.create({name:`注文ID`,isPrimitive:!1,modifiers:[],range:h}),l.create({name:`顧客情報`,isPrimitive:!1,modifiers:[],range:h}),l.create({name:`注文明細`,isPrimitive:!1,modifiers:[r.list],range:h})],h),range:h}),y=a.create({name:`注文数量`,nameRange:h,typeExpr:c.value({primitive:n.int,primitiveRange:h,constraint:u.numeric(o.both(1,100),h),range:h}),range:h}),b=a.create({name:`検証済みの注文`,nameRange:h,typeExpr:c.record([l.create({name:`注文ID`,isPrimitive:!1,modifiers:[],range:h}),l.create({name:`顧客情報`,isPrimitive:!1,modifiers:[r.option],range:h}),l.create({name:`注文明細`,isPrimitive:!1,modifiers:[r.list,r.option],range:h})],h),range:h}),x=a.create({name:`下限数量`,nameRange:h,typeExpr:c.value({primitive:n.int,primitiveRange:h,constraint:u.numeric(o.minOnly(1),h),range:h}),range:h}),S={component:f,args:{onTypeRefClick:m(),onUndefinedBadgeClick:m(),onRename:m()},argTypes:{decl:{control:!1},undefinedTypeNames:{control:!1},onTypeRefClick:{control:!1},onUndefinedBadgeClick:{control:!1},onRename:{control:!1}},decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story`,children:(0,p.jsx)(e,{})})]},C={args:{decl:g}},w={decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story preview-data-card-story--gallery`,children:(0,p.jsx)(e,{})})],render:e=>(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(f,{...e,decl:_}),(0,p.jsx)(f,{...e,decl:v}),(0,p.jsx)(f,{...e,decl:g}),(0,p.jsx)(f,{...e,decl:y})]})},T={decorators:[e=>(0,p.jsx)(`div`,{className:`preview-data-card-story preview-data-card-story--gallery`,children:(0,p.jsx)(e,{})})],render:e=>(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(f,{...e,decl:b,undefinedTypeNames:new Set([`顧客情報`,`注文明細`])}),(0,p.jsx)(f,{...e,decl:x}),(0,p.jsx)(f,{...e,decl:_,undefinedTypeNames:new Set([`未検証の注文`,`検証済みの注文`])})]})},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    decl: aliasCard
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-data-card-story preview-data-card-story--gallery">
        <Story />
      </div>],
  render: args => <>
      <PreviewDataCard {...args} decl={choiceCard} />
      <PreviewDataCard {...args} decl={recordCard} />
      <PreviewDataCard {...args} decl={aliasCard} />
      <PreviewDataCard {...args} decl={valueCard} />
    </>
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-data-card-story preview-data-card-story--gallery">
        <Story />
      </div>],
  render: args => <>
      <PreviewDataCard {...args} decl={undefinedRecordCard} undefinedTypeNames={new Set(["顧客情報", "注文明細"])} />
      <PreviewDataCard {...args} decl={openRangeCard} />
      <PreviewDataCard {...args} decl={choiceCard} undefinedTypeNames={new Set(["未検証の注文", "検証済みの注文"])} />
    </>
}`,...T.parameters?.docs?.source}}},E=[`Default`,`AllProps`,`EdgeCases`]}))();export{w as AllProps,C as Default,T as EdgeCases,E as __namedExportsOrder,S as default};