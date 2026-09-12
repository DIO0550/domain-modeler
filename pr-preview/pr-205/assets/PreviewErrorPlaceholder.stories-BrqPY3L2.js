import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{a as n,b as r,c as i,s as a,t as o}from"./src-Dpanet-j.js";import{n as s,t as c}from"./preview-error-placeholder-Cv_rc6Y_.js";var l,u,d,f,p,m,h,g,_,v;e((()=>{o(),s(),l=t(),u=e=>{let t=n.parse(e);return{decl:t.document.declarations.find(a.isError)??i.create(r.onLine(1,1,1)),diagnostics:t.diagnostics}},d=u(`data 数量 = int constrained 10..1`),f=u(`data = string`),p=u(`data 数量 = int constrained 10..1
ゴミ行
data 注文ID = string`),m={component:c,argTypes:{decl:{control:!1},diagnostics:{control:!1}},decorators:[e=>(0,l.jsx)(`div`,{className:`preview-error-placeholder-story`,children:(0,l.jsx)(e,{})})]},h={args:d},g={decorators:[e=>(0,l.jsx)(`div`,{className:`preview-error-placeholder-story preview-error-placeholder-story--gallery`,children:(0,l.jsx)(e,{})})],render:()=>(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(c,{decl:d.decl,diagnostics:d.diagnostics}),(0,l.jsx)(c,{decl:f.decl,diagnostics:f.diagnostics})]})},_={args:p},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: rangeError
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="preview-error-placeholder-story preview-error-placeholder-story--gallery">
        <Story />
      </div>],
  render: () => <>
      <PreviewErrorPlaceholder decl={rangeError.decl} diagnostics={rangeError.diagnostics} />
      <PreviewErrorPlaceholder decl={missingName.decl} diagnostics={missingName.diagnostics} />
    </>
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: mixedError
}`,..._.parameters?.docs?.source}}},v=[`Default`,`AllProps`,`EdgeCases`]}))();export{g as AllProps,h as Default,_ as EdgeCases,v as __namedExportsOrder,m as default};