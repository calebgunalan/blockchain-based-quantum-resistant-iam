import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  FileText, Palette, Layout, BarChart3, Settings2, Sparkles, Download,
  Plus, Trash2, GripVertical, Image, Type, Table, PieChart, ChevronRight,
  BookOpen, Lightbulb, Shield, Cpu, Layers, Eye, Leaf
} from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  authorName: z.string().optional(),
  institution: z.string().optional(),
  slideCount: z.number().min(5).max(50),
  theoryPercentage: z.number().min(0).max(100),
  figureCount: z.number().min(0).max(30),
  chartCount: z.number().min(0).max(15),
  tableCount: z.number().min(0).max(10),
});

type FormValues = z.infer<typeof formSchema>;

interface SlideConfig {
  id: string;
  type: "title" | "content" | "diagram" | "chart" | "comparison" | "timeline" | "features" | "thankyou";
  title: string;
  contentHint: string;
}

const THEMES = [
  { id: "nature", name: "Nature Green", colors: ["#2D5016", "#4A7C2C", "#6B9F4A", "#F8FFF8"], icon: Leaf },
  { id: "quantum", name: "Quantum Tech", colors: ["#0F172A", "#38BDF8", "#8B5CF6", "#F0F9FF"], icon: Cpu },
  { id: "corporate", name: "Corporate Blue", colors: ["#1E3A5F", "#2563EB", "#60A5FA", "#F0F4FF"], icon: Shield },
  { id: "minimal", name: "Minimalist", colors: ["#18181B", "#71717A", "#D4D4D8", "#FAFAFA"], icon: Layers },
];

const SLIDE_TYPES = [
  { type: "title", label: "Title Slide", icon: Type },
  { type: "content", label: "Content / Theory", icon: BookOpen },
  { type: "diagram", label: "Diagram / Figure", icon: Image },
  { type: "chart", label: "Chart / Data", icon: BarChart3 },
  { type: "comparison", label: "Comparison Table", icon: Table },
  { type: "timeline", label: "Timeline", icon: ChevronRight },
  { type: "features", label: "Feature Cards", icon: Sparkles },
  { type: "thankyou", label: "Thank You / Q&A", icon: Lightbulb },
] as const;

const PRESETS = [
  {
    name: "Final Project Review (25-30 slides)",
    config: { slideCount: 30, theoryPercentage: 40, figureCount: 8, chartCount: 4, tableCount: 3 },
    description: "Comprehensive academic project defense presentation",
  },
  {
    name: "Quick Overview (10-15 slides)",
    config: { slideCount: 12, theoryPercentage: 30, figureCount: 4, chartCount: 2, tableCount: 1 },
    description: "Brief project summary for quick reviews",
  },
  {
    name: "Technical Deep Dive (20 slides)",
    config: { slideCount: 20, theoryPercentage: 60, figureCount: 6, chartCount: 5, tableCount: 4 },
    description: "Heavy technical content with data visualization",
  },
  {
    name: "Pitch Deck (8-10 slides)",
    config: { slideCount: 10, theoryPercentage: 20, figureCount: 3, chartCount: 2, tableCount: 1 },
    description: "Investor/stakeholder pitch with impact focus",
  },
];

export default function PresentationBuilder() {
  const [selectedTheme, setSelectedTheme] = useState("nature");
  const [theoryPct, setTheoryPct] = useState([40]);
  const [figureCount, setFigureCount] = useState([8]);
  const [chartCount, setChartCount] = useState([4]);
  const [tableCount, setTableCount] = useState([3]);
  const [slideCount, setSlideCount] = useState([30]);
  const [includeSpeakerNotes, setIncludeSpeakerNotes] = useState(true);
  const [includeAnimations, setIncludeAnimations] = useState(true);
  const [darkTitleSlides, setDarkTitleSlides] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [customSlides, setCustomSlides] = useState<SlideConfig[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Blockchain-Based Quantum-Resistant IAM",
      subtitle: "Securing Digital Identities for the Post-Quantum Era",
      authorName: "",
      institution: "",
      slideCount: 30,
      theoryPercentage: 40,
      figureCount: 8,
      chartCount: 4,
      tableCount: 3,
    },
  });

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSlideCount([preset.config.slideCount]);
    setTheoryPct([preset.config.theoryPercentage]);
    setFigureCount([preset.config.figureCount]);
    setChartCount([preset.config.chartCount]);
    setTableCount([preset.config.tableCount]);
    setValue("slideCount", preset.config.slideCount);
    setValue("theoryPercentage", preset.config.theoryPercentage);
    setValue("figureCount", preset.config.figureCount);
    setValue("chartCount", preset.config.chartCount);
    setValue("tableCount", preset.config.tableCount);
    toast.success(`Applied "${preset.name}" preset`);
  };

  const addCustomSlide = (type: string) => {
    const slideType = SLIDE_TYPES.find(s => s.type === type);
    setCustomSlides(prev => [...prev, {
      id: crypto.randomUUID(),
      type: type as SlideConfig["type"],
      title: slideType?.label || "New Slide",
      contentHint: "",
    }]);
  };

  const removeCustomSlide = (id: string) => {
    setCustomSlides(prev => prev.filter(s => s.id !== id));
  };

  const theorySlides = Math.round(slideCount[0] * (theoryPct[0] / 100));
  const visualSlides = slideCount[0] - theorySlides;

  const onGenerate = async () => {
    setIsGenerating(true);
    toast.info("Presentation generation would be triggered here. Download the pre-built PPTX from the admin panel.", { duration: 5000 });
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Presentation Builder</h1>
              <p className="text-sm text-muted-foreground">Create professional PPTX presentations with full customization</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Presets */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Presets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {PRESETS.map((preset) => (
              <Card
                key={preset.name}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => applyPreset(preset)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm text-foreground">{preset.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{preset.config.slideCount} slides</Badge>
                    <Badge variant="secondary" className="text-xs">{preset.config.theoryPercentage}% theory</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content" className="gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="design" className="gap-1.5">
                  <Palette className="h-3.5 w-3.5" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="slides" className="gap-1.5">
                  <Layout className="h-3.5 w-3.5" />
                  Slides
                </TabsTrigger>
                <TabsTrigger value="advanced" className="gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Presentation Details</CardTitle>
                    <CardDescription>Basic information for your presentation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Presentation Title *</Label>
                      <Input id="title" {...register("title")} placeholder="e.g., Blockchain-Based Quantum-Resistant IAM" />
                      {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="subtitle">Subtitle</Label>
                      <Input id="subtitle" {...register("subtitle")} placeholder="e.g., Securing Digital Identities..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="authorName">Author Name</Label>
                        <Input id="authorName" {...register("authorName")} placeholder="Your name" />
                      </div>
                      <div>
                        <Label htmlFor="institution">Institution</Label>
                        <Input id="institution" {...register("institution")} placeholder="University / Organization" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Balance</CardTitle>
                    <CardDescription>Control the ratio of theory vs. visuals in your presentation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Number of Slides</Label>
                        <span className="text-sm font-semibold text-primary">{slideCount[0]} slides</span>
                      </div>
                      <Slider value={slideCount} onValueChange={(v) => { setSlideCount(v); setValue("slideCount", v[0]); }} min={5} max={50} step={1} />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>5 (Quick)</span>
                        <span>50 (Comprehensive)</span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Theory vs. Visual Balance</Label>
                        <span className="text-sm font-semibold text-primary">{theoryPct[0]}% theory / {100 - theoryPct[0]}% visual</span>
                      </div>
                      <Slider value={theoryPct} onValueChange={(v) => { setTheoryPct(v); setValue("theoryPercentage", v[0]); }} min={10} max={90} step={5} />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>More Visuals</span>
                        <span>More Theory</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="bg-primary/5 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{theorySlides}</p>
                          <p className="text-xs text-muted-foreground">Theory Slides</p>
                        </div>
                        <div className="bg-accent/10 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-foreground">{visualSlides}</p>
                          <p className="text-xs text-muted-foreground">Visual Slides</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="text-xs">Figures</Label>
                          <span className="text-xs font-semibold">{figureCount[0]}</span>
                        </div>
                        <Slider value={figureCount} onValueChange={(v) => { setFigureCount(v); setValue("figureCount", v[0]); }} min={0} max={30} step={1} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="text-xs">Charts</Label>
                          <span className="text-xs font-semibold">{chartCount[0]}</span>
                        </div>
                        <Slider value={chartCount} onValueChange={(v) => { setChartCount(v); setValue("chartCount", v[0]); }} min={0} max={15} step={1} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="text-xs">Tables</Label>
                          <span className="text-xs font-semibold">{tableCount[0]}</span>
                        </div>
                        <Slider value={tableCount} onValueChange={(v) => { setTableCount(v); setValue("tableCount", v[0]); }} min={0} max={10} step={1} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Design Tab */}
              <TabsContent value="design" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Color Theme</CardTitle>
                    <CardDescription>Choose a professional color scheme</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {THEMES.map((theme) => {
                        const Icon = theme.icon;
                        return (
                          <div
                            key={theme.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedTheme === theme.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30"
                            }`}
                            onClick={() => setSelectedTheme(theme.id)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="h-4 w-4 text-foreground" />
                              <span className="font-semibold text-sm">{theme.name}</span>
                            </div>
                            <div className="flex gap-1.5">
                              {theme.colors.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-8 h-8 rounded-md border"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Design Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Dark Title & Closing Slides</Label>
                        <p className="text-xs text-muted-foreground">Use dark backgrounds for title and thank you slides</p>
                      </div>
                      <Switch checked={darkTitleSlides} onCheckedChange={setDarkTitleSlides} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Include Animations</Label>
                        <p className="text-xs text-muted-foreground">Fade-in effects for bullet points</p>
                      </div>
                      <Switch checked={includeAnimations} onCheckedChange={setIncludeAnimations} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Speaker Notes</Label>
                        <p className="text-xs text-muted-foreground">Auto-generate talking points for each slide</p>
                      </div>
                      <Switch checked={includeSpeakerNotes} onCheckedChange={setIncludeSpeakerNotes} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Slides Tab */}
              <TabsContent value="slides" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Slide Structure</CardTitle>
                    <CardDescription>Add custom slides or use auto-generated structure</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {SLIDE_TYPES.map((st) => {
                        const Icon = st.icon;
                        return (
                          <Button
                            key={st.type}
                            variant="outline"
                            size="sm"
                            onClick={() => addCustomSlide(st.type)}
                            className="gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <Icon className="h-3.5 w-3.5" />
                            {st.label}
                          </Button>
                        );
                      })}
                    </div>

                    <Separator />

                    {customSlides.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layout className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No custom slides added yet.</p>
                        <p className="text-xs mt-1">The builder will auto-generate a recommended structure based on your settings.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customSlides.map((slide, idx) => {
                          const st = SLIDE_TYPES.find(s => s.type === slide.type);
                          const Icon = st?.icon || FileText;
                          return (
                            <div key={slide.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                              <Badge variant="outline" className="gap-1">
                                <Icon className="h-3 w-3" />
                                {st?.label}
                              </Badge>
                              <Input
                                value={slide.title}
                                onChange={(e) => {
                                  setCustomSlides(prev =>
                                    prev.map(s => s.id === slide.id ? { ...s, title: e.target.value } : s)
                                  );
                                }}
                                className="flex-1 h-8 text-sm"
                                placeholder="Slide title"
                              />
                              <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => removeCustomSlide(slide.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Advanced Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Presentation Aspect Ratio</Label>
                      <Select defaultValue="16:9">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                          <SelectItem value="16:10">Widescreen (16:10)</SelectItem>
                          <SelectItem value="4:3">Standard (4:3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Heading Font</Label>
                      <Select defaultValue="montserrat">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="montserrat">Montserrat</SelectItem>
                          <SelectItem value="arial">Arial</SelectItem>
                          <SelectItem value="georgia">Georgia</SelectItem>
                          <SelectItem value="calibri">Calibri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Body Font</Label>
                      <Select defaultValue="opensans">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="opensans">Open Sans</SelectItem>
                          <SelectItem value="arial">Arial</SelectItem>
                          <SelectItem value="calibri">Calibri</SelectItem>
                          <SelectItem value="garamond">Garamond</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Additional Instructions</Label>
                      <Textarea
                        placeholder="Add any custom instructions, specific content to include, or special formatting requirements..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Preview & Summary */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Build Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Slides</span>
                    <span className="font-semibold">{slideCount[0]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Theory / Visual</span>
                    <span className="font-semibold">{theoryPct[0]}% / {100 - theoryPct[0]}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Figures</span>
                    <span className="font-semibold">{figureCount[0]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Charts</span>
                    <span className="font-semibold">{chartCount[0]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tables</span>
                    <span className="font-semibold">{tableCount[0]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Theme</span>
                    <span className="font-semibold capitalize">{selectedTheme}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Custom Slides</span>
                    <span className="font-semibold">{customSlides.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Speaker Notes</span>
                    <span className="font-semibold">{includeSpeakerNotes ? "Yes" : "No"}</span>
                  </div>
                </div>

                <Separator />

                {/* Slide breakdown */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Estimated Breakdown</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Title + Intro", count: 2, color: "bg-primary" },
                      { label: "Problem & Solution", count: Math.max(2, Math.round(slideCount[0] * 0.12)), color: "bg-primary/80" },
                      { label: "Technical Content", count: theorySlides - 4, color: "bg-primary/60" },
                      { label: "Visuals & Data", count: Math.round(visualSlides * 0.5), color: "bg-accent" },
                      { label: "Use Cases", count: Math.max(1, Math.round(slideCount[0] * 0.1)), color: "bg-primary/40" },
                      { label: "Conclusion", count: 2, color: "bg-primary/30" },
                    ].filter(s => s.count > 0).map((section) => (
                      <div key={section.label} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-sm ${section.color}`} />
                        <span className="text-xs flex-1 text-muted-foreground">{section.label}</span>
                        <span className="text-xs font-medium">{section.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={onGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Generate Presentation
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Output: .pptx format with speaker notes
                </p>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tip1" className="border-none">
                    <AccordionTrigger className="text-xs py-2">Theory vs. Visual Balance</AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground">
                      For academic reviews, 40-50% theory works well. For pitches, keep theory under 30%.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="tip2" className="border-none">
                    <AccordionTrigger className="text-xs py-2">Optimal Slide Count</AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground">
                      Plan ~1 minute per slide. A 20-minute presentation needs 18-22 slides.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="tip3" className="border-none">
                    <AccordionTrigger className="text-xs py-2">Figure Placement</AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground">
                      Include at least 1 architecture diagram, 1 comparison table, and 1 performance chart.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
