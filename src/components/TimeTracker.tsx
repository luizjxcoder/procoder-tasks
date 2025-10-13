import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Play, Pause, Square, Timer, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TimeTracker() {
  const [isRunning, setIsRunning] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0) // in seconds
  const [isPaused, setIsPaused] = useState(false)
  const [isWorkPeriod, setIsWorkPeriod] = useState(true)
  const [pomodoroCount, setPomodoroCount] = useState(0)
  
  // Configurable Pomodoro settings (in minutes)
  const [workDuration, setWorkDuration] = useState(() => {
    const saved = localStorage.getItem('pomodoro-work-duration')
    return saved ? parseInt(saved) : 25
  })
  const [shortBreakDuration, setShortBreakDuration] = useState(() => {
    const saved = localStorage.getItem('pomodoro-short-break-duration')
    return saved ? parseInt(saved) : 5
  })
  const [longBreakDuration, setLongBreakDuration] = useState(() => {
    const saved = localStorage.getItem('pomodoro-long-break-duration')
    return saved ? parseInt(saved) : 15
  })
  
  // Settings popover state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState({
    work: workDuration,
    shortBreak: shortBreakDuration,
    longBreak: longBreakDuration
  })
  
  // Alert states
  const [isAlertActive, setIsAlertActive] = useState(false)
  
  const { toast } = useToast()

  const getCurrentDuration = () => {
    if (isWorkPeriod) return workDuration * 60
    return pomodoroCount > 0 && pomodoroCount % 4 === 0 ? longBreakDuration * 60 : shortBreakDuration * 60
  }

  const playNotificationSound = () => {
    try {
      // Create multiple notification beeps for better attention
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Play 3 beeps
      const delays = [0, 0.3, 0.6]
      delays.forEach((delay, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // Higher frequency for better attention
          oscillator.frequency.value = index === 2 ? 1000 : 800
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
          
          oscillator.start()
          oscillator.stop(audioContext.currentTime + 0.4)
        }, delay * 1000)
      })
      
      // Trigger visual alert
      setIsAlertActive(true)
      setTimeout(() => setIsAlertActive(false), 3000) // 3 seconds of visual alert
      
    } catch (error) {
      console.warn('Audio notification not supported')
      // Fallback visual alert only
      setIsAlertActive(true)
      setTimeout(() => setIsAlertActive(false), 3000)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1
          const currentDuration = getCurrentDuration()
          
          // Check if current period is complete
          if (newTime >= currentDuration) {
            playNotificationSound()
            
            // Handle Pomodoro transitions
            if (isWorkPeriod) {
              // Work period complete, start break
              setPomodoroCount(prev => prev + 1)
              setIsWorkPeriod(false)
              const isLongBreak = (pomodoroCount + 1) % 4 === 0
              toast({
                title: "Sessão de Trabalho Completa! 🍅",
                description: `Hora de uma pausa ${isLongBreak ? 'longa' : 'curta'}!`,
              })
            } else {
              // Break complete, start work
              setIsWorkPeriod(true)
              toast({
                title: "Pausa Completa! 💪",
                description: "Pronto para outra sessão de trabalho?",
              })
            }
            return 0 // Reset timer for next period
          }
          
          return newTime
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isPaused, getCurrentDuration, isWorkPeriod, pomodoroCount, workDuration, shortBreakDuration, longBreakDuration, toast])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = () => {
    setIsRunning(true)
    setIsPaused(false)
  }

  const pauseTimer = () => {
    setIsPaused(true)
  }

  const stopTimer = () => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeElapsed(0)
  }

  const resumeTimer = () => {
    setIsPaused(false)
  }

  const currentDuration = getCurrentDuration()
  const progressPercentage = Math.min((timeElapsed / currentDuration) * 100, 100)
  
  const resetTimer = () => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeElapsed(0)
    setIsWorkPeriod(true)
    setPomodoroCount(0)
  }

  const saveSettings = () => {
    setWorkDuration(tempSettings.work)
    setShortBreakDuration(tempSettings.shortBreak)
    setLongBreakDuration(tempSettings.longBreak)
    
    localStorage.setItem('pomodoro-work-duration', tempSettings.work.toString())
    localStorage.setItem('pomodoro-short-break-duration', tempSettings.shortBreak.toString())
    localStorage.setItem('pomodoro-long-break-duration', tempSettings.longBreak.toString())
    
    setIsSettingsOpen(false)
    toast({
      title: "Configurações Salvas",
      description: "Seus tempos de Pomodoro foram atualizados!",
    })
  }

  const cancelSettings = () => {
    setTempSettings({
      work: workDuration,
      shortBreak: shortBreakDuration,
      longBreak: longBreakDuration
    })
    setIsSettingsOpen(false)
  }

  return (
    <div className={`bg-gradient-card border border-border rounded-xl p-2 shadow-card transition-all duration-300 ${
      isAlertActive 
        ? 'animate-pulse bg-primary/20 border-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]' 
        : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Timer className="w-3 h-3 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Pomodoro</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${
            isWorkPeriod 
              ? 'bg-primary/10 text-primary' 
              : 'bg-success/10 text-success'
          }`}>
            {isWorkPeriod ? '🍅' : '☕'}
          </span>
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-5 w-5"
                disabled={isRunning}
              >
                <Settings className="w-2.5 h-2.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Configurações do Pomodoro</h4>
                  <p className="text-sm text-muted-foreground">
                    Ajuste os tempos conforme sua preferência
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="work" className="text-xs">
                      Trabalho
                    </Label>
                    <Input
                      id="work"
                      type="number"
                      min="1"
                      max="60"
                      value={tempSettings.work}
                      onChange={(e) => setTempSettings(prev => ({...prev, work: parseInt(e.target.value) || 25}))}
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="shortBreak" className="text-xs">
                      Pausa Curta
                    </Label>
                    <Input
                      id="shortBreak"
                      type="number"
                      min="1"
                      max="30"
                      value={tempSettings.shortBreak}
                      onChange={(e) => setTempSettings(prev => ({...prev, shortBreak: parseInt(e.target.value) || 5}))}
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="longBreak" className="text-xs">
                      Pausa Longa
                    </Label>
                    <Input
                      id="longBreak"
                      type="number"
                      min="1"
                      max="60"
                      value={tempSettings.longBreak}
                      onChange={(e) => setTempSettings(prev => ({...prev, longBreak: parseInt(e.target.value) || 15}))}
                      className="col-span-2 h-8"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={cancelSettings}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={saveSettings}>
                    Salvar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Progress Bar and Timer Display in same row */}
      <div className="flex items-center gap-3 mb-1">
        <div className="flex-1">
          <Progress 
            value={progressPercentage} 
            className="h-1"
          />
        </div>
        <div className="text-center">
          <div className={`text-sm font-mono font-semibold text-card-foreground transition-all duration-300 ${
            isAlertActive ? 'text-primary animate-pulse scale-110' : ''
          }`}>
            {formatTime(timeElapsed)}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-1">
        {!isRunning ? (
          <Button 
            onClick={startTimer}
            size="sm"
            className="bg-success hover:bg-success/90 text-white h-6 px-2 text-xs"
          >
            <Play className="w-2 h-2 mr-1" />
            Iniciar
          </Button>
        ) : isPaused ? (
          <>
            <Button 
              onClick={resumeTimer}
              size="sm"
              className="bg-success hover:bg-success/90 text-white h-6 px-2 text-xs"
            >
              <Play className="w-2 h-2 mr-1" />
              Retomar
            </Button>
            <Button 
              onClick={stopTimer}
              size="sm"
              variant="destructive"
              className="h-6 px-2 text-xs"
            >
              <Square className="w-2 h-2 mr-1" />
              Parar
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={pauseTimer}
              size="sm"
              variant="secondary"
              className="h-6 px-2 text-xs"
            >
              <Pause className="w-2 h-2 mr-1" />
              Pausar
            </Button>
            <Button 
              onClick={stopTimer}
              size="sm"
              variant="destructive"
              className="h-6 px-2 text-xs"
            >
              <Square className="w-2 h-2 mr-1" />
              Parar
            </Button>
          </>
        )}
        <button 
          onClick={resetTimer}
          className="text-xs text-primary hover:underline ml-2"
          disabled={isRunning}
        >
          Reset
        </button>
      </div>
    </div>
  )
}