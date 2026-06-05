import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ProtectedRoute from "../components/ProtectedRoute";

import {
Sparkles,
AlertTriangle,
Activity,
Brain,
Zap
}

from "lucide-react";

import {
PageHeader,
SectionCard
}

from "@/components/section";

import {
StatCard
}

from "@/components/stat-card";

import {
Badge
}

from "@/components/ui/badge";

import {
Button
}

from "@/components/ui/button";

import {

getViolations,
getRecommendation,
getSlots,
getVehicles,
getVisitors

}

from "@/services/aiService";

export const Route = createFileRoute("/_app/ai-insights")({

component: () => (
  <ProtectedRoute roles={["admin"]}>
    <AIInsights />
  </ProtectedRoute>
),

})

function AIInsights(){

const [violations,setViolations]=useState<any[]>([])

const [recommendation,setRecommendation]=
useState<any>(null)

const [slotCount,setSlotCount]=useState(0)

const [vehicleCount,setVehicleCount]=useState(0)

const [visitorCount,setVisitorCount]=useState(0)

const loadData=async()=>{

const vio=
await getViolations()

setViolations(
vio.violations || []
)

const rec=
await getRecommendation(
"A",
"Ground"
)

setRecommendation(
rec.recommendedSlot
)

const slots=
await getSlots()

setSlotCount(
slots.count || 0
)

const vehicles=
await getVehicles()

setVehicleCount(
vehicles.count || 0
)

const visitors=
await getVisitors()

setVisitorCount(

visitors.count || 0

)

}

useEffect(()=>{

loadData()

},[])

return(

<div className="space-y-6">

<PageHeader

title="AI Insights"

description="Smart analytics and parking intelligence"

actions={

<Badge>

<Sparkles className="h-3 w-3 mr-1"/>

AI Powered

</Badge>

}

/>

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

<StatCard

label="Active Vehicles"

value={vehicleCount}

icon={Activity}

/>

<StatCard

label="Visitors"

value={visitorCount}

icon={Brain}

/>

<StatCard

label="Violations"

value={violations.length}

icon={AlertTriangle}

/>

<StatCard

label="Parking Slots"

value={slotCount}

icon={Zap}

/>

</div>

<SectionCard

title="Smart Recommendation"

description="AI Slot Recommendation"

>

{

recommendation ?

<div className="space-y-2">

<div className="text-lg font-semibold">

Recommended:

{

recommendation.slot.slotNumber

}

</div>

<div>

Score:

{

recommendation.score

}

</div>

<div>

Tower:

{

recommendation.slot.tower

}

</div>

</div>

:

<div>

No recommendation

</div>

}

</SectionCard>

<SectionCard

title="Violation Detection"

description="Detected anomalies"

>

<div className="space-y-3">

{

violations.length===0

?

<div>

No violations detected

</div>

:

violations.map((v,index)=>(

<div

key={index}

className="border rounded p-3"

>

<div className="font-medium">

{v.type}

</div>

<div className="text-sm">

{v.vehicle}

</div>

<div className="text-xs text-muted-foreground">

{v.message}

</div>

</div>

))

}

</div>

</SectionCard>

<Button onClick={loadData}>

Refresh Insights

</Button>

</div>

)

}