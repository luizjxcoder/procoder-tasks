import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"

interface CalendarEvent {
     date: number
     title: string
     type: "deadline" | "task" | "milestone"
     priority?: "high" | "medium" | "low"
}

interface CalendarWidgetProps {
     tasks?: any[]
}

export function CalendarWidget({ tasks = [] }: CalendarWidgetProps) {
     const navigate = useNavigate()
     const [currentDate, setCurrentDate] = useState(new Date())

     const currentMonth = currentDate.getMonth()
     const currentYear = currentDate.getFullYear()
     const today = new Date().getDate()
     const thisMonth = new Date().getMonth()
     const thisYear = new Date().getFullYear()

     const isCurrentMonth = currentMonth === thisMonth && currentYear === thisYear

     // Convert tasks to calendar events
     const events: CalendarEvent[] = tasks
          .filter(task => task.due_date)
          .map(task => {
               const dueDate = new Date(task.due_date)
               if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
                    return {
                         date: dueDate.getDate(),
                         title: task.title,
                         type: task.priority === "high" ? "deadline" : "task" as const,
                         priority: task.priority
                    }
               }
               return null
          })
          .filter(Boolean) as CalendarEvent[]

     const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
     ]

     const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
     const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

     const days = []

     // Empty cells for days before the first day of month
     for (let i = 0; i < firstDayOfMonth; i++) {
          days.push(<div key={`empty-${i}`} className="h-6 sm:h-8"></div>)
     }

     // Days of the month
     for (let day = 1; day <= daysInMonth; day++) {
          const hasEvent = events.some(event => event.date === day)
          const isToday = isCurrentMonth && day === today
          const eventForDay = events.find(event => event.date === day)

          days.push(
               <div
                    key={day}
                    className={`h-6 w-6 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-xs sm:text-sm relative cursor-pointer transition-all duration-200 ${isToday
                         ? "bg-primary text-primary-foreground font-bold shadow-primary"
                         : hasEvent
                              ? "bg-accent text-accent-foreground hover:bg-accent/80"
                              : "text-card-foreground hover:bg-secondary/50"
                         }`}
                    onClick={() => navigate('/calendar')}
               >
                    {day}
                    {hasEvent && (
                         <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${eventForDay?.type === "deadline" ? "bg-priority-high" :
                              eventForDay?.priority === "high" ? "bg-priority-high" :
                                   eventForDay?.priority === "medium" ? "bg-priority-medium" :
                                        eventForDay?.priority === "low" ? "bg-priority-low" :
                                             "bg-primary"
                              }`} />
                    )}
               </div>
          )
     }

     const navigateMonth = (direction: "prev" | "next") => {
          setCurrentDate(prev => {
               const newDate = new Date(prev)
               if (direction === "prev") {
                    newDate.setMonth(newDate.getMonth() - 1)
               } else {
                    newDate.setMonth(newDate.getMonth() + 1)
               }
               return newDate
          })
     }

     const getPriorityColor = (priority?: string) => {
          switch (priority) {
               case "high": return "bg-priority-high/20 text-priority-high border-priority-high/30"
               case "medium": return "bg-priority-medium/20 text-priority-medium border-priority-medium/30"
               case "low": return "bg-priority-low/20 text-priority-low border-priority-low/30"
               default: return "bg-primary/20 text-primary border-primary/30"
          }
     }

     return (
          <div className="bg-gradient-card border border-border rounded-xl p-4 sm:p-6 shadow-card">
               {/* Header */}
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                         <CalendarIcon className="w-5 h-5 text-primary" />
                         <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">Calendar</h2>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                         <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateMonth("prev")}
                              className="w-8 h-8 p-0"
                         >
                              <ChevronLeft className="w-4 h-4" />
                         </Button>
                         <span className="text-sm font-medium text-card-foreground mx-2 min-w-[120px] text-center">
                              {monthNames[currentMonth]} {currentYear}
                         </span>
                         <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigateMonth("next")}
                              className="w-8 h-8 p-0"
                         >
                              <ChevronRight className="w-4 h-4" />
                         </Button>
                    </div>
               </div>

               {/* Calendar Grid */}
               <div className="grid grid-cols-7 gap-1 mb-4">
                    {/* Day headers */}
                    {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                         <div key={day} className="h-6 sm:h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">
                              <span className="hidden sm:inline">{day}</span>
                              <span className="sm:hidden">{day.charAt(0)}</span>
                         </div>
                    ))}

                    {/* Calendar days */}
                    {days}
               </div>

               {/* Upcoming Events */}
               <div className="space-y-2">
                    <h3 className="text-sm font-medium text-card-foreground">Upcoming</h3>
                    {events.length > 0 ? (
                         <ScrollArea className="h-[110px]">
                              <div className="space-y-2 pr-4">
                                   {events
                                        .sort((a, b) => a.date - b.date)
                                        .map((event, index) => (
                                             <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                                                  <div className={`w-2 h-2 rounded-full ${event.priority === "high" ? "bg-priority-high" :
                                                       event.priority === "medium" ? "bg-priority-medium" :
                                                            event.priority === "low" ? "bg-priority-low" :
                                                                 "bg-primary"
                                                       }`} />
                                                  <div className="flex-1">
                                                       <p className="text-sm font-medium text-card-foreground">{event.title}</p>
                                                       <p className="text-xs text-muted-foreground">
                                                            {monthNames[currentMonth]} {event.date}
                                                       </p>
                                                  </div>
                                                  <Badge
                                                       variant="outline"
                                                       className={`text-xs ${getPriorityColor(event.priority)}`}
                                                  >
                                                       {event.priority || "task"}
                                                  </Badge>
                                             </div>
                                        ))}
                              </div>
                         </ScrollArea>
                    ) : (
                         <div className="text-center text-muted-foreground text-sm py-4">
                              Nenhuma tarefa próxima
                         </div>
                    )}
               </div>
          </div>
     )
}