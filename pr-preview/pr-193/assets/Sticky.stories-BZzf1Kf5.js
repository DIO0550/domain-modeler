import{n as e}from"./chunk-BneVvdWh.js";import{t}from"./jsx-runtime-DXFqSddf.js";import{a as n,c as r,i,n as a,r as o,s,t as c}from"./sticky-D7t5TISu.js";var l,u,d,f,p,m,h,g,_,v,y,b;e((()=>{n(),i(),a(),l=t(),u={event:`注文が確定した`,command:`注文を確定する`,actor:`購買担当`,aggregate:`注文`,policy:`在庫が足りなければ保留する`,readModel:`注文一覧`,externalSystem:`決済サービス`,hotspot:`在庫引当のタイミングは？`},d=(e,t=u[e],n={x:16,y:16})=>{let i=o.of(e);return s.create(r.create(`stk_${e}`),e,t,n,i.defaultSize)},f={component:c,argTypes:{sticky:{control:!1}},parameters:{layout:`fullscreen`},decorators:[e=>(0,l.jsx)(`div`,{className:`sticky-story`,children:(0,l.jsx)(e,{})})]},p={args:{sticky:d(`event`)}},m={decorators:[e=>(0,l.jsx)(`div`,{className:`sticky-story sticky-story--gallery`,children:(0,l.jsx)(e,{})})],render:()=>(0,l.jsx)(l.Fragment,{children:o.all().map(e=>(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:e.defaultSize.width,height:e.defaultSize.height},children:(0,l.jsx)(c,{sticky:d(e.type,u[e.type],{x:0,y:0})})},e.type))})},h={args:{sticky:d(`command`,``)}},g={args:{sticky:d(`policy`,`在庫が足りなければ
保留する`)}},_={args:{sticky:d(`readModel`,`注文番号と顧客名と明細と配送先と支払い状態をすべて一覧に載せ、検索と絞り込みもできるようにする`)}},v={args:{sticky:s.create(r.create(`stk_customsize`),`aggregate`,`注文`,{x:16,y:16},{width:280,height:180})}},y={decorators:[e=>(0,l.jsx)(`div`,{className:`sticky-story sticky-story--gallery`,children:(0,l.jsx)(e,{})})],render:()=>(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:120,height:80},children:(0,l.jsx)(c,{sticky:d(`actor`,``,{x:0,y:0})})}),(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:140,height:100},children:(0,l.jsx)(c,{sticky:d(`hotspot`,`在庫引当は注文確定の前か後か、それとも非同期か、判断が分かれている`,{x:0,y:0})})}),(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:60,height:40},children:(0,l.jsx)(c,{sticky:s.create(r.create(`stk_tiny`),`event`,`あふれる本文を最小サイズに入れる`,{x:0,y:0},{width:60,height:40})})}),(0,l.jsx)(`div`,{className:`sticky-story__cell`,style:{width:160,height:100},children:(0,l.jsx)(c,{sticky:d(`externalSystem`,`決済
サービス
のタイムアウト`,{x:0,y:0})})})]})},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("event")
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
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
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("command", "")
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("policy", "在庫が足りなければ\\n保留する")
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: sampleSticky("readModel", "注文番号と顧客名と明細と配送先と支払い状態をすべて一覧に載せ、検索と絞り込みもできるようにする")
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    sticky: StickyModel.create(StickyId.create("stk_customsize"), "aggregate", "注文", {
      x: 16,
      y: 16
    }, {
      width: 280,
      height: 180
    })
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
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
}`,...y.parameters?.docs?.source}}},b=[`Default`,`AllProps`,`Empty`,`Multiline`,`Overflow`,`CustomSize`,`EdgeCases`]}))();export{m as AllProps,v as CustomSize,p as Default,y as EdgeCases,h as Empty,g as Multiline,_ as Overflow,b as __namedExportsOrder,f as default};