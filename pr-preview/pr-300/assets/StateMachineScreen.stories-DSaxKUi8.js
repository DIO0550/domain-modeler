import{a as e,n as t}from"./chunk-BneVvdWh.js";import{t as n}from"./iframe-WPlR1P7I.js";import{t as r}from"./jsx-runtime-DXFqSddf.js";import{n as i,t as a}from"./state-machine-screen-jz9fgQo2.js";function o({value:e}){let[t,n]=(0,u.useState)(e);return(0,d.jsx)(`div`,{style:{width:`100vw`,height:`100vh`},children:(0,d.jsxs)(a.Root,{value:t,onChange:n,onEditSource:()=>void 0,children:[(0,d.jsx)(a.Palette,{}),(0,d.jsx)(a.Graph,{}),(0,d.jsx)(a.Inspector,{})]})})}async function s(e){await p.click(e.getByRole(`button`,{name:`＋ 新しいマシン`})),await f(e.getByRole(`heading`,{name:`新しいマシン`})).toBeVisible()}async function c(e,t){await s(e),await p.type(e.getByRole(`textbox`,{name:`マシン名`}),t),await p.click(e.getByRole(`button`,{name:`マシンを作成`}))}async function l(e,t){await c(e,t),await f(e.getByRole(`alert`)).toHaveTextContent(`「${t}」は既に宣言されています`),await f(e.getByRole(`textbox`,{name:`マシン名`})).toHaveValue(t),await f(e.getAllByRole(`option`)).toHaveLength(2)}var u,d,f,p,m,h,g,_,v,y,b,x,S,C;t((()=>{u=e(n(),1),i(),d=r(),{expect:f,userEvent:p,within:m}=__STORYBOOK_MODULE_TEST__,h={component:o,title:`Model/StateMachine`,parameters:{layout:`fullscreen`},args:{value:`data 注文ID = string
workflow 注文受付 =
  input: 注文ID
  output: 注文ID
state-machine 注文 =
  initial: 待機
  state: 待機
  state: 完了 terminal
  transition: 待機 -> 完了 on 確定
state-machine 返金 =
  initial: 申請
  state: 申請`}},g={name:`既存マシンから追加できる`,play:async({canvasElement:e})=>{let t=m(e);await f(t.getAllByRole(`option`)).toHaveLength(2),await f(t.getByRole(`button`,{name:`＋ 新しいマシン`})).toBeEnabled()}},_={name:`マシンが無い文書の作成フォーム`,args:{value:`data 注文ID = string`},play:async({canvasElement:e})=>{let t=m(e);await f(t.getByRole(`combobox`)).toBeDisabled(),await f(t.getByRole(`textbox`,{name:`マシン名`})).toBeVisible()}},v={name:`新しいマシンの作成フォーム`,play:async({canvasElement:e})=>{let t=m(e);await s(t),await f(t.getByRole(`textbox`,{name:`マシン名`})).toHaveValue(``),await f(t.getByRole(`combobox`)).toHaveValue(`0`)}},y={name:`dataと同名なら作成前にエラー`,play:async({canvasElement:e})=>{await l(m(e),`注文ID`)}},b={name:`workflowと同名なら作成前にエラー`,play:async({canvasElement:e})=>{await l(m(e),`注文受付`)}},x={name:`state-machineと同名なら作成前にエラー`,play:async({canvasElement:e})=>{await l(m(e),`注文`)}},S={name:`作成したマシンへ切り替えて状態を追加`,play:async({canvasElement:e})=>{let t=m(e);await c(t,`配送`),await f(t.getByRole(`combobox`)).toHaveValue(`2`),await f(t.getAllByRole(`option`)).toHaveLength(3),await f(t.queryByRole(`textbox`,{name:`マシン名`})).not.toBeInTheDocument(),await p.click(t.getByRole(`button`,{name:`状態`})),await p.type(t.getByRole(`textbox`,{name:`状態名`}),`未発送`),await p.click(t.getByRole(`checkbox`,{name:`初期状態`})),await p.click(t.getByRole(`button`,{name:`追加`})),await f(t.getByRole(`button`,{name:`未発送 initial`})).toBeVisible()}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "既存マシンから追加できる",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("option")).toHaveLength(2);
    await expect(canvas.getByRole("button", {
      name: "＋ 新しいマシン"
    })).toBeEnabled();
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  name: "マシンが無い文書の作成フォーム",
  args: {
    value: "data 注文ID = string"
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("combobox")).toBeDisabled();
    await expect(canvas.getByRole("textbox", {
      name: "マシン名"
    })).toBeVisible();
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  name: "新しいマシンの作成フォーム",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await openCreation(canvas);
    await expect(canvas.getByRole("textbox", {
      name: "マシン名"
    })).toHaveValue("");
    await expect(canvas.getByRole("combobox")).toHaveValue("0");
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  name: "dataと同名なら作成前にエラー",
  play: async ({
    canvasElement
  }) => {
    await rejectDuplicate(within(canvasElement), "注文ID");
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  name: "workflowと同名なら作成前にエラー",
  play: async ({
    canvasElement
  }) => {
    await rejectDuplicate(within(canvasElement), "注文受付");
  }
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  name: "state-machineと同名なら作成前にエラー",
  play: async ({
    canvasElement
  }) => {
    await rejectDuplicate(within(canvasElement), "注文");
  }
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "作成したマシンへ切り替えて状態を追加",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await submitMachine(canvas, "配送");
    await expect(canvas.getByRole("combobox")).toHaveValue("2");
    await expect(canvas.getAllByRole("option")).toHaveLength(3);
    await expect(canvas.queryByRole("textbox", {
      name: "マシン名"
    })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", {
      name: "状態"
    }));
    await userEvent.type(canvas.getByRole("textbox", {
      name: "状態名"
    }), "未発送");
    await userEvent.click(canvas.getByRole("checkbox", {
      name: "初期状態"
    }));
    await userEvent.click(canvas.getByRole("button", {
      name: "追加"
    }));
    await expect(canvas.getByRole("button", {
      name: "未発送 initial"
    })).toBeVisible();
  }
}`,...S.parameters?.docs?.source}}},C=[`ExistingMachines`,`FirstMachine`,`NewMachineForm`,`DuplicateDataName`,`DuplicateWorkflowName`,`DuplicateMachineName`,`CreatedMachine`]}))();export{S as CreatedMachine,y as DuplicateDataName,x as DuplicateMachineName,b as DuplicateWorkflowName,g as ExistingMachines,_ as FirstMachine,v as NewMachineForm,C as __namedExportsOrder,h as default};