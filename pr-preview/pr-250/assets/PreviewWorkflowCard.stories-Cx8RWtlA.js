import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{S as n,T as r,h as i,m as a,p as o,t as s,x as c}from"./src-yj27MUvL.js";import{n as l,t as u}from"./preview-workflow-card-CQpxUM-z.js";var d,f,p,m,h,g,_,v,y,b,x;e((()=>{s(),l(),d=t(),{fn:f}=__STORYBOOK_MODULE_TEST__,p=r.onLine(1,1,40),m=o.create({name:`注文を確定する`,nameRange:p,input:i.create([c.create({name:`未検証の注文`,isPrimitive:!1,modifiers:[],range:p}),c.create({name:`在庫状況`,isPrimitive:!1,modifiers:[],range:p})],p),output:i.create([c.create({name:`注文確定イベント`,isPrimitive:!1,modifiers:[],range:p}),c.create({name:`注文保留イベント`,isPrimitive:!1,modifiers:[],range:p})],p),error:a.present([c.create({name:`検証エラー`,isPrimitive:!1,modifiers:[],range:p})],p),range:p}),h=o.create({name:`通知する`,nameRange:p,input:i.create([c.create({name:`通知依頼`,isPrimitive:!1,modifiers:[n.option],range:p})],p),output:i.create([c.create({name:`通知済みイベント`,isPrimitive:!1,modifiers:[],range:p})],p),error:a.absent(),range:p}),g=o.create({name:`変換する`,nameRange:p,input:i.create([c.create({name:`string`,isPrimitive:!0,modifiers:[n.list],range:p})],p),output:i.create([c.create({name:`int`,isPrimitive:!0,modifiers:[],range:p})],p),error:a.absent(),range:p}),_={component:u,args:{onTypeRefClick:f(),onUndefinedBadgeClick:f(),onRename:f()},argTypes:{decl:{control:!1},undefinedTypeNames:{control:!1},onTypeRefClick:{control:!1},onUndefinedBadgeClick:{control:!1},onRename:{control:!1}},decorators:[e=>(0,d.jsx)(`div`,{className:`preview-workflow-card-story`,children:(0,d.jsx)(e,{})})]},v={args:{decl:m}},y={decorators:[e=>(0,d.jsx)(`div`,{className:`preview-workflow-card-story preview-workflow-card-story--gallery`,children:(0,d.jsx)(e,{})})],render:e=>(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(u,{...e,decl:m}),(0,d.jsx)(u,{...e,decl:h}),(0,d.jsx)(u,{...e,decl:g})]})},b={decorators:[e=>(0,d.jsx)(`div`,{className:`preview-workflow-card-story preview-workflow-card-story--gallery`,children:(0,d.jsx)(e,{})})],render:e=>(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)(u,{...e,decl:h,undefinedTypeNames:new Set([`通知依頼`,`通知済みイベント`])}),(0,d.jsx)(u,{...e,decl:m,undefinedTypeNames:new Set([`在庫状況`,`検証エラー`])}),(0,d.jsx)(u,{...e,decl:g})]})},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    decl: withError
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-workflow-card-story preview-workflow-card-story--gallery">
        <Story />
      </div>],
  render: args => <>
      <PreviewWorkflowCard {...args} decl={withError} />
      <PreviewWorkflowCard {...args} decl={withoutError} />
      <PreviewWorkflowCard {...args} decl={primitiveIO} />
    </>
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-workflow-card-story preview-workflow-card-story--gallery">
        <Story />
      </div>],
  render: args => <>
      <PreviewWorkflowCard {...args} decl={withoutError} undefinedTypeNames={new Set(["通知依頼", "通知済みイベント"])} />
      <PreviewWorkflowCard {...args} decl={withError} undefinedTypeNames={new Set(["在庫状況", "検証エラー"])} />
      <PreviewWorkflowCard {...args} decl={primitiveIO} />
    </>
}`,...b.parameters?.docs?.source}}},x=[`Default`,`AllProps`,`EdgeCases`]}))();export{y as AllProps,v as Default,b as EdgeCases,x as __namedExportsOrder,_ as default};