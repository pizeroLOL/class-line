import { type Component, createEffect, createSignal } from "solid-js";
import { JSX } from "solid-js/h/jsx-runtime";

const useSubjectDialog = (props: { onAdd: (subject: Subject) => void }) => {
  const defaultSubject = {
    name: "",
    shortName: "",
    room: "",
    teacher: "",
    id: "",
  } as Subject;
  const [currentSubject, setCurrentSubject] = createSignal(defaultSubject);
  const currentForm = (
    <form class="grid gap-4" method="dialog">
      <section class="grid gap-2">
        <div class="grid gap-1">
          <label for="subject-name" class="text-nowrap">
            名称*
          </label>
          <input
            id="subject-name"
            type="text"
            placeholder="语文"
            class="text-input"
            required
            onChange={(it) => setter(it, "name")}
          />
        </div>
        <div class="grid gap-1">
          <label for="subject-room" class="text-nowrap">
            教室
          </label>
          <input
            id="subject-room"
            type="text"
            placeholder="105，可空"
            class="text-input"
            onChange={(it) => setter(it, "room")}
          />
        </div>
        <div class="grid gap-1">
          <label for="subject-teacher" class="text-nowrap">
            老师
          </label>
          <input
            id="subject-teacher"
            type="text"
            placeholder="张三，可空"
            class="text-input"
            onChange={(it) => setter(it, "teacher")}
          />
        </div>
        <div class="grid gap-1">
          <label for="subject-short-name" class="text-nowrap">
            简称
          </label>
          <input
            id="subject-short-name"
            type="text"
            placeholder="语，可空，默认为名称第一个字"
            class="text-input"
            onChange={(it) => setter(it, "shortName")}
          />
        </div>
      </section>
      <section class="flex gap-2 flex-wrap">
        <button
          type="submit"
          class="green-button px-2 py-1 grow"
          onClick={() => onSubmit()}
        >
          添加
        </button>
        <button
          class="nop-button px-2 py-1 grow"
          type="reset"
          onClick={() => addSubjectDialog.close()}
        >
          取消
        </button>
      </section>
    </form>
  ) as HTMLFormElement;
  const addSubjectDialog = (
    <dialog class="backdrop:bg-black/22 backdrop:backdrop-blur-sm bg-stone-200 dark:bg-stone-800 w-fit h-fit m-auto p-4 rounded-md open:grid gap-4">
      <section>
        <div class="text-3xl">添加课程</div>
      </section>
      {currentForm}
    </dialog>
  ) as HTMLDialogElement;
  const onSubmit = () => {
    const current = currentSubject();
    if (current.name === "") {
      return;
    }
    props.onAdd({
      ...current,
      name: current.name,
      shortName: current.shortName == "" ? current.name[0] : current.shortName,
      id: crypto.randomUUID(),
    } as Subject);
    currentForm.reset();
    setCurrentSubject(defaultSubject);
    addSubjectDialog.close();
  };
  const setter = (
    ev: Event & {
      currentTarget: HTMLInputElement;
      target: HTMLInputElement;
    },
    k: keyof Subject,
  ) => {
    const thisSubject = currentSubject();
    const value = ev.currentTarget.value.trim();
    if (k === "name" || k === "shortName" || k === "id") {
      thisSubject[k] = value;
    } else {
      thisSubject[k] = value !== "" ? value : undefined;
    }
    setCurrentSubject(thisSubject);
  };
  return addSubjectDialog;
};

const SubjectCard = (props: { subject: Subject; onclick?: () => void }) => {
  const { subject, onclick } = props;
  return (
    <button
      class="bg-stone-200 dark:bg-stone-800 rounded-md shadow-md p-2 grid gap-1 hover:bg-stone-300 dark:hover:bg-stone-700 justify-items-start active:rounded-2xl transition-all *:text-wrap *:text-start *:*:text-start *:*:text-wrap"
      onClick={onclick}
    >
      <div class="flex gap-2 flex-wrap items-start">
        <div class="text-xl font-bold">{subject.name}</div>
        <div>{subject.shortName}</div>
      </div>
      {subject.room ? <div>{subject.room}</div> : <div>&nbsp;</div>}
      {subject.teacher ? <div>{subject.teacher}</div> : <div>&nbsp;</div>}
    </button>
  );
};

const SubjectEditor = (props: {
  onAddSubject: () => void;
  subject: () => Subject[];
  setSubject: (value: Subject[]) => void;
  timeline: () => Timeline[];
}) => {
  // TODO: to dialog
  const onDeleteSubject = (subject: Subject) => {
    const hasTimelineNode = props
      .timeline()
      .some((node) => node.subjectId === subject.id);
    if (hasTimelineNode) {
      alert("该课程已被排入时间表，无法删除");
      return;
    }
    if (confirm("确定要删除该课程吗？")) {
      props.setSubject(props.subject().filter((it) => it.id !== subject.id));
    }
  };
  return (
    <section class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-4xl">课程</h2>
        <button
          class="w-6 h-6 green-button flex justify-center content-center"
          onClick={props.onAddSubject}
        >
          +
        </button>
      </div>
      <div class="grid gap-2 grid-cols-[repeat(auto-fit,_minmax(8rem,_1fr))]">
        {props.subject().length == 0 ? (
          <div class="p-2 h-[20dvh] bg-stone-200 dark:bg-stone-800 rounded-md justify-center items-center grid text-lg">
            暂无课程，点击课程边上的 “+” 添加课程
          </div>
        ) : (
          props
            .subject()
            .map((it) => (
              <SubjectCard subject={it} onclick={() => onDeleteSubject(it)} />
            ))
        )}
      </div>
    </section>
  );
};

type TimelineView = { start: number; end: number; name: string };

const toTimelineNode = (
  timeline: Timeline[],
  subjects: Subject[],
): TimelineView[] =>
  timeline.reduce((acc, now) => {
    const start = acc.length == 0 ? 0 : acc[acc.length - 1].end;
    const name =
      now.subjectId == "下课"
        ? "下课"
        : subjects.find((it) => it.id == now.subjectId)?.name;
    if (name === undefined) {
      throw Error("未定义行为，请报告");
    }
    return acc.concat({
      start,
      name,
      end: start + now.durationSec,
    });
  }, [] as TimelineView[]);

const padZero = (num: number) => num.toString().padStart(2, "0");

const formatTime = (time: number) => {
  const days = Math.floor(time / 86400);
  const hours = Math.floor((time % 86400) / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;
  return `第 ${days + 1} 天 ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
};

const TimelineEditor = (props: {
  timeline: () => Timeline[];
  subject: () => Subject[];
  setTimeline: (timeline: Timeline[]) => void;
}) => {
  const defaultTimeline = {
    subjectId: "下课",
    durationSec: 0,
  };
  const [currentTimeline, setCurrentTimeline] =
    createSignal<Timeline>(defaultTimeline);
  return (
    <section class="flex flex-col gap-4">
      <h2 class="text-4xl">时间线</h2>
      <section class="grid gap-2">
        {props.timeline().length == 0 ? (
          <div class="p-2 h-[20dvh] bg-stone-200 dark:bg-stone-800 rounded-md justify-center items-center grid text-lg">
            暂无时间线，根据下方工具栏提示添加时间线
          </div>
        ) : (
          toTimelineNode(props.timeline(), props.subject()).map((it, index) => (
            <div
              onClick={() => {
                // TODO: alert
                const items = props.timeline().filter((_, id) => {
                  return id < index;
                });
                props.setTimeline(items);
              }}
              class="flex flex-wrap gap-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400 dark:hover:bg-stone-600 p-2 shadow-md hover:shadow-lg active:shadow-sm rounded-md active:rounded-2xl transition-all *:text-wrap"
            >
              <div>{it.name}</div>
              <div class="font-mono">{`${formatTime(it.start)} => ${formatTime(it.end)}`}</div>
            </div>
          ))
        )}
      </section>
      <section class="grid gap-2 sm:grid-cols-3">
        <div class="grid gap-1">
          <label for="timeline-subject">课程</label>
          <select
            id="timeline-subject"
            class="bg-stone-300 dark:bg-stone-700 px-2 py-1 rounded-md shadow-md"
            onChange={(ev) => {
              setCurrentTimeline({
                ...currentTimeline(),
                subjectId:
                  props
                    .subject()
                    .find((it) => it.id == ev.currentTarget.value.trim())?.id ??
                  "下课",
              });
            }}
          >
            <option disabled selected>
              选择课程
            </option>
            <option value={"下课"}>{"下课"}</option>
            {props.subject().map((it) => (
              <option value={it.id}>{it.name}</option>
            ))}
          </select>
        </div>
        <div class="grid gap-1">
          <label for="timeline-duration">时长</label>
          <input
            type="time"
            step={1}
            class="bg-stone-300 dark:bg-stone-700 px-2 py-0.5 rounded-md shadow-md"
            onChange={(ev) => {
              const value = ev.currentTarget.value;
              if (value.includes("-") || value.split(":").length !== 3) {
                // TODO: dialog
                alert(`时长格式错误: ${value}`);
              } else {
                setCurrentTimeline({
                  ...currentTimeline(),
                  durationSec: value
                    .split(":")
                    .reverse()
                    .reduce((acc, now, id) => {
                      return acc + parseInt(now) * Math.pow(60, id);
                    }, 0),
                });
              }
            }}
          ></input>
        </div>
        <div class="grid gap-1">
          <div>&nbsp;</div>
          <button
            class="green-button py-0.5"
            onClick={() => {
              const current = currentTimeline();
              if (current.durationSec < 1) {
                alert("时长不能小于 1 秒");
                return;
              }
              if (
                current.subjectId !== "下课" &&
                !props.subject().some((it) => it.id === current.subjectId)
              ) {
                alert("课程不存在");
                return;
              }
              props.setTimeline(props.timeline().concat(current));
            }}
          >
            添加
          </button>
        </div>
      </section>
    </section>
  );
};

const App: Component = () => {
  const [subject, setSubject] = createSignal([] as Subject[]);
  const [timeline, setTimeline] = createSignal([] as Timeline[]);
  const addSubjectDialog = useSubjectDialog({
    onAdd: (it: Subject) => {
      setSubject(subject().concat(it));
    },
  });
  const onAddSubject = () => {
    addSubjectDialog.showModal();
  };

  return (
    <div class="bg-stone-100 dark:bg-stone-900 min-h-dvh">
      <main class="m-8 flex flex-col gap-8 w-max-[80rem]">
        <h1 class="text-6xl">Class Line</h1>
        <SubjectEditor
          onAddSubject={onAddSubject}
          setSubject={setSubject}
          subject={subject}
          timeline={timeline}
        />
        <TimelineEditor
          subject={subject}
          timeline={timeline}
          setTimeline={setTimeline}
        />
      </main>
      {addSubjectDialog}
    </div>
  );
};

export default App;
