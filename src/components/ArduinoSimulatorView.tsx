import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Code, 
  Terminal, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  FolderOpen, 
  BookOpen, 
  Sliders, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2, 
  Palette, 
  Lightbulb,
  Check,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Volume2
} from 'lucide-react';
import { 
  PlacedComponent, 
  CircuitWire, 
  WireColor, 
  ArduinoPinInfo, 
  BreadboardHole, 
  CircuitValidationError, 
  ComponentType,
  PresetExperiment,
  CircuitProject
} from '../types/simulator';
import { ARDUINO_PINS, COMPONENT_CATALOG, PRESET_EXPERIMENTS } from '../data/simulatorData';
import { validateCircuit, simulateCircuitLogic } from '../utils/circuitEngine';
import { ArduinoBoardSvg } from './ArduinoBoardSvg';
import { BreadboardSvg } from './BreadboardSvg';
import { CircuitWiringSvg } from './CircuitWiringSvg';
import { ArduinoSerialMonitor } from './ArduinoSerialMonitor';

export const ArduinoSimulatorView: React.FC = () => {
  // Navigation Modes: Free Lab ('sandbox'), Guided Step-by-Step ('guided'), or Quiz Self-Test ('quiz')
  const [activeMode, setActiveMode] = useState<'sandbox' | 'guided' | 'quiz' | 'experiments'>('sandbox');

  // Selected Preset Experiment
  const [selectedExperiment, setSelectedExperiment] = useState<PresetExperiment>(PRESET_EXPERIMENTS[0]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Circuit State: Components and Wires
  const [components, setComponents] = useState<PlacedComponent[]>([]);
  const [wires, setWires] = useState<CircuitWire[]>([]);

  // Wire Connection State
  const [selectedWireColor, setSelectedWireColor] = useState<WireColor>('red');
  const [pendingWireStart, setPendingWireStart] = useState<{ id: string; x: number; y: number } | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Inspector & Info
  const [inspectedPin, setInspectedPin] = useState<ArduinoPinInfo | null>(null);
  const [inspectedHole, setInspectedHole] = useState<BreadboardHole | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<PlacedComponent | null>(null);

  // Validation Errors
  const [validationErrors, setValidationErrors] = useState<CircuitValidationError[]>([]);
  const [highlightedPoints, setHighlightedPoints] = useState<string[]>([]);

  // Code & Simulation State
  const [arduinoCode, setArduinoCode] = useState(PRESET_EXPERIMENTS[0].defaultCode);
  const [isSimulating, setIsSimulating] = useState(false);
  const [serialLogs, setSerialLogs] = useState<string[]>([
    'Arduino Simulator v2.0 Ready.',
    'Click [تشغيل المحاكاة ▶] to execute the circuit logic.'
  ]);
  const [simTick, setSimTick] = useState(0);

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<'board' | 'code' | 'serial' | 'guide'>('board');

  // AI "Explain to Me" State
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Saved Projects in LocalStorage
  const [savedProjects, setSavedProjects] = useState<CircuitProject[]>(() => {
    try {
      const stored = localStorage.getItem('mechatronics_saved_circuits_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Reference for Canvas Coordinate Mapping
  const stageRef = useRef<HTMLDivElement>(null);

  // Generate lookup coordinate map for wires
  const pointLookup = React.useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    // Arduino Pins (Offset in top container)
    ARDUINO_PINS.forEach((pin) => {
      map.set(pin.id, { x: pin.x, y: pin.y });
    });
    // Breadboard Holes
    // Top rails
    for (let c = 1; c <= 30; c++) {
      const cx = 60 + (c - 1) * 19;
      map.set(`top_power_${c}`, { x: cx, y: 395 });
      map.set(`top_ground_${c}`, { x: cx, y: 412 });
      map.set(`bottom_power_${c}`, { x: cx, y: 635 });
      map.set(`bottom_ground_${c}`, { x: cx, y: 652 });
    }
    // Rows
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    rows.forEach((r, rIdx) => {
      const baseCy = rIdx < 5 ? 445 + rIdx * 16 : 540 + (rIdx - 5) * 16;
      for (let c = 1; c <= 30; c++) {
        const cx = 60 + (c - 1) * 19;
        map.set(`${r}_${c}`, { x: cx, y: baseCy });
      }
    });
    return map;
  }, []);

  // Circuit Validation on every change
  useEffect(() => {
    const errors = validateCircuit(components, wires);
    setValidationErrors(errors);

    // If fatal short circuit, play an audio warning if available and alert
    const hasFatal = errors.some((e) => e.category === 'short_circuit');
    if (hasFatal) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {
        // Audio optional
      }
    }
  }, [components, wires]);

  // Simulation Loop Tick
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimTick((prev) => prev + 1);

        const { updatedComponents, serialLogs: newLogs } = simulateCircuitLogic(
          components,
          wires,
          true,
          simTick
        );
        setComponents(updatedComponents);

        // Generate serial log streams based on active components
        if (simTick % 2 === 0) {
          const hasLed = components.some((c) => c.type === 'led' && c.state?.isLit);
          const ultrasonic = components.find((c) => c.type === 'ultrasonic');
          const pot = components.find((c) => c.type === 'potentiometer');

          if (ultrasonic) {
            setSerialLogs((prev) => [...prev.slice(-30), `Distance: ${ultrasonic.state?.distanceCm || 25} cm`]);
          } else if (pot) {
            setSerialLogs((prev) => [...prev.slice(-30), `Potentiometer A0: ${pot.state?.potValue || 512}`]);
          } else if (hasLed) {
            setSerialLogs((prev) => [...prev.slice(-30), `Digital Pin 13: ${simTick % 4 === 0 ? 'HIGH (5V)' : 'LOW (0V)'}`]);
          }
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isSimulating, simTick, components, wires]);

  // Handle Pin Click to Start / End Wire
  const handlePinClick = (pin: ArduinoPinInfo) => {
    setInspectedPin(pin);
    handleConnectPoint(pin.id, pin.x, pin.y, 'arduino_pin');
  };

  // Handle Hole Click to Start / End Wire
  const handleHoleClick = (hole: BreadboardHole) => {
    setInspectedHole(hole);
    // Offset for breadboard in visual canvas
    handleConnectPoint(hole.id, hole.x, hole.y + 360, 'breadboard_hole');
  };

  const handleConnectPoint = (
    pointId: string,
    x: number,
    y: number,
    type: 'arduino_pin' | 'breadboard_hole'
  ) => {
    if (!pendingWireStart) {
      // Start Wire
      setPendingWireStart({ id: pointId, x, y });
    } else {
      // End Wire
      if (pendingWireStart.id === pointId) {
        // Cancel if clicking same point
        setPendingWireStart(null);
        return;
      }

      // Add new wire
      const newWire: CircuitWire = {
        id: `wire_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        fromId: pendingWireStart.id,
        toId: pointId,
        fromType: 'arduino_pin',
        toType: type,
        color: selectedWireColor,
      };

      setWires((prev) => [...prev, newWire]);
      setPendingWireStart(null);
      setCursorPos(null);
    }
  };

  // Handle Component Placement onto Breadboard
  const handleAddComponent = (type: ComponentType) => {
    const catalogItem = COMPONENT_CATALOG.find((c) => c.type === type);
    if (!catalogItem) return;

    // Pick reasonable default holes based on component count
    const offsetCol = (components.length * 3) % 25 + 5;
    const newComp: PlacedComponent = {
      id: `comp_${Date.now()}`,
      type,
      name: catalogItem.name,
      x: 60 + offsetCol * 19,
      y: 450,
      state: { ...catalogItem.defaultState },
      pins: [
        {
          id: type === 'led' ? 'anode' : 'pin1',
          label: type === 'led' ? 'Anode (+)' : 'Pin 1',
          description: 'طرف التوصيل الأول',
          relativeX: 0,
          relativeY: 0,
          assignedHoleId: `C_${offsetCol}`,
        },
        {
          id: type === 'led' ? 'cathode' : 'pin2',
          label: type === 'led' ? 'Cathode (-)' : 'Pin 2',
          description: 'طرف التوصيل الثاني',
          relativeX: 19,
          relativeY: 0,
          assignedHoleId: `C_${offsetCol + 2}`,
        },
      ],
    };

    setComponents((prev) => [...prev, newComp]);
    setSelectedComponent(newComp);
  };

  // Quick Preset Loader
  const handleLoadExperiment = (exp: PresetExperiment) => {
    setSelectedExperiment(exp);
    setArduinoCode(exp.defaultCode);
    setCurrentStepIndex(0);
    setSerialLogs([`Loaded Experiment: ${exp.title}`, 'Ready to wire.']);

    // Pre-seed matching components
    if (exp.id === 'exp_1_led_blink') {
      const ledComp: PlacedComponent = {
        id: 'led_exp_1',
        type: 'led',
        name: 'دايود LED أحمر',
        x: 250,
        y: 445,
        state: { color: '#ef4444', isLit: false, brightness: 0 },
        pins: [
          { id: 'anode', label: 'Anode (+)', description: 'الطرف الموجب', relativeX: 0, relativeY: 0, assignedHoleId: 'C_10' },
          { id: 'cathode', label: 'Cathode (-)', description: 'الطرف السالب', relativeX: 19, relativeY: 0, assignedHoleId: 'C_12' },
        ],
      };
      const rComp: PlacedComponent = {
        id: 'res_exp_1',
        type: 'resistor',
        name: 'مقاومة 220Ω',
        x: 250,
        y: 475,
        state: { resistance: 220 },
        pins: [
          { id: 'pin1', label: 'Pin 1', description: 'طرف المقاومة 1', relativeX: 0, relativeY: 0, assignedHoleId: 'B_10' },
          { id: 'pin2', label: 'Pin 2', description: 'طرف المقاومة 2', relativeX: 38, relativeY: 0, assignedHoleId: 'B_6' },
        ],
      };
      setComponents([ledComp, rComp]);
      // Connect ready wires for demonstration
      setWires([
        { id: 'w1', fromId: 'D13', toId: 'A_6', fromType: 'arduino_pin', toType: 'breadboard_hole', color: 'yellow' },
        { id: 'w2', fromId: 'GND_1', toId: 'top_ground_12', fromType: 'arduino_pin', toType: 'breadboard_hole', color: 'black' },
        { id: 'w3', fromId: 'top_ground_12', toId: 'A_12', fromType: 'breadboard_hole', toType: 'breadboard_hole', color: 'black' },
      ]);
    } else {
      // Clear board for other experiments
      setComponents([]);
      setWires([]);
    }
  };

  // AI "Explain To Me" Integration
  const handleAiExplain = async () => {
    setIsExplaining(true);
    setAiExplanation(null);
    try {
      const response = await fetch('/api/assignment/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: `أنت أستاذ ومحاضر ميكاترونكس وهندسة كهربائية تشرح لطالب مبتدئ. 
اشرح بأسلوب مبسط وممتع بالعربية:
1. وظيفة العناصر الموجودة في الدائرة (${components.map((c) => c.name).join(', ') || 'لا توجد مكونات بعد'}).
2. كيف تتدفق الإلكترونات من Arduino إلى Breadboard.
3. لماذا نستخدم مقاومة حماية مع الـ LED.
4. تفسير الأخطاء إن وُجدت (${validationErrors.map((e) => e.title).join(' | ') || 'الدائرة سليمة'}).
5. نصيحة للمهندس في هذا المشروع.`,
          sectionTitle: 'شرح هندسي لدائرة الأردوينو',
          currentContent: 'شرح مبسط لمكونات الدائرة',
          subject: 'محاكي الأردوينو والدوائر الإلكترونية',
        }),
      });
      const data = await response.json();
      setAiExplanation(data.refinedContent || 'هذه الدائرة توضح كيفية توصيل أطراف التحكم الرقمية بالأحمال عبر لوحة التجارب مع ضمان حماية المكونات من التيارات الزائدة.');
    } catch {
      setAiExplanation('الدايود الضوئي (LED) عنصر شبه موصل يسمح بمرور التيار باتجاه واحد. عند توصيل المنفذ 13 بـ HIGH يمر تيار بجهد 5V عبر مقاومة الحماية 220Ω إلى أنود الـ LED ثم يعود للأرضي GND، مما يضيء الدايود بأمان تام.');
    } finally {
      setIsExplaining(false);
    }
  };

  // Save / Load Project
  const handleSaveProject = () => {
    const name = window.prompt('أدخل اسم المشروع لحفظه:', `مشروع ميكاترونكس ${new Date().toLocaleTimeString('ar-EG')}`);
    if (!name) return;

    const newProject: CircuitProject = {
      id: `proj_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      components,
      wires,
      arduinoCode,
    };

    const updated = [newProject, ...savedProjects];
    setSavedProjects(updated);
    try {
      localStorage.setItem('mechatronics_saved_circuits_v1', JSON.stringify(updated));
      alert('✓ تم حفظ المشروع بنجاح في متصفحك!');
    } catch {
      alert('تعذر حفظ المشروع محلياً.');
    }
  };

  // Reset Circuit
  const handleResetCircuit = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في إعادة ضبط الدائرة وحذف جميع المكونات والأسلاك؟')) {
      setComponents([]);
      setWires([]);
      setPendingWireStart(null);
      setValidationErrors([]);
      setIsSimulating(false);
      setSerialLogs(['Circuit Reset.', 'Ready.']);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Header Controls Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Title & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white">محاكي Arduino والدوائر الإلكترونية</h1>
              <span className="bg-cyan-500/10 text-cyan-400 text-[11px] px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">
                Interactive Lab
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              مختبر تفاعلي للتركيب، التوصيل، فحص الأخطاء والمحاكاة المنطقية الحقيقية
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveMode('sandbox')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              activeMode === 'sandbox' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            المختبر الحر
          </button>
          <button
            onClick={() => setActiveMode('guided')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              activeMode === 'guided' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎓 تعلم خطوة بخطوة
          </button>
          <button
            onClick={() => setActiveMode('quiz')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              activeMode === 'quiz' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            🧪 اختبر نفسك
          </button>
          <button
            onClick={() => setActiveMode('experiments')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              activeMode === 'experiments' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            تجارب جاهزة
          </button>
        </div>

        {/* Actions (Simulate, Reset, Save, Explain) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isSimulating
                ? 'bg-amber-500 hover:bg-amber-600 text-black'
                : 'bg-emerald-500 hover:bg-emerald-600 text-black'
            }`}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? 'إيقاف المحاكاة' : 'تشغيل المحاكاة ▶'}
          </button>

          <button
            onClick={handleAiExplain}
            disabled={isExplaining}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-300 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {isExplaining ? 'جاري التحليل...' : '🤖 اشرح لي'}
          </button>

          <button
            onClick={handleSaveProject}
            title="حفظ المشروع"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetCircuit}
            title="إعادة ضبط الدائرة"
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Interactive Canvas & Simulator */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950 border-r border-slate-800">
          {/* Sub-tools Bar (Color Picker, Zoom, Status) */}
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Wire Color Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">لون السلك:</span>
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['red', 'black', 'yellow', 'blue', 'green', 'orange'] as WireColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedWireColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      selectedWireColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor:
                        c === 'red'
                          ? '#ef4444'
                          : c === 'black'
                          ? '#0f172a'
                          : c === 'yellow'
                          ? '#eab308'
                          : c === 'blue'
                          ? '#3b82f6'
                          : c === 'green'
                          ? '#10b981'
                          : '#f97316',
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            {/* Wire Connection Status Guide */}
            {pendingWireStart ? (
              <div className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-lg border border-cyan-500/40 text-[11px] animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                انقر على نقطة النهاية لإتمام توصيل السلك
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 hidden sm:block">
                طريقة التوصيل: انقر على أي منفذ أو فتحة لبدء سلك، ثم انقر على نقطة الوجهة
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
                className="p-1 hover:text-cyan-400 text-slate-400"
                title="تصغير"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 font-mono text-[10px] text-slate-300">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
                className="p-1 hover:text-cyan-400 text-slate-400"
                title="تكبير"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:text-cyan-400 text-slate-400"
                title="إعادة ضبط الرؤية"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Validation Alert Banners if any */}
          {validationErrors.length > 0 && (
            <div className="p-3 bg-rose-950/40 border-b border-rose-500/30 space-y-2">
              {validationErrors.map((err) => (
                <div
                  key={err.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl text-xs border ${
                    err.severity === 'error'
                      ? 'bg-rose-950/80 border-rose-500/40 text-rose-200'
                      : 'bg-amber-950/80 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${err.severity === 'error' ? 'text-rose-400' : 'text-amber-400'}`} />
                  <div className="flex-1">
                    <span className="font-bold block">{err.title}</span>
                    <span className="text-[11px] opacity-90">{err.message}</span>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>💡 الحل: {err.suggestedFix}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Circuit Stage (Scrollable & Zoomable) */}
          <div
            ref={stageRef}
            className="flex-1 overflow-auto p-4 flex flex-col items-center justify-start relative select-none"
            style={{
              backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            <div
              className="relative transition-transform duration-100 origin-top flex flex-col gap-6"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Wiring SVG Overlay */}
              <CircuitWiringSvg
                wires={wires}
                pendingWireStart={pendingWireStart}
                cursorPos={cursorPos}
                selectedWireColor={selectedWireColor}
                onRemoveWire={(wId) => setWires((prev) => prev.filter((w) => w.id !== wId))}
                pointLookup={pointLookup}
              />

              {/* 1. Arduino Board View */}
              <ArduinoBoardSvg
                selectedPinId={inspectedPin?.id || null}
                onSelectPin={handlePinClick}
                onStartWireFromPin={(pId) => {
                  const pin = ARDUINO_PINS.find((p) => p.id === pId);
                  if (pin) handlePinClick(pin);
                }}
                highlightedPins={highlightedPoints}
                isSimulating={isSimulating}
              />

              {/* 2. Breadboard View with Components */}
              <BreadboardSvg
                selectedHoleId={inspectedHole?.id || null}
                onSelectHole={handleHoleClick}
                onStartWireFromHole={(hId) => {
                  handleConnectPoint(hId, 0, 0, 'breadboard_hole');
                }}
                components={components}
                onSelectComponent={(comp) => setSelectedComponent(comp)}
              />
            </div>
          </div>

          {/* Bottom Component Palette Drawer (Mobile & Desktop Friendly) */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <div className="flex items-center justify-between pb-2 text-xs text-slate-400">
              <span className="font-bold text-slate-200">مكتبة المكونات الإلكترونية (انقر لإضافة المكون للوحة):</span>
              <span>{components.length} مكون في الدائرة</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {COMPONENT_CATALOG.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddComponent(item.type)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/50 transition-all shrink-0 min-w-[76px] group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                  <span className="text-[10px] font-semibold text-slate-300 text-center line-clamp-1">
                    {item.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Code Editor, Serial Monitor, Guided Step-by-Step, AI Tutor */}
        <div className="w-full lg:w-96 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col">
          {/* Tabs Bar */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 text-xs">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex-1 py-3 text-center font-bold border-b-2 transition-all ${
                activeTab === 'board'
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              التحكم والمعلومات
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-3 text-center font-bold border-b-2 transition-all ${
                activeTab === 'code'
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              الكود البرمجي
            </button>
            <button
              onClick={() => setActiveTab('serial')}
              className={`flex-1 py-3 text-center font-bold border-b-2 transition-all ${
                activeTab === 'serial'
                  ? 'border-cyan-400 text-cyan-400 bg-slate-900/50'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Serial Monitor
            </button>
          </div>

          {/* Tab Content 1: Board Info & Inspector */}
          {activeTab === 'board' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {/* Pin / Hole Inspector Box */}
              {inspectedPin && (
                <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span>منفذ: {inspectedPin.label} ({inspectedPin.id})</span>
                    <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded">{inspectedPin.type}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{inspectedPin.description}</p>
                  {inspectedPin.voltage !== undefined && (
                    <div className="text-[11px] text-slate-400 pt-1">
                      الجهد الكهربائي: <strong className="text-cyan-400">{inspectedPin.voltage}V</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Guided Step-by-Step Box if in Guided Mode */}
              {activeMode === 'guided' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">🎓 خطوة بخطوة: {selectedExperiment.title}</span>
                    <span className="text-[11px] text-slate-400">
                      الخطوة {currentStepIndex + 1} من {selectedExperiment.steps.length}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <h4 className="font-bold text-white text-sm">
                      {selectedExperiment.steps[currentStepIndex]?.title}
                    </h4>
                    <p className="text-slate-300 leading-relaxed">
                      {selectedExperiment.steps[currentStepIndex]?.instruction}
                    </p>
                    <p className="text-slate-500 text-[11px] italic pt-1">
                      💡 {selectedExperiment.steps[currentStepIndex]?.detail}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      disabled={currentStepIndex === 0}
                      onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-white"
                    >
                      السابق
                    </button>
                    <button
                      disabled={currentStepIndex >= selectedExperiment.steps.length - 1}
                      onClick={() => setCurrentStepIndex((i) => Math.min(selectedExperiment.steps.length - 1, i + 1))}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-bold disabled:opacity-40 hover:bg-cyan-400"
                    >
                      التالي
                    </button>
                  </div>
                </div>
              )}

              {/* AI Explanation Result Box */}
              {aiExplanation && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>تفسير الذكاء الاصطناعي للمهندس:</span>
                  </div>
                  <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-line bg-slate-950/70 p-3 rounded-xl border border-indigo-500/20">
                    {aiExplanation}
                  </div>
                </div>
              )}

              {/* Experiment Selector List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 block">التجارب الجاهزة المعتمدة:</span>
                <div className="space-y-1.5">
                  {PRESET_EXPERIMENTS.map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => handleLoadExperiment(exp)}
                      className={`w-full text-right p-2.5 rounded-xl border transition-all ${
                        selectedExperiment.id === exp.id
                          ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{exp.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {exp.level}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-1 line-clamp-1">{exp.summary}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Arduino C++ Code Editor */}
          {activeTab === 'code' && (
            <div className="flex-1 p-3 flex flex-col font-mono text-xs">
              <div className="flex items-center justify-between pb-2 text-[11px] text-slate-400">
                <span>main.ino (Arduino C++)</span>
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <Play className="w-3 h-3" />
                  تشغيل الكود
                </button>
              </div>
              <textarea
                value={arduinoCode}
                onChange={(e) => setArduinoCode(e.target.value)}
                className="flex-1 w-full bg-slate-950 text-emerald-400 p-3 rounded-xl border border-slate-800 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed resize-none selection:bg-emerald-900"
                spellCheck={false}
              />
            </div>
          )}

          {/* Tab Content 3: Serial Monitor */}
          {activeTab === 'serial' && (
            <div className="flex-1 p-3 flex flex-col">
              <ArduinoSerialMonitor
                logs={serialLogs}
                onClearLogs={() => setSerialLogs([])}
                isRunning={isSimulating}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
