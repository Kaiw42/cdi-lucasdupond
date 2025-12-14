import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Ruler, RefreshCw } from "lucide-react";

export function MathTools() {
  return (
    <div className="h-full overflow-auto p-4 bg-background">
      <Tabs defaultValue="calculator" className="h-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="calculator" data-testid="tab-calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Calculatrice
          </TabsTrigger>
          <TabsTrigger value="converter" data-testid="tab-converter">
            <RefreshCw className="h-4 w-4 mr-2" />
            Convertisseur
          </TabsTrigger>
          <TabsTrigger value="geometry" data-testid="tab-geometry">
            <Ruler className="h-4 w-4 mr-2" />
            Géométrie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="h-[calc(100%-60px)]">
          <ScientificCalculator />
        </TabsContent>

        <TabsContent value="converter" className="h-[calc(100%-60px)]">
          <UnitConverter />
        </TabsContent>

        <TabsContent value="geometry" className="h-[calc(100%-60px)]">
          <GeometryCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ScientificCalculator() {
  const [display, setDisplay] = useState("0");
  const [memory, setMemory] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setMemory(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (memory === null) {
      setMemory(inputValue);
    } else if (operator) {
      const currentValue = memory;
      let newValue: number;

      switch (operator) {
        case "+":
          newValue = currentValue + inputValue;
          break;
        case "-":
          newValue = currentValue - inputValue;
          break;
        case "*":
          newValue = currentValue * inputValue;
          break;
        case "/":
          if (inputValue === 0) {
            setDisplay("Erreur");
            setMemory(null);
            setOperator(null);
            setWaitingForOperand(true);
            return;
          }
          newValue = currentValue / inputValue;
          break;
        default:
          newValue = inputValue;
      }

      setDisplay(String(newValue));
      setMemory(newValue);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = () => {
    if (!operator || memory === null) return;
    performOperation("=");
    setOperator(null);
  };

  const scientificFunction = (func: string) => {
    const value = parseFloat(display);
    let result: number;

    switch (func) {
      case "sin":
        result = Math.sin((value * Math.PI) / 180);
        break;
      case "cos":
        result = Math.cos((value * Math.PI) / 180);
        break;
      case "tan":
        result = Math.tan((value * Math.PI) / 180);
        break;
      case "sqrt":
        result = Math.sqrt(value);
        break;
      case "pow2":
        result = Math.pow(value, 2);
        break;
      case "pow3":
        result = Math.pow(value, 3);
        break;
      case "log":
        result = Math.log10(value);
        break;
      case "ln":
        result = Math.log(value);
        break;
      case "pi":
        result = Math.PI;
        break;
      case "e":
        result = Math.E;
        break;
      case "percent":
        result = value / 100;
        break;
      case "negate":
        result = -value;
        break;
      default:
        result = value;
    }

    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  const buttons = [
    ["C", "(", ")", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "=", "%"],
  ];

  const scientificButtons = [
    ["sin", "cos", "tan"],
    ["sqrt", "pow2", "pow3"],
    ["log", "ln", "negate"],
    ["pi", "e"],
  ];

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Calculatrice scientifique</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="bg-muted p-4 rounded-md mb-4 text-right text-2xl font-mono overflow-x-auto"
          data-testid="calc-display"
        >
          {display}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {scientificButtons.flat().map((btn) => (
            <Button
              key={btn}
              variant="secondary"
              size="sm"
              onClick={() => scientificFunction(btn)}
              data-testid={`calc-btn-${btn}`}
            >
              {btn === "pow2" ? "x²" : btn === "pow3" ? "x³" : btn === "sqrt" ? "√" : btn === "negate" ? "+/-" : btn}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {buttons.flat().map((btn) => (
            <Button
              key={btn}
              variant={btn === "=" ? "default" : "outline"}
              onClick={() => {
                if (btn === "C") clear();
                else if (btn === "=") calculate();
                else if (btn === ".") inputDecimal();
                else if (btn === "%") scientificFunction("percent");
                else if (["+", "-", "*", "/"].includes(btn)) performOperation(btn);
                else if (!isNaN(Number(btn))) inputDigit(btn);
              }}
              data-testid={`calc-btn-${btn}`}
            >
              {btn}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UnitConverter() {
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [result, setResult] = useState("");

  const conversions: Record<string, Record<string, number>> = {
    length: {
      m: 1,
      km: 1000,
      cm: 0.01,
      mm: 0.001,
      mi: 1609.34,
      ft: 0.3048,
      in: 0.0254,
    },
    mass: {
      kg: 1,
      g: 0.001,
      mg: 0.000001,
      lb: 0.453592,
      oz: 0.0283495,
      t: 1000,
    },
    temperature: {
      c: 1,
      f: 1,
      k: 1,
    },
    area: {
      "m²": 1,
      "km²": 1000000,
      "cm²": 0.0001,
      ha: 10000,
      acre: 4046.86,
    },
    volume: {
      l: 1,
      ml: 0.001,
      "m³": 1000,
      "cm³": 0.001,
      gal: 3.78541,
    },
  };

  const unitLabels: Record<string, Record<string, string>> = {
    length: { m: "Mètre (m)", km: "Kilomètre (km)", cm: "Centimètre (cm)", mm: "Millimètre (mm)", mi: "Mile (mi)", ft: "Pied (ft)", in: "Pouce (in)" },
    mass: { kg: "Kilogramme (kg)", g: "Gramme (g)", mg: "Milligramme (mg)", lb: "Livre (lb)", oz: "Once (oz)", t: "Tonne (t)" },
    temperature: { c: "Celsius (°C)", f: "Fahrenheit (°F)", k: "Kelvin (K)" },
    area: { "m²": "Mètre carré (m²)", "km²": "Kilomètre carré (km²)", "cm²": "Centimètre carré (cm²)", ha: "Hectare (ha)", acre: "Acre" },
    volume: { l: "Litre (L)", ml: "Millilitre (mL)", "m³": "Mètre cube (m³)", "cm³": "Centimètre cube (cm³)", gal: "Gallon (gal)" },
  };

  const convert = () => {
    if (!value || !fromUnit || !toUnit) return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    if (category === "temperature") {
      let celsius: number;
      if (fromUnit === "c") celsius = numValue;
      else if (fromUnit === "f") celsius = (numValue - 32) * 5/9;
      else celsius = numValue - 273.15;

      let finalValue: number;
      if (toUnit === "c") finalValue = celsius;
      else if (toUnit === "f") finalValue = celsius * 9/5 + 32;
      else finalValue = celsius + 273.15;

      setResult(finalValue.toFixed(2));
    } else {
      const inBase = numValue * conversions[category][fromUnit];
      const converted = inBase / conversions[category][toUnit];
      setResult(converted.toFixed(6).replace(/\.?0+$/, ""));
    }
  };

  const categories = [
    { value: "length", label: "Longueur" },
    { value: "mass", label: "Masse" },
    { value: "temperature", label: "Température" },
    { value: "area", label: "Surface" },
    { value: "volume", label: "Volume" },
  ];

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Convertisseur d'unités</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={category} onValueChange={(v) => { setCategory(v); setFromUnit(""); setToUnit(""); setResult(""); }}>
          <SelectTrigger data-testid="converter-category">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Valeur"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="converter-value"
        />

        <div className="grid grid-cols-2 gap-2">
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger data-testid="converter-from">
              <SelectValue placeholder="De" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(unitLabels[category] || {}).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={toUnit} onValueChange={setToUnit}>
            <SelectTrigger data-testid="converter-to">
              <SelectValue placeholder="Vers" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(unitLabels[category] || {}).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={convert} className="w-full" data-testid="converter-convert">
          Convertir
        </Button>

        {result && (
          <div className="bg-muted p-4 rounded-md text-center">
            <span className="text-2xl font-bold" data-testid="converter-result">{result}</span>
            <span className="ml-2 text-muted-foreground">{toUnit}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GeometryCalculator() {
  const [shape, setShape] = useState("rectangle");
  const [dimensions, setDimensions] = useState<Record<string, string>>({});
  const [results, setResults] = useState<{ area?: string; perimeter?: string; volume?: string }>({});

  const shapes = [
    { value: "rectangle", label: "Rectangle", dims: ["longueur", "largeur"] },
    { value: "circle", label: "Cercle", dims: ["rayon"] },
    { value: "triangle", label: "Triangle", dims: ["base", "hauteur", "côté1", "côté2", "côté3"] },
    { value: "trapeze", label: "Trapèze", dims: ["grandeBase", "petiteBase", "hauteur", "côtéGauche", "côtéDroit"] },
    { value: "cube", label: "Cube", dims: ["côté"] },
    { value: "sphere", label: "Sphère", dims: ["rayon"] },
    { value: "cylinder", label: "Cylindre", dims: ["rayon", "hauteur"] },
  ];

  const calculate = () => {
    const d = Object.fromEntries(
      Object.entries(dimensions).map(([k, v]) => [k, parseFloat(v) || 0])
    );

    let area: number | undefined;
    let perimeter: number | undefined;
    let volume: number | undefined;

    switch (shape) {
      case "rectangle":
        area = d.longueur * d.largeur;
        perimeter = 2 * (d.longueur + d.largeur);
        break;
      case "circle":
        area = Math.PI * d.rayon * d.rayon;
        perimeter = 2 * Math.PI * d.rayon;
        break;
      case "triangle":
        area = (d.base * d.hauteur) / 2;
        perimeter = (d["côté1"] || 0) + (d["côté2"] || 0) + (d["côté3"] || 0);
        break;
      case "trapeze":
        area = ((d.grandeBase + d.petiteBase) * d.hauteur) / 2;
        perimeter = d.grandeBase + d.petiteBase + (d["côtéGauche"] || 0) + (d["côtéDroit"] || 0);
        break;
      case "cube":
        area = 6 * d["côté"] * d["côté"];
        volume = Math.pow(d["côté"], 3);
        break;
      case "sphere":
        area = 4 * Math.PI * d.rayon * d.rayon;
        volume = (4/3) * Math.PI * Math.pow(d.rayon, 3);
        break;
      case "cylinder":
        area = 2 * Math.PI * d.rayon * (d.rayon + d.hauteur);
        volume = Math.PI * d.rayon * d.rayon * d.hauteur;
        break;
    }

    setResults({
      area: area !== undefined ? area.toFixed(2) : undefined,
      perimeter: perimeter !== undefined ? perimeter.toFixed(2) : undefined,
      volume: volume !== undefined ? volume.toFixed(2) : undefined,
    });
  };

  const currentShape = shapes.find((s) => s.value === shape);

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Calculateur géométrique</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={shape} onValueChange={(v) => { setShape(v); setDimensions({}); setResults({}); }}>
          <SelectTrigger data-testid="geometry-shape">
            <SelectValue placeholder="Forme" />
          </SelectTrigger>
          <SelectContent>
            {shapes.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-2">
          {currentShape?.dims.map((dim) => (
            <Input
              key={dim}
              type="number"
              placeholder={dim.charAt(0).toUpperCase() + dim.slice(1)}
              value={dimensions[dim] || ""}
              onChange={(e) => setDimensions({ ...dimensions, [dim]: e.target.value })}
              data-testid={`geometry-input-${dim}`}
            />
          ))}
        </div>

        <Button onClick={calculate} className="w-full" data-testid="geometry-calculate">
          Calculer
        </Button>

        {(results.area || results.perimeter || results.volume) && (
          <div className="bg-muted p-4 rounded-md space-y-2">
            {results.area && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Aire / Surface:</span>
                <span className="font-bold" data-testid="geometry-area">{results.area} unités²</span>
              </div>
            )}
            {results.perimeter && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Périmètre:</span>
                <span className="font-bold" data-testid="geometry-perimeter">{results.perimeter} unités</span>
              </div>
            )}
            {results.volume && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-bold" data-testid="geometry-volume">{results.volume} unités³</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
