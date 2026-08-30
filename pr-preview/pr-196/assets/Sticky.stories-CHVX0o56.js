import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{c as n,g as r,h as i,l as a,r as o,s,t as c}from"./sticky-CrzJfqry.js";var l,u,d,f,p,m,h,g,_,v,y,b,x,S,C;e((()=>{a(),n(),o(),l=t(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={event:`注文が確定した`,command:`注文を確定する`,actor:`購買担当`,aggregate:`注文`,policy:`在庫が足りなければ保留する`,readModel:`注文一覧`,externalSystem:`決済サービス`,hotspot:`在庫引当のタイミングは？`},f=(e,t=d[e],n={x:16,y:16})=>{let a=s.of(e);return i.create(r.create(`stk_${e}`),e,t,n,a.defaultSize)},p={component:c,argTypes:{sticky:{control:!1},chrome:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,l.jsx)(`div`,{className:`sticky-story`,children:(0,l.jsx)(e,{})})]},m={args:{sticky:f(`event`)}},h={args:{sticky:f(`event`),chrome:{status:`selected`}}},g={args:{sticky:f(`event`,`注文が確定した`),chrome:{status:`editing`,draftText:`注文が確定した`,onDraftChange:u(),onCommit:u()}}},_={decorators:[e=>(0,l.jsx)(`div`,{className:`sticky-story sticky-story--gallery`,children:(0,l.jsx)(e,{})})],render:()=>(0,l.jsx)(l.Fragment,{children:s.all().map(e=>(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:e.defaultSize.width,height:e.defaultSize.height},children:(0,l.jsx)(c,{sticky:f(e.type,d[e.type],{x:0,y:0})})},e.type))})},v={args:{sticky:f(`command`,``)}},y={args:{sticky:f(`policy`,`在庫が足りなければ
保留する`)}},b={args:{sticky:f(`readModel`,`注文番号と顧客名と明細と配送先と支払い状態をすべて一覧に載せ、検索と絞り込みもできるようにする`)}},x={args:{sticky:i.create(r.create(`stk_customsize`),`aggregate`,`注文`,{x:16,y:16},{width:280,height:180})}},S={decorators:[e=>(0,l.jsx)(`div`,{className:`sticky-story sticky-story--gallery`,children:(0,l.jsx)(e,{})})],render:()=>(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:120,height:80},children:(0,l.jsx)(c,{sticky:f(`actor`,``,{x:0,y:0})})}),(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:140,height:100},children:(0,l.jsx)(c,{sticky:f(`hotspot`,`在庫引当は注文確定の前か後か、それとも非同期か、判断が分かれている`,{x:0,y:0})})}),(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:60,height:40},children:(0,l.jsx)(c,{sticky:i.create(r.create(`stk_tiny`),`event`,`あふれる本文を最小サイズに入れる`,{x:0,y:0},{width:60,height:40})})}),(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:160,height:100},children:(0,l.jsx)(c,{sticky:f(`externalSystem`,`決済
サービス
のタイムアウト`,{x:0,y:0})})})]})},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("event")
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("event"),
    chrome: {
      status: "selected"
    }
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("event", "注文が確定した"),
    chrome: {
      status: "editing",
      draftText: "注文が確定した",
      onDraftChange: fn(),
      onCommit: fn()
    }
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="sticky-story sticky-story--gallery">
        <Story />
      </div>],
  render: () => <>
      {StickyAppearance.all().map(appearance => <div key={appearance.type} className="sticky-story__cell" style={{
      width: appearance.defaultSize.width,
      height: appearance.defaultSize.height
    }}>
          <Sticky sticky={sampleSticky(appearance.type, SAMPLE_TEXT[appearance.type], {
        x: 0,
        y: 0
      })} />
        </div>)}
    </>
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("command", "")
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("policy", "在庫が足りなければ\\n保留する")
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("readModel", "注文番号と顧客名と明細と配送先と支払い状態をすべて一覧に載せ、検索と絞り込みもできるようにする")
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: StickyModel.create(StickyId.create("stk_customsize"), "aggregate", "注文", {
      x: 16,
      y: 16
    }, {
      width: 280,
      height: 180
    })
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  decorators: [Story => <div className="sticky-story sticky-story--gallery">
        <Story />
      </div>],
  render: () => <>
      <div className="sticky-story__cell" style={{
      width: 120,
      height: 80
    }}>
        <Sticky sticky={sampleSticky("actor", "", {
        x: 0,
        y: 0
      })} />
      </div>
      <div className="sticky-story__cell" style={{
      width: 140,
      height: 100
    }}>
        <Sticky sticky={sampleSticky("hotspot", "在庫引当は注文確定の前か後か、それとも非同期か、判断が分かれている", {
        x: 0,
        y: 0
      })} />
      </div>
      <div className="sticky-story__cell" style={{
      width: 60,
      height: 40
    }}>
        <Sticky sticky={StickyModel.create(StickyId.create("stk_tiny"), "event", "あふれる本文を最小サイズに入れる", {
        x: 0,
        y: 0
      }, {
        width: 60,
        height: 40
      })} />
      </div>
      <div className="sticky-story__cell" style={{
      width: 160,
      height: 100
    }}>
        <Sticky sticky={sampleSticky("externalSystem", "決済\\nサービス\\nのタイムアウト", {
        x: 0,
        y: 0
      })} />
      </div>
    </>
}`,...S.parameters?.docs?.source}}},C=[`Default`,`Selected`,`Editing`,`AllProps`,`Empty`,`Multiline`,`Overflow`,`CustomSize`,`EdgeCases`]}))();export{_ as AllProps,x as CustomSize,m as Default,S as EdgeCases,g as Editing,v as Empty,y as Multiline,b as Overflow,h as Selected,C as __namedExportsOrder,p as default};