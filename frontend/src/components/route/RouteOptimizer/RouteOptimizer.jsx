// src/components/route/RouteOptimizer/RouteOptimizer.jsx
import React, { useState } from "react";
import { optimizeRoute } from "../../../services/api/routes";
import OptimizationControls from "./OptimizationControls";
import OptimizationResults from "./OptimizationResults";

const RouteOptimizer = ({ route, onRouteOptimized }) => {
  const [optimizationMethod, setOptimizationMethod] = useState("aco");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const result = await optimizeRoute(route.id, optimizationMethod);
      setOptimizedRoute(result);
      onRouteOptimized(result);
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="route-optimizer">
      <h3>Route Optimization</h3>
      <OptimizationControls
        method={optimizationMethod}
        onChangeMethod={setOptimizationMethod}
        onOptimize={handleOptimize}
        isOptimizing={isOptimizing}
      />
      {optimizedRoute && (
        <OptimizationResults
          originalRoute={route}
          optimizedRoute={optimizedRoute}
        />
      )}
    </div>
  );
};

export default RouteOptimizer;
