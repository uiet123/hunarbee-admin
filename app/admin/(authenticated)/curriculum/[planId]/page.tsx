"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, GripVertical, Trash2, Edit2, ChevronDown, Save, ExternalLink, PlayCircle, FileText as FileIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as Accordion from "@radix-ui/react-accordion";
import { fetchApi } from "@/lib/api";

export interface Resource {
  id: string;
  title: string;
  type: "video" | "pdf" | "article" | "link";
  url: string;
  description?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  estimatedTimeMinutes: number;
  submissionRequired: boolean;
  mentorReviewRequired: boolean;
  status: "active" | "draft";
  resources: Resource[];
}

export interface CurriculumDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  estimatedTimeMinutes: number;
  status: "active" | "draft";
  tasks: Task[];
}

export default function CurriculumBuilder({ params }: { params: Promise<{ planId: string }> }) {
  const resolvedParams = use(params);
  const [initialPlan, setInitialPlan] = useState<any>(null);
  const [programId, setProgramId] = useState("");
  const [days, setDays] = useState<CurriculumDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<{ success: boolean; data: any[] }>("/admin/programs")
      .then(res => {
        if (res?.success) {
          for (const prog of res.data) {
            const found = prog.plans.find((p: any) => p.id === resolvedParams.planId);
            if (found) {
              setInitialPlan(found);
              setProgramId(prog.id);
              setDays(found.curriculum || []);
              break;
            }
          }
        }
      })
      .finally(() => setLoading(false));
  }, [resolvedParams.planId]);

  const addDay = () => {
    const newDay: CurriculumDay = {
      id: `day_${Date.now()}`,
      dayNumber: days.length + 1,
      title: "New Day",
      description: "",
      estimatedTimeMinutes: 120,
      status: "draft",
      tasks: []
    };
    setDays([...days, newDay]);
  };

  const moveDay = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newDays = [...days];
      [newDays[index - 1], newDays[index]] = [newDays[index], newDays[index - 1]];
      setDays(newDays.map((d, i) => ({ ...d, dayNumber: i + 1 }))); // re-number
    } else if (direction === 'down' && index < days.length - 1) {
      const newDays = [...days];
      [newDays[index], newDays[index + 1]] = [newDays[index + 1], newDays[index]];
      setDays(newDays.map((d, i) => ({ ...d, dayNumber: i + 1 })));
    }
  };

  const deleteDay = (id: string) => {
    if (confirm("Are you sure you want to delete this day and all its tasks?")) {
      const filtered = days.filter(d => d.id !== id);
      setDays(filtered.map((d, i) => ({ ...d, dayNumber: i + 1 })));
    }
  };

  const addTask = (dayId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          tasks: [...day.tasks, {
            id: `task_${Date.now()}`,
            title: "New Task",
            description: "",
            instructions: "",
            estimatedTimeMinutes: 30,
            submissionRequired: false,
            mentorReviewRequired: false,
            status: "draft",
            resources: []
          }]
        };
      }
      return day;
    }));
  };

  const deleteTask = (dayId: string, taskId: string) => {
    if (confirm("Delete this task?")) {
      setDays(days.map(day => {
        if (day.id === dayId) {
          return { ...day, tasks: day.tasks.filter(t => t.id !== taskId) };
        }
        return day;
      }));
    }
  };

  const addResource = (dayId: string, taskId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          tasks: day.tasks.map(task => {
            if (task.id === taskId) {
              return {
                ...task,
                resources: [...task.resources, {
                  id: `res_${Date.now()}`,
                  title: "New Resource",
                  type: "link",
                  url: "https://"
                }]
              };
            }
            return task;
          })
        };
      }
      return day;
    }));
  };

  const deleteResource = (dayId: string, taskId: string, resId: string) => {
    setDays(days.map(day => {
      if (day.id === dayId) {
        return {
          ...day,
          tasks: day.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, resources: task.resources.filter(r => r.id !== resId) };
            }
            return task;
          })
        };
      }
      return day;
    }));
  };

  if (loading) return <div className="p-8 text-center text-slate">Loading curriculum...</div>;
  if (!initialPlan) return <div className="p-8 text-center text-red-500">Plan not found</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-[73px] z-20 bg-background/95 backdrop-blur-sm py-4 border-b border-navy/5">
        <div className="flex items-center gap-4">
          <Link href={`/admin/plans/${initialPlan.id}`} className="flex h-10 w-10 items-center justify-center rounded-xl border border-navy/10 bg-surface text-navy hover:bg-navy/5">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-navy">Curriculum Builder</h2>
            <p className="text-sm text-slate">{initialPlan.name} Plan</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={addDay} variant="secondary" className="border-navy/10 text-navy">
            <Plus className="mr-2 h-4 w-4" /> Add Day
          </Button>
          <Button className="bg-navy text-white hover:bg-navy/90">
            <Save className="mr-2 h-4 w-4" /> Save Curriculum
          </Button>
        </div>
      </div>

      <div className="space-y-4 mt-8">
        <Accordion.Root type="multiple" className="space-y-4">
          {days.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-navy/20 p-12 text-center text-slate">
              No days added yet. Click "Add Day" to start building the curriculum.
            </div>
          ) : (
            days.map((day, dIdx) => (
              <Accordion.Item key={day.id} value={day.id} className="rounded-2xl border border-navy/10 bg-surface-elevated/90 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-navy/5 bg-navy/5 px-4 py-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => moveDay(dIdx, 'up')} disabled={dIdx === 0} className="text-slate hover:text-navy disabled:opacity-30"><ChevronDown className="h-4 w-4 rotate-180" /></button>
                      <button onClick={() => moveDay(dIdx, 'down')} disabled={dIdx === days.length - 1} className="text-slate hover:text-navy disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                    </div>
                    <Accordion.Header className="flex-1 flex items-center">
                      <Accordion.Trigger className="flex flex-1 items-center gap-3 text-left">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-white font-bold text-sm">
                          {day.dayNumber}
                        </span>
                        <div>
                          <p className="font-bold text-navy">{day.title}</p>
                          <p className="text-xs text-slate">{day.tasks.length} tasks • {day.estimatedTimeMinutes} mins</p>
                        </div>
                      </Accordion.Trigger>
                    </Accordion.Header>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => deleteDay(day.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>

                <Accordion.Content className="p-4 sm:p-6 bg-surface-elevated overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  {/* Day Settings Form */}
                  <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 bg-navy/[0.02] rounded-xl border border-navy/5">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate uppercase mb-1 block">Day Title</label>
                      <input 
                        value={day.title} 
                        onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, title: e.target.value} : d))}
                        className="w-full bg-white border border-navy/10 rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-honey" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate uppercase mb-1 block">Est. Mins</label>
                      <input 
                        type="number"
                        value={day.estimatedTimeMinutes} 
                        onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, estimatedTimeMinutes: parseInt(e.target.value)||0} : d))}
                        className="w-full bg-white border border-navy/10 rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-honey" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate uppercase mb-1 block">Status</label>
                      <select 
                        value={day.status}
                        onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, status: e.target.value as any} : d))}
                        className="w-full bg-white border border-navy/10 rounded-lg px-3 py-2 text-sm text-navy outline-none focus:border-honey"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                  </div>

                  {/* Tasks inside Day */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-navy text-sm uppercase tracking-wider">Tasks</h4>
                      <Button onClick={() => addTask(day.id)} size="sm" variant="secondary" className="h-8 text-xs">
                        <Plus className="mr-1 h-3 w-3" /> Add Task
                      </Button>
                    </div>

                    {day.tasks.length === 0 ? (
                      <p className="text-sm text-slate italic py-2">No tasks defined for this day.</p>
                    ) : (
                      <div className="space-y-4">
                        {day.tasks.map((task, tIdx) => (
                          <div key={task.id} className="border border-navy/10 rounded-xl bg-white p-4">
                            <div className="flex justify-between items-start mb-4">
                              <input 
                                value={task.title}
                                onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, tasks: d.tasks.map(t => t.id === task.id ? {...t, title: e.target.value} : t)} : d))}
                                className="font-bold text-navy text-base bg-transparent outline-none border-b border-transparent focus:border-honey px-1 py-0.5 -ml-1 w-2/3"
                              />
                              <button onClick={() => deleteTask(day.id, task.id)} className="text-slate hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="text-xs font-semibold text-slate uppercase block mb-1">Description</label>
                                <textarea 
                                  value={task.description}
                                  onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, tasks: d.tasks.map(t => t.id === task.id ? {...t, description: e.target.value} : t)} : d))}
                                  className="w-full bg-navy/[0.02] border border-navy/10 rounded-lg px-3 py-2 text-sm text-navy outline-none min-h-[80px]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate uppercase block mb-1">Instructions / Goal</label>
                                <textarea 
                                  value={task.instructions}
                                  onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, tasks: d.tasks.map(t => t.id === task.id ? {...t, instructions: e.target.value} : t)} : d))}
                                  className="w-full bg-navy/[0.02] border border-navy/10 rounded-lg px-3 py-2 text-sm text-navy outline-none min-h-[80px]"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm bg-navy/[0.02] p-3 rounded-lg border border-navy/5">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={task.submissionRequired} 
                                  onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, tasks: d.tasks.map(t => t.id === task.id ? {...t, submissionRequired: e.target.checked} : t)} : d))}
                                />
                                <span className="font-medium text-navy">Requires Submission</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={task.mentorReviewRequired} 
                                  onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, tasks: d.tasks.map(t => t.id === task.id ? {...t, mentorReviewRequired: e.target.checked} : t)} : d))}
                                />
                                <span className="font-medium text-navy">Mentor Review</span>
                              </label>
                            </div>

                            {/* Resources */}
                            <div className="mt-4 border-t border-navy/5 pt-4">
                              <div className="flex items-center justify-between mb-3">
                                <h5 className="text-xs font-bold uppercase text-slate">Resources</h5>
                                <button onClick={() => addResource(day.id, task.id)} className="text-xs font-semibold text-honey hover:text-honey-deep flex items-center">
                                  <Plus className="h-3 w-3 mr-1" /> Add Resource
                                </button>
                              </div>
                              <div className="space-y-2">
                                {task.resources.map(res => (
                                  <div key={res.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-surface p-2 rounded-lg border border-navy/5">
                                    <select 
                                      value={res.type}
                                      onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, tasks: d.tasks.map(t => t.id === task.id ? {...t, resources: t.resources.map(r => r.id === res.id ? {...r, type: e.target.value as any} : r)} : t)} : d))}
                                      className="bg-transparent border border-navy/10 rounded text-xs p-1 outline-none"
                                    >
                                      <option value="link">Link</option>
                                      <option value="video">Video</option>
                                      <option value="pdf">PDF</option>
                                      <option value="article">Article</option>
                                    </select>
                                    <input 
                                      value={res.title} placeholder="Title"
                                      onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, tasks: d.tasks.map(t => t.id === task.id ? {...t, resources: t.resources.map(r => r.id === res.id ? {...r, title: e.target.value} : r)} : t)} : d))}
                                      className="flex-1 min-w-[120px] bg-transparent border border-navy/10 rounded text-xs p-1 px-2 outline-none"
                                    />
                                    <input 
                                      value={res.url} placeholder="URL"
                                      onChange={(e) => setDays(days.map(d => d.id === day.id ? {...d, tasks: d.tasks.map(t => t.id === task.id ? {...t, resources: t.resources.map(r => r.id === res.id ? {...r, url: e.target.value} : r)} : t)} : d))}
                                      className="flex-1 min-w-[120px] bg-transparent border border-navy/10 rounded text-xs p-1 px-2 outline-none"
                                    />
                                    <button onClick={() => deleteResource(day.id, task.id, res.id)} className="text-slate hover:text-red-500 p-1"><Trash2 className="h-3 w-3" /></button>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))
          )}
        </Accordion.Root>
      </div>
    </div>
  );
}
