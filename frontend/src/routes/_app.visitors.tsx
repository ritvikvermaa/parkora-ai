import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, UserPlus, Users, Clock } from "lucide-react";

import { PageHeader, SectionCard } from "@/components/section";
import { StatCard } from "@/components/stat-card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ProtectedRoute from "../components/ProtectedRoute";

import {

getVisitors,
createVisitor,
approveVisitor,
rejectVisitor,
visitorExit

}

from "@/services/visitorService";

export const Route = createFileRoute("/_app/visitors")({

component: () => (
  <ProtectedRoute roles={["admin", "guard"]}>
    <VisitorsPage />
  </ProtectedRoute>
),

})

function VisitorsPage(){

const [visitors,setVisitors]=useState<any[]>([])

const [form,setForm]=useState({

visitorName:"",
phone:"",
vehicleNumber:"",
hostResident:"",
purpose:""

})

const loadVisitors=()=>{

getVisitors().then(data=>{

setVisitors(data.visitors || [])

})

}

useEffect(()=>{

loadVisitors()

},[])

const pending =
visitors.filter(v=>v.status==="pending")

const active =
visitors.filter(v=>v.status==="approved")

return(

<div className="space-y-6">

<PageHeader

title="Visitor Management"

description="Invitations, approvals, and history"

/>

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

<StatCard
label="Today's Visitors"
value={visitors.length}
icon={Users}
/>

<StatCard
label="Pending Approval"
value={pending.length}
icon={Clock}
/>

<StatCard
label="Currently Inside"
value={active.length}
icon={CheckCircle2}
/>

<StatCard
label="Total Visitors"
value={visitors.length}
icon={UserPlus}
/>

</div>

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

<SectionCard
title="Invite Visitor"
description="Create visitor request"
>

<form

className="space-y-3"

onSubmit={async(e)=>{

e.preventDefault()

await createVisitor(form)

setForm({

visitorName:"",
phone:"",
vehicleNumber:"",
hostResident:"",
purpose:""

})

loadVisitors()

}}

>

<Input

placeholder="Visitor Name"

value={form.visitorName}

onChange={(e)=>

setForm({

...form,

visitorName:e.target.value

})

}

/>

<Input

placeholder="Phone"

value={form.phone}

onChange={(e)=>

setForm({

...form,

phone:e.target.value

})

}

/>

<Input

placeholder="Vehicle Number"

value={form.vehicleNumber}

onChange={(e)=>

setForm({

...form,

vehicleNumber:e.target.value

})

}

/>

<Input

placeholder="Host Resident"

value={form.hostResident}

onChange={(e)=>

setForm({

...form,

hostResident:e.target.value

})

}

/>

<Textarea

placeholder="Purpose"

value={form.purpose}

onChange={(e)=>

setForm({

...form,

purpose:e.target.value

})

}

/>

<Button className="w-full">

<UserPlus className="h-4 w-4 mr-1"/>

Create Request

</Button>

</form>

</SectionCard>

<div className="lg:col-span-2">

<SectionCard

title="Pending Approvals"

description="Approve or reject"

>

<div className="space-y-3">

{

pending.map(v=>(

<div

key={v._id}

className="border rounded p-3 flex justify-between"

>

<div>

<div>

{v.visitorName}

</div>

<div className="text-xs text-muted-foreground">

{v.vehicleNumber}

</div>

</div>

<div className="flex gap-2">

<Button

size="sm"

variant="outline"

onClick={async()=>{

await rejectVisitor(v._id)

loadVisitors()

}}

>

<XCircle className="h-4 w-4"/>

</Button>

<Button

size="sm"

onClick={async()=>{

await approveVisitor(v._id)

loadVisitors()

}}

>

<CheckCircle2 className="h-4 w-4"/>

</Button>

</div>

</div>

))

}

</div>

</SectionCard>

</div>

</div>

<SectionCard

title="Visitor History"

description="All visitor records"

>

<div className="space-y-3">

{

visitors.map(v=>(

<div

key={v._id}

className="border rounded p-3 flex justify-between"

>

<div>

<div>

{v.visitorName}

</div>

<div className="text-xs text-muted-foreground">

{v.vehicleNumber}

</div>

</div>

<div className="flex gap-2 items-center">

<Badge>

{v.status}

</Badge>

{

v.status==="approved"

&&

<Button

size="sm"

onClick={async()=>{

await visitorExit(v._id)

loadVisitors()

}}

>

Exit

</Button>

}

</div>

</div>

))

}

</div>

</SectionCard>

</div>

)

}