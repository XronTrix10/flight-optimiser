// src/components/AircraftSelector.jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AircraftSelector({
  aircraft,
  value,
  onChange,
  disabled = false,
}) {
  // Use simplified model names for UI
  const aircraftTypes = [
    { model: "Jet", display: "Jet Aircraft" },
    { model: "Piston", display: "Piston Engine Aircraft" },
    { model: "Turboprop", display: "Turboprop Aircraft" },
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="aircraft-select">Aircraft Type</Label>
      <Select
        disabled={disabled}
        value={value?.model || ""}
        onValueChange={(model) => {
          const selected = aircraftTypes.find((ac) => ac.model === model);
          onChange(selected);
        }}
      >
        <SelectTrigger id="aircraft-select" className="w-full">
          <SelectValue placeholder="Select Aircraft Type" />
        </SelectTrigger>
        <SelectContent>
          {aircraftTypes.map((ac) => (
            <SelectItem key={ac.model} value={ac.model}>
              {ac.display}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
