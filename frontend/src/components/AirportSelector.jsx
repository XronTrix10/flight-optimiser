// src/components/AirportSelector.jsx
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function AirportSelector({
  airports,
  label,
  value,
  onChange,
  disabled = false,
  loading = false,
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`airport-${label}`}>{label}</Label>
      <div className="relative">
        <Select
          disabled={disabled || airports.length === 0}
          value={value?.iata_code || ""}
          onValueChange={(code) => {
            const selected = airports.find(
              (airport) => airport.iata_code === code
            );
            onChange(selected);
          }}
        >
          <SelectTrigger id={`airport-${label}`} className="w-full">
            <SelectValue placeholder={`Select ${label} Airport`} />
          </SelectTrigger>
          <SelectContent>
            {airports.length === 0 && !loading ? (
              <div className="p-2 text-sm text-gray-500">
                {label === "Destination"
                  ? "Please select a source airport first"
                  : "No airports available"}
              </div>
            ) : (
              airports.map((airport) => (
                <SelectItem key={airport.iata_code} value={airport.iata_code}>
                  {airport.name} ({airport.iata_code}) - {airport.city}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {loading && (
          <div className="absolute right-10 top-2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}
