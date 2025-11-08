import { useState } from "react"
import { Plus, Trash2, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface Subtask {
     id?: string
     title: string
     status: 'todo' | 'completed'
}

interface SubtaskManagerProps {
     subtasks: Subtask[]
     onSubtasksChange: (subtasks: Subtask[]) => void
     disabled?: boolean
}

export function SubtaskManager({ subtasks, onSubtasksChange, disabled = false }: SubtaskManagerProps) {
     const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

     const handleAddSubtask = () => {
          if (!newSubtaskTitle.trim()) return

          const newSubtask: Subtask = {
               title: newSubtaskTitle.trim(),
               status: 'todo'
          }

          onSubtasksChange([...subtasks, newSubtask])
          setNewSubtaskTitle("")
     }

     const handleToggleSubtask = (index: number) => {
          const updated = [...subtasks]
          updated[index] = {
               ...updated[index],
               status: updated[index].status === 'completed' ? 'todo' : 'completed'
          }
          onSubtasksChange(updated)
     }

     const handleDeleteSubtask = (index: number) => {
          const updated = subtasks.filter((_, i) => i !== index)
          onSubtasksChange(updated)
     }

     const handleKeyPress = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
               e.preventDefault()
               handleAddSubtask()
          }
     }

     return (
          <div className="space-y-3">
               <Label>Subtarefas</Label>

               {/* Add new subtask */}
               <div className="flex gap-2">
                    <Input
                         placeholder="Digite o título da subtarefa"
                         value={newSubtaskTitle}
                         onChange={(e) => setNewSubtaskTitle(e.target.value)}
                         onKeyPress={handleKeyPress}
                         disabled={disabled}
                    />
                    <Button
                         type="button"
                         size="sm"
                         onClick={handleAddSubtask}
                         disabled={!newSubtaskTitle.trim() || disabled}
                    >
                         <Plus className="w-4 h-4" />
                    </Button>
               </div>

               {/* Subtasks list */}
               {subtasks.length > 0 && (
                    <Card className="p-3">
                         <div className="space-y-2">
                              {subtasks.map((subtask, index) => (
                                   <div
                                        key={index}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                   >
                                        <Checkbox
                                             checked={subtask.status === 'completed'}
                                             onCheckedChange={() => handleToggleSubtask(index)}
                                             disabled={disabled}
                                        />
                                        <span
                                             className={`flex-1 text-sm ${subtask.status === 'completed'
                                                       ? 'line-through text-muted-foreground'
                                                       : 'text-foreground'
                                                  }`}
                                        >
                                             {subtask.title}
                                        </span>
                                        <Button
                                             type="button"
                                             variant="ghost"
                                             size="sm"
                                             onClick={() => handleDeleteSubtask(index)}
                                             disabled={disabled}
                                        >
                                             <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                   </div>
                              ))}
                         </div>
                    </Card>
               )}

               {subtasks.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                         Nenhuma subtarefa adicionada. Use o campo acima para adicionar.
                    </p>
               )}
          </div>
     )
}
