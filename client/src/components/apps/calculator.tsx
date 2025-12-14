import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
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
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result: number;

      switch (operation) {
        case "+":
          result = currentValue + inputValue;
          break;
        case "-":
          result = currentValue - inputValue;
          break;
        case "*":
          result = currentValue * inputValue;
          break;
        case "/":
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        default:
          result = inputValue;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = () => {
    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    let result: number;

    switch (operation) {
      case "+":
        result = previousValue + inputValue;
        break;
      case "-":
        result = previousValue - inputValue;
        break;
      case "*":
        result = previousValue * inputValue;
        break;
      case "/":
        result = inputValue !== 0 ? previousValue / inputValue : 0;
        break;
      default:
        result = inputValue;
    }

    setDisplay(String(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const buttonClass = "h-12 text-lg font-medium";

  return (
    <div className="flex flex-col h-full bg-background p-4">
      <div className="bg-muted rounded-md p-4 mb-4">
        <div className="text-right text-3xl font-mono truncate" data-testid="calc-display">
          {display}
        </div>
        {operation && previousValue !== null && (
          <div className="text-right text-sm text-muted-foreground">
            {previousValue} {operation}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 flex-1">
        <Button variant="secondary" className={buttonClass} onClick={clear} data-testid="calc-clear">
          C
        </Button>
        <Button variant="secondary" className={buttonClass} onClick={backspace} data-testid="calc-backspace">
          <Delete className="h-5 w-5" />
        </Button>
        <Button variant="secondary" className={buttonClass} onClick={() => performOperation("/")} data-testid="calc-divide">
          ÷
        </Button>
        <Button variant="secondary" className={buttonClass} onClick={() => performOperation("*")} data-testid="calc-multiply">
          ×
        </Button>

        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("7")} data-testid="calc-7">
          7
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("8")} data-testid="calc-8">
          8
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("9")} data-testid="calc-9">
          9
        </Button>
        <Button variant="secondary" className={buttonClass} onClick={() => performOperation("-")} data-testid="calc-subtract">
          −
        </Button>

        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("4")} data-testid="calc-4">
          4
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("5")} data-testid="calc-5">
          5
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("6")} data-testid="calc-6">
          6
        </Button>
        <Button variant="secondary" className={buttonClass} onClick={() => performOperation("+")} data-testid="calc-add">
          +
        </Button>

        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("1")} data-testid="calc-1">
          1
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("2")} data-testid="calc-2">
          2
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputDigit("3")} data-testid="calc-3">
          3
        </Button>
        <Button className={`${buttonClass} row-span-2`} onClick={calculate} data-testid="calc-equals">
          =
        </Button>

        <Button variant="outline" className={`${buttonClass} col-span-2`} onClick={() => inputDigit("0")} data-testid="calc-0">
          0
        </Button>
        <Button variant="outline" className={buttonClass} onClick={inputDecimal} data-testid="calc-decimal">
          ,
        </Button>
      </div>
    </div>
  );
}
